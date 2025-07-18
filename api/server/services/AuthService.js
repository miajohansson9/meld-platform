const bcrypt = require('bcryptjs');
const { webcrypto } = require('node:crypto');
const { SystemRoles, errorsToString } = require('librechat-data-provider');
const {
  findUser,
  countUsers,
  createUser,
  updateUser,
  getUserById,
  generateToken,
  deleteUserById,
} = require('~/models/userMethods');
const {
  createToken,
  findToken,
  deleteTokens,
  findSession,
  deleteSession,
  createSession,
  generateRefreshToken,
} = require('~/models');
const { isEnabled, checkEmailConfig, sendEmail } = require('~/server/utils');
const { isEmailDomainAllowed } = require('~/server/services/domains');
const { registerSchema } = require('~/strategies/validators');
const { logger } = require('~/config');

const domains = {
  client: process.env.DOMAIN_CLIENT,
  server: process.env.DOMAIN_SERVER,
};

const isProduction = process.env.NODE_ENV === 'production';
const genericVerificationMessage = 'Please check your email to verify your email address.';

/**
 * Logout user
 *
 * @param {ServerRequest} req
 * @param {string} refreshToken
 * @returns
 */
const logoutUser = async (req, refreshToken) => {
  try {
    const userId = req.user._id;
    const session = await findSession({ userId: userId, refreshToken });

    if (session) {
      try {
        await deleteSession({ sessionId: session._id });
      } catch (deleteErr) {
        logger.error('[logoutUser] Failed to delete session.', deleteErr);
        return { status: 500, message: 'Failed to delete session.' };
      }
    }

    try {
      req.session.destroy();
    } catch (destroyErr) {
      logger.error('[logoutUser] Failed to destroy session.', destroyErr);
    }

    return { status: 200, message: 'Logout successful' };
  } catch (err) {
    return { status: 500, message: err.message };
  }
};

/**
 * Creates Token and corresponding Hash for verification
 * @returns {[string, string]}
 */
const createTokenHash = () => {
  const token = Buffer.from(webcrypto.getRandomValues(new Uint8Array(32))).toString('hex');
  const hash = bcrypt.hashSync(token, 10);
  return [token, hash];
};

/**
 * Send Verification Email
 * @param {Partial<MongoUser> & { _id: ObjectId, email: string, name: string}} user
 * @returns {Promise<void>}
 */
const sendVerificationEmail = async (user) => {
  const [verifyToken, hash] = createTokenHash();

  const verificationLink = `${
    domains.client
  }/verify?token=${verifyToken}&email=${encodeURIComponent(user.email)}`;
  await sendEmail({
    email: user.email,
    subject: 'Verify your email',
    payload: {
      appName: process.env.APP_TITLE || 'LibreChat',
      name: user.name || user.username || user.email,
      verificationLink: verificationLink,
      year: new Date().getFullYear(),
    },
    template: 'verifyEmail.handlebars',
  });

  await createToken({
    userId: user._id,
    email: user.email,
    token: hash,
    createdAt: Date.now(),
    expiresIn: 900,
  });

  logger.info(`[sendVerificationEmail] Verification link issued. [Email: ${user.email}]`);
};

/**
 * Verify Email
 * @param {Express.Request} req
 */
const verifyEmail = async (req) => {
  const { email, token } = req.body;
  const decodedEmail = decodeURIComponent(email);

  const user = await findUser({ email: decodedEmail }, 'email _id emailVerified');

  if (!user) {
    logger.warn(`[verifyEmail] [User not found] [Email: ${decodedEmail}]`);
    return new Error('User not found');
  }

  if (user.emailVerified) {
    logger.info(`[verifyEmail] Email already verified [Email: ${decodedEmail}]`);
    return { message: 'Email already verified', status: 'success' };
  }

  let emailVerificationData = await findToken({ email: decodedEmail });

  if (!emailVerificationData) {
    logger.warn(`[verifyEmail] [No email verification data found] [Email: ${decodedEmail}]`);
    return new Error('Invalid or expired password reset token');
  }

  const isValid = bcrypt.compareSync(token, emailVerificationData.token);

  if (!isValid) {
    logger.warn(
      `[verifyEmail] [Invalid or expired email verification token] [Email: ${decodedEmail}]`,
    );
    return new Error('Invalid or expired email verification token');
  }

  const updatedUser = await updateUser(emailVerificationData.userId, { emailVerified: true });
  if (!updatedUser) {
    logger.warn(`[verifyEmail] [User update failed] [Email: ${decodedEmail}]`);
    return new Error('Failed to update user verification status');
  }

  await deleteTokens({ token: emailVerificationData.token });
  logger.info(`[verifyEmail] Email verification successful [Email: ${decodedEmail}]`);
  return { message: 'Email verification was successful', status: 'success' };
};
/**
 * Register a new user.
 * @param {MongoUser} user <email, password, name, username>
 * @param {Partial<MongoUser>} [additionalData={}]
 * @returns {Promise<{status: number, message: string, user?: MongoUser}>}
 */
