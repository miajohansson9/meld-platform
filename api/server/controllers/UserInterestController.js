const { logger } = require('~/config');
const UserInterest = require('../../models/UserInterest');
const { userInterestSchema } = require('~/validation/userInterest');
const { handleError } = require('../utils');

/**
 * @route POST /api/user-interest
 * @desc Submit user interest form
 * @access Public
 */
async function submitUserInterest(req, res) {
  try {
    const data = userInterestSchema.parse(req.body);
    const userInterest = await UserInterest.create(data);

    res.status(201).json({
      _id: userInterest._id,
      name: userInterest.name,
      email: userInterest.email,
      currentSituation: userInterest.currentSituation,
      // All the conditional fields will be included automatically
      ...userInterest.toObject(),
      createdAt: userInterest.createdAt,
      updatedAt: userInterest.updatedAt
    });
  } catch (err) {
    logger.error('Error submitting user interest:', err);
    if (err.name === 'ZodError') {
      return handleError(res, { text: 'Invalid form data', errors: err.errors });
    }
    return handleError(res, { text: 'Error submitting user interest' });
  }
}

/**
 * @route GET /api/user-interest
 * @desc Get all user interest submissions (ADMIN)
 * @access Private (requires JWT + Admin)
 */
async function getUserInterests(req, res) {
  try {
    const interests = await UserInterest.find({})
      .sort({ createdAt: -1 });

    res.json(interests);
  } catch (err) {
    logger.error('Error fetching user interests:', err);
    return handleError(res, { text: 'Error fetching user interests' });
  }
}

/**
 * @route DELETE /api/user-interest/:id
 * @desc Delete a user interest submission (ADMIN)
 * @access Private (requires JWT + Admin)
 */
async function deleteUserInterest(req, res) {
  try {
    const { id } = req.params;
    const deleted = await UserInterest.findByIdAndDelete(id);
    
    if (!deleted) {
      return handleError(res, { text: 'User interest not found' }, 404);
    }

    res.json({ message: 'User interest deleted successfully' });
  } catch (err) {
    logger.error('Error deleting user interest:', err);
    return handleError(res, { text: 'Error deleting user interest' });
  }
}

const updateSubstackSignup = async (req, res) => {
  try {
    const { id } = req.params;
    
    const userInterest = await UserInterest.findByIdAndUpdate(
      id,
      { completedSubstackSignup: true },
      { new: true }
    );

    if (!userInterest) {
      return handleError(res, { text: 'User interest not found' }, 404);
    }

    res.json({ 
      message: 'Newsletter signup status updated',
      userInterest 
    });
  } catch (err) {
    logger.error('Error updating newsletter signup:', err);
    return handleError(res, { text: 'Error updating newsletter signup status' });
  }
};

module.exports = {
  submitUserInterest,
  getUserInterests,
  deleteUserInterest,
  updateSubstackSignup,
}; 