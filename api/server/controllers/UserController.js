const { FileSources, SystemRoles } = require('librechat-data-provider');
const {
  Balance,
  getFiles,
  updateUser,
  deleteFiles,
  deleteConvos,
  deletePresets,
  deleteMessages,
  deleteUserById,
  deleteAllUserSessions,
  countUsers,
} = require('~/models');
const User = require('~/models/User');
const { updateUserPluginAuth, deleteUserPluginAuth } = require('~/server/services/PluginService');
const { updateUserPluginsService, deleteUserKey } = require('~/server/services/UserService');
const { verifyEmail, resendVerificationEmail } = require('~/server/services/AuthService');
const { needsRefresh, getNewS3URL } = require('~/server/services/Files/S3/crud');
const { processDeleteRequest } = require('~/server/services/Files/process');
const { deleteAllSharedLinks } = require('~/models/Share');
const { deleteToolCalls } = require('~/models/ToolCall');
const { Transaction } = require('~/models/Transaction');
const { logger } = require('~/config');

const getUserController = async (req, res) => {
  /** @type {MongoUser} */
  const userData = req.user.toObject != null ? req.user.toObject() : { ...req.user };
  delete userData.totpSecret;
  if (req.app.locals.fileStrategy === FileSources.s3 && userData.avatar) {
    const avatarNeedsRefresh = needsRefresh(userData.avatar, 3600);
    if (!avatarNeedsRefresh) {
      return res.status(200).send(userData);
    }
    const originalAvatar = userData.avatar;
    try {
      userData.avatar = await getNewS3URL(userData.avatar);
      await updateUser(userData.id, { avatar: userData.avatar });
    } catch (error) {
      userData.avatar = originalAvatar;
      logger.error('Error getting new S3 URL for avatar:', error);
    }
  }
  res.status(200).send(userData);
};

const getTermsStatusController = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ termsAccepted: !!user.termsAccepted });
  } catch (error) {
    logger.error('Error fetching terms acceptance status:', error);
    res.status(500).json({ message: 'Error fetching terms acceptance status' });
  }
};

const acceptTermsController = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.user.id, { termsAccepted: true }, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'Terms accepted successfully' });
  } catch (error) {
    logger.error('Error accepting terms:', error);
    res.status(500).json({ message: 'Error accepting terms' });
  }
};

const deleteUserFiles = async (req) => {
  try {
    const userFiles = await getFiles({ user: req.user.id });
    await processDeleteRequest({
      req,
      files: userFiles,
    });
  } catch (error) {
    logger.error('[deleteUserFiles]', error);
  }
};