const registerUser = async (user, additionalData = {}) => {
  const { error } = registerSchema.safeParse(user);
  if (error) {
    const errorMessage = errorsToString(error.errors);
    logger.info(
      'Route: register - Validation Error',
      { name: 'Request params:', value: user },
      { name: 'Validation error:', value: errorMessage },
    );

    return { status: 404, message: errorMessage };
  }

  const { email, password, name, username } = user;

  let newUserId;
  try {
    const existingUser = await findUser({ email }, 'email _id');

    if (existingUser) {
      logger.info(
        'Register User - Email in use',
        { name: 'Request params:', value: user },
        { name: 'Existing user:', value: existingUser },
      );

      // Sleep for 1 second
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return { status: 200, message: genericVerificationMessage };
    }

    if (!(await isEmailDomainAllowed(email))) {
      const errorMessage =
        'The email address provided cannot be used. Please use a different email address.';
      logger.error(`[registerUser] [Registration not allowed] [Email: ${user.email}]`);
      return { status: 403, message: errorMessage };
    }

    // Onboarding fields
    const onboardingFields = [
      'city', 'state', 'birthday', 'whyHere', 'lifeArena', 'identitySegment', 'mentorTone', 'currentBlock'
    ];
    const onboarding = {};
    onboardingFields.forEach(field => {
      if (user[field] !== undefined) onboarding[field] = user[field];
    });
    onboarding.onboardingComplete = true;
    onboarding.onboardingAt = new Date();

    // Hash the password before storing
    const hashedPassword = bcrypt.hashSync(password, 10);

    const userDoc = {
      ...user,
      password: hashedPassword,
      onboarding,
    };

    newUserId = await createUser(userDoc);
    logger.info(`[registerUser] User created: ${email}`);
    return { status: 201, message: 'User registered successfully', userId: newUserId };
  } catch (err) {
    logger.error('[registerUser]', err);
    return { status: 500, message: err.message };
  }
};

/**
 * Request password reset
 * @param {Express.Request} req
 */
const requestPasswordReset = async (req) => {
  const { email } = req.body;
  const user = await findUser({ email }, 'email _id');
  const emailEnabled = checkEmailConfig();

  logger.warn(`[requestPasswordReset] [Password reset request initiated] [Email: ${email}]`);

  if (!user) {
    logger.warn(`[requestPasswordReset] [No user found] [Email: ${email}] [IP: ${req.ip}]`);
    return {
      message: 'If an account with that email exists, a password reset link has been sent to it.',
    };
  }

  await deleteTokens({ userId: user._id });

  const [resetToken, hash] = createTokenHash();

  await createToken({
    userId: user._id,
    token: hash,
    createdAt: Date.now(),
    expiresIn: 900,
  });

  const link = `${domains.client}/reset-password?token=${resetToken}&userId=${user._id}`;

  if (emailEnabled) {
    await sendEmail({
      email: user.email,
      subject: 'Password Reset Request',
      payload: {
        appName: process.env.APP_TITLE || 'LibreChat',
        name: user.name || user.username || user.email,
        link: link,
        year: new Date().getFullYear(),
      },
      template: 'requestPasswordReset.handlebars',
    });
    logger.info(
      `[requestPasswordReset] Link emailed. [Email: ${email}] [ID: ${user._id}] [IP: ${req.ip}]`,
    );
  } else {
    logger.info(
      `[requestPasswordReset] Link issued. [Email: ${email}] [ID: ${user._id}] [IP: ${req.ip}]`,
    );
    return { link };
  }

  return {
    message: 'If an account with that email exists, a password reset link has been sent to it.',
  };
};

