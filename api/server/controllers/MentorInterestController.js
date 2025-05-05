const { handleError } = require('../utils');
const { mentorInterestSchema } = require('../../validation/mentorInterest');
const MentorInterest = require('../../models/MentorInterest');
const MentorQuestion = require('../../models/MentorQuestion');
const { logger } = require('~/config');
const { z } = require('zod');
const { SystemRoles } = require('librechat-data-provider');
const crypto = require('crypto');
const User = require('../../models/User');
const { setAuthTokens } = require('~/server/services/AuthService');

// Validation schema for mentor questions
const mentorQuestionSchema = z.object({
  question: z.string().min(1, 'Question is required'),
  pillar: z.string().min(1, 'Pillar is required'),
  subTags: z.array(z.string()).optional().default([]),
});

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

    // After saving mentorinterest:
    const password = crypto.randomBytes(12).toString('base64url');
    const user = await User.create({
      fullName: `${submission.firstName} ${submission.lastName || ''}`.trim(),
      email: submission.email,
      password, // hash if needed
      role: SystemRoles.MENTOR,
      mentorFormId: submission._id,
      dateCreated: new Date(),
    });

    // Generate auth token
    const token = await setAuthTokens(user._id, res);

    res.status(201).json({
      message: 'Mentor interest form submitted successfully',
      submission: {
        id: submission._id,
        status: submission.status
      },
      token,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role
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

/**
 * @route GET /api/mentor-interest
 * @desc Get all mentor interest responses
 * @access Admin (for now, public)
 */
async function getMentorInterests(req, res) {
  try {
    const responses = await MentorInterest.find().sort({ createdAt: -1 });
    res.json(responses);
  } catch (error) {
    logger.error('[getMentorInterests] Error:', error);
    return handleError(res, { text: 'Error fetching mentor interest responses' });
  }
}

/**
 * @route GET /api/mentor-interest/questions
 * @desc Get all mentor questions
 * @access Admin (for now, public)
 */
async function getMentorQuestions(req, res) {
  try {
    const questions = await MentorQuestion.find().sort({ dateAdded: -1 });
    res.json(questions);
  } catch (error) {
    logger.error('[getMentorQuestions] Error:', error);
    return handleError(res, { text: 'Error fetching mentor questions' });
  }
}

/**
 * @route POST /api/mentor-interest/questions
 * @desc Add a new mentor question
 * @access Admin (for now, public)
 */
async function addMentorQuestion(req, res) {
  try {
    const validatedData = mentorQuestionSchema.parse(req.body);
    const { question, pillar, subTags } = validatedData;

    const newQuestion = await MentorQuestion.create({
      question,
      pillar,
      subTags,
      dateAdded: new Date(),
    });

    logger.info('[addMentorQuestion] New mentor question added', {
      id: newQuestion._id,
      question: newQuestion.question,
    });

    res.status(201).json(newQuestion);
  } catch (error) {
    logger.error('[addMentorQuestion] Error:', error);
    if (error.name === 'ZodError') {
      return handleError(res, { 
        text: 'Invalid question data',
        errors: error.errors 
      });
    }
    return handleError(res, { text: 'Error adding mentor question' });
  }
}

/**
 * @route PUT /api/mentor-interest/questions/:id
 * @desc Update an existing mentor question
 * @access Admin (for now, public)
 */
async function updateMentorQuestion(req, res) {
  try {
    const { id } = req.params;
    const validatedData = mentorQuestionSchema.parse(req.body);
    const { question, pillar, subTags } = validatedData;

    const updatedQuestion = await MentorQuestion.findByIdAndUpdate(
      id,
      { question, pillar, subTags },
      { new: true }
    );

    if (!updatedQuestion) {
      return handleError(res, { text: 'Question not found' }, 404);
    }

    logger.info('[updateMentorQuestion] Mentor question updated', {
      id: updatedQuestion._id,
      question: updatedQuestion.question,
    });

    res.status(200).json(updatedQuestion);
  } catch (error) {
    logger.error('[updateMentorQuestion] Error:', error);
    if (error.name === 'ZodError') {
      return handleError(res, { 
        text: 'Invalid question data',
        errors: error.errors 
      });
    }
    return handleError(res, { text: 'Error updating mentor question' });
  }
}

module.exports = {
  submitMentorInterest,
  getMentorInterests,
  getMentorQuestions,
  addMentorQuestion,
  updateMentorQuestion,
};