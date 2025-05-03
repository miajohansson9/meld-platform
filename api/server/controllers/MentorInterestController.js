const { handleError } = require('../utils');
const { mentorInterestSchema } = require('../../validation/mentorInterest');
const MentorInterest = require('../../models/MentorInterest');
const { logger } = require('~/config');

/**
 * @route POST /api/mentor-interest
 * @desc Submit a mentor interest form
 * @access Public
 */
async function submitMentorInterest(req, res) {
  try {
    const validatedData = mentorInterestSchema.parse(req.body);
    const submission = await MentorInterest.create(validatedData);
    
    logger.info('[submitMentorInterest] New mentor interest submission', {
      id: submission._id,
      email: submission.email
    });

    res.status(201).json({
      message: 'Mentor interest form submitted successfully',
      submission: {
        id: submission._id,
        status: submission.status
      }
    });
  } catch (error) {
    logger.error('[submitMentorInterest] Error:', error);
    if (error.name === 'ZodError') {
      return handleError(res, { 
        text: 'Invalid form data',
        errors: error.errors 
      });
    }
    return handleError(res, { text: 'Error submitting mentor interest form' });
  }
}

module.exports = {
  submitMentorInterest
}; 