/**
 * Reset Password
 *
 * @param {*} userId
 * @param {String} token
 * @param {String} password
 * @returns
 */
const resetPassword = async (userId, token, password) => {
  let passwordResetToken = await findToken({
    userId,
  });

  if (!passwordResetToken) {
    return new Error('Invalid or expired password reset token');
  }

  const isValid = bcrypt.compareSync(token, passwordResetToken.token);

  if (!isValid) {
    return new Error('Invalid or expired password reset token');
  }

  const hash = bcrypt.hashSync(password, 10);
  const user = await updateUser(userId, { password: hash });

  if (checkEmailConfig()) {
    await sendEmail({
      email: user.email,
      subject: 'Password Reset Successfully',
      payload: {
        appName: process.env.APP_TITLE || 'LibreChat',
        name: user.name || user.username || user.email,
        year: new Date().getFullYear(),
      },
      template: 'passwordReset.handlebars',
    });
  }

  await deleteTokens({ token: passwordResetToken.token });
  logger.info(`[resetPassword] Password reset successful. [Email: ${user.email}]`);
  return { message: 'Password reset was successful' };
};

/**
 * Set Auth Tokens
 *
 * @param {String | ObjectId} userId
 * @param {Object} res
 * @param {String} sessionId
 * @returns
 */
const setAuthTokens = async (userId, res, sessionId = null) => {
  try {
    const user = await getUserById(userId);
    const token = await generateToken(user);

    let session;
    let refreshToken;
    let refreshTokenExpires;

    if (sessionId) {
      session = await findSession({ sessionId: sessionId }, { lean: false });
      refreshTokenExpires = session.expiration.getTime();
      refreshToken = await generateRefreshToken(session);
    } else {
      const result = await createSession(userId);
      session = result.session;
      refreshToken = result.refreshToken;
      refreshTokenExpires = session.expiration.getTime();
    }

    res.cookie('refreshToken', refreshToken, {
      expires: new Date(refreshTokenExpires),
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
    });

    return token;
  } catch (error) {
    logger.error('[setAuthTokens] Error in setting authentication tokens:', error);
    throw error;
  }
};

/**
 * Resend Verification Email
 * @param {Object} req
 * @param {Object} req.body
 * @param {String} req.body.email
 * @returns {Promise<{status: number, message: string}>}
 */
const resendVerificationEmail = async (req) => {
  try {
    const { email } = req.body;
    await deleteTokens(email);
    const user = await findUser({ email }, 'email _id name');

    if (!user) {
      logger.warn(`[resendVerificationEmail] [No user found] [Email: ${email}]`);
      return { status: 200, message: genericVerificationMessage };
    }

    const [verifyToken, hash] = createTokenHash();

    const verificationLink = `${
      domains.client
    }/verify?token=${verifyToken}&email=${encodeURIComponent(user.email)}`;

    await sendEmail({
      email: user.email,
      subject: 'Verify your email',
      payload: {
        appName: process.env.APP_TITLE || 'LibreChat',
        name: user.name || user.username || user.email,
        verificationLink: verificationLink,
        year: new Date().getFullYear(),
      },
      template: 'verifyEmail.handlebars',
    });

    await createToken({
      userId: user._id,
      email: user.email,
      token: hash,
      createdAt: Date.now(),
      expiresIn: 900,
    });

    logger.info(`[resendVerificationEmail] Verification link issued. [Email: ${user.email}]`);

    return {
      status: 200,
      message: genericVerificationMessage,
    };
  } catch (error) {
    logger.error(`[resendVerificationEmail] Error resending verification email: ${error.message}`);
    return {
      status: 500,
      message: 'Something went wrong.',
    };
  }
};

module.exports = {
  logoutUser,
  verifyEmail,
  registerUser,
  setAuthTokens,
  resetPassword,
  requestPasswordReset,
  resendVerificationEmail,
};