const updateUserPluginsController = async (req, res) => {
  const { user } = req;
  const { pluginKey, action, auth, isEntityTool } = req.body;
  let authService;
  try {
    if (!isEntityTool) {
      const userPluginsService = await updateUserPluginsService(user, pluginKey, action);

      if (userPluginsService instanceof Error) {
        logger.error('[userPluginsService]', userPluginsService);
        const { status, message } = userPluginsService;
        res.status(status).send({ message });
      }
    }

    if (auth) {
      const keys = Object.keys(auth);
      const values = Object.values(auth);
      if (action === 'install' && keys.length > 0) {
        for (let i = 0; i < keys.length; i++) {
          authService = await updateUserPluginAuth(user.id, keys[i], pluginKey, values[i]);
          if (authService instanceof Error) {
            logger.error('[authService]', authService);
            const { status, message } = authService;
            res.status(status).send({ message });
          }
        }
      }
      if (action === 'uninstall' && keys.length > 0) {
        for (let i = 0; i < keys.length; i++) {
          authService = await deleteUserPluginAuth(user.id, keys[i]);
          if (authService instanceof Error) {
            logger.error('[authService]', authService);
            const { status, message } = authService;
            res.status(status).send({ message });
          }
        }
      }
    }

    res.status(200).send();
  } catch (err) {
    logger.error('[updateUserPluginsController]', err);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
};

const deleteUserController = async (req, res) => {
  const { user } = req;

  try {
    await deleteMessages({ user: user.id }); // delete user messages
    await deleteAllUserSessions({ userId: user.id }); // delete user sessions
    await Transaction.deleteMany({ user: user.id }); // delete user transactions
    await deleteUserKey({ userId: user.id, all: true }); // delete user keys
    await Balance.deleteMany({ user: user._id }); // delete user balances
    await deletePresets(user.id); // delete user presets
    /* TODO: Delete Assistant Threads */
    await deleteConvos(user.id); // delete user convos
    await deleteUserPluginAuth(user.id, null, true); // delete user plugin auth
    await deleteUserById(user.id); // delete user
    await deleteAllSharedLinks(user.id); // delete user shared links
    await deleteUserFiles(req); // delete user files
    await deleteFiles(null, user.id); // delete database files in case of orphaned files from previous steps
    await deleteToolCalls(user.id); // delete user tool calls
    /* TODO: queue job for cleaning actions and assistants of non-existant users */
    logger.info(`User deleted account. Email: ${user.email} ID: ${user.id}`);
    res.status(200).send({ message: 'User deleted' });
  } catch (err) {
    logger.error('[deleteUserController]', err);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
};

const verifyEmailController = async (req, res) => {
  try {
    const verifyEmailService = await verifyEmail(req);
    if (verifyEmailService instanceof Error) {
      return res.status(400).json(verifyEmailService);
    } else {
      return res.status(200).json(verifyEmailService);
    }
  } catch (e) {
    logger.error('[verifyEmailController]', e);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
};

const resendVerificationController = async (req, res) => {
  try {
    const result = await resendVerificationEmail(req);
    if (result instanceof Error) {
      return res.status(400).json(result);
    } else {
      return res.status(200).json(result);
    }
  } catch (e) {
    logger.error('[verifyEmailController]', e);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
};

// Admin-only controllers
const getAllUsersController = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '' } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build search filter
    const filter = {};
    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
      ];
    }
    if (role && Object.values(SystemRoles).includes(role)) {
      filter.role = role;
    }

    // Get users with pagination
    const users = await User.find(filter)
      .select('_id email username name role provider createdAt avatar lastLogin')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get total count for pagination
    const total = await User.countDocuments(filter);
    const pages = Math.ceil(total / limitNum);

    logger.info(`Admin ${req.user.email} retrieved ${users.length} users (page ${pageNum})`);

    res.status(200).json({
      users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages,
      },
    });
  } catch (error) {
    logger.error('[getAllUsersController]', error);
    res.status(500).json({ message: 'Failed to retrieve users' });
  }
};

const updateUserRoleController = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    const adminUser = req.user;

    // Validate role
    if (!role || !Object.values(SystemRoles).includes(role)) {
      return res.status(400).json({ 
        message: 'Invalid role. Must be one of: ' + Object.values(SystemRoles).join(', ') 
      });
    }

    // Prevent self-role changes
    if (userId === adminUser.id) {
      return res.status(400).json({ 
        message: 'Cannot change your own role' 
      });
    }

    // Get the target user
    const targetUser = await User.findById(userId).lean();
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent changing the last admin to non-admin
    if (targetUser.role === SystemRoles.ADMIN && role !== SystemRoles.ADMIN) {
      const adminCount = await countUsers({ role: SystemRoles.ADMIN });
      if (adminCount <= 1) {
        return res.status(400).json({ 
          message: 'Cannot change the role of the last admin user' 
        });
      }
    }

    // Update the user role
    const updatedUser = await updateUser(userId, { role });
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    logger.info(`Admin ${adminUser.email} changed role of user ${targetUser.email} from ${targetUser.role} to ${role}`);

    res.status(200).json({
      user: {
        _id: updatedUser._id,
        role: updatedUser.role,
        email: updatedUser.email,
        name: updatedUser.name,
      },
      message: `User role updated to ${role}`,
    });
  } catch (error) {
    logger.error('[updateUserRoleController]', error);
    res.status(500).json({ message: 'Failed to update user role' });
  }
};

const deleteSpecificUserController = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminUser = req.user;

    // Prevent self-deletion
    if (userId === adminUser.id) {
      return res.status(400).json({ 
        message: 'Cannot delete your own account' 
      });
    }

    // Get the target user
    const targetUser = await User.findById(userId).lean();
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting the last admin
    if (targetUser.role === SystemRoles.ADMIN) {
      const adminCount = await countUsers({ role: SystemRoles.ADMIN });
      if (adminCount <= 1) {
        return res.status(400).json({ 
          message: 'Cannot delete the last admin user' 
        });
      }
    }

    // Perform the same cleanup as the regular deleteUserController
    // Each operation is wrapped in try-catch to prevent one failure from stopping the entire deletion
    try {
      await deleteMessages({ user: userId }); // delete user messages
    } catch (error) {
      logger.warn(`[deleteSpecificUserController] Failed to delete messages for user ${userId}:`, error.message);
    }

    try {
      await deleteAllUserSessions({ userId }); // delete user sessions
    } catch (error) {
      logger.warn(`[deleteSpecificUserController] Failed to delete sessions for user ${userId}:`, error.message);
    }

    try {
      await Transaction.deleteMany({ user: userId }); // delete user transactions
    } catch (error) {
      logger.warn(`[deleteSpecificUserController] Failed to delete transactions for user ${userId}:`, error.message);
    }

    try {
      await deleteUserKey({ userId, all: true }); // delete user keys
    } catch (error) {
      logger.warn(`[deleteSpecificUserController] Failed to delete keys for user ${userId}:`, error.message);
    }

    try {
      await Balance.deleteMany({ user: userId }); // delete user balances
    } catch (error) {
      logger.warn(`[deleteSpecificUserController] Failed to delete balances for user ${userId}:`, error.message);
    }

    try {
      await deletePresets(userId); // delete user presets
    } catch (error) {
      logger.warn(`[deleteSpecificUserController] Failed to delete presets for user ${userId}:`, error.message);
    }

    try {
      await deleteConvos(userId); // delete user convos
    } catch (error) {
      logger.warn(`[deleteSpecificUserController] Failed to delete conversations for user ${userId}:`, error.message);
    }

    try {
      await deleteUserPluginAuth(userId, null, true); // delete user plugin auth
    } catch (error) {
      logger.warn(`[deleteSpecificUserController] Failed to delete plugin auth for user ${userId}:`, error.message);
    }

    try {
      await deleteAllSharedLinks(userId); // delete user shared links
    } catch (error) {
      logger.warn(`[deleteSpecificUserController] Failed to delete shared links for user ${userId}:`, error.message);
    }

    try {
      await deleteFiles(null, userId); // delete database files
    } catch (error) {
      logger.warn(`[deleteSpecificUserController] Failed to delete files for user ${userId}:`, error.message);
    }

    try {
      await deleteToolCalls(userId); // delete user tool calls
    } catch (error) {
      logger.warn(`[deleteSpecificUserController] Failed to delete tool calls for user ${userId}:`, error.message);
    }

    // The actual user deletion should still fail if it can't delete the user record
    await deleteUserById(userId); // delete user

    logger.info(`Admin ${adminUser.email} deleted user account: ${targetUser.email} (ID: ${userId})`);

    res.status(200).json({ 
      message: 'User deleted successfully',
      deletedUserId: userId,
    });
  } catch (error) {
    logger.error('[deleteSpecificUserController]', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
};

module.exports = {
  getUserController,
  getTermsStatusController,
  acceptTermsController,
  deleteUserController,
  verifyEmailController,
  updateUserPluginsController,
  resendVerificationController,
  getAllUsersController,
  updateUserRoleController,
  deleteSpecificUserController,
};
