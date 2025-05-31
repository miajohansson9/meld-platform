const express = require('express');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const {
  submitMentorInterest,
  getMentorInterests,
  getMentorQuestions,
  addMentorQuestion,
  updateMentorQuestion,
  searchMentorQuestions,
  upsertMentorResponse,
  getMentorResponse,
  getSimilarQuestions,
  generateNextQuestion,
  saveMentorResponseTags,
  getMentorInterest,
} = require('../controllers/MentorInterestController');

const router = express.Router();

/**
 * @route POST /api/mentor-interest
 * @desc Submit a mentor interest form
 * @access Public
 */
router.post('/', submitMentorInterest);

/**
 * @route GET /api/mentor-interest
 * @desc Get all mentor interest responses
 * @access Admin (for now, public)
 */
router.get('/', getMentorInterests);

/**
 * @route GET /api/mentor-interest/questions
 * @desc Get all mentor questions
 * @access Admin (for now, public)
 */
router.get('/questions', getMentorQuestions);

/**
 * @route GET /api/mentor-interest/questions/similar
 * @desc Get semantically similar questions based on input text
 * @access Private (requires JWT)
 */
router.get('/questions/similar', requireJwtAuth, getSimilarQuestions);

/**
 * @route POST /api/mentor-interest/questions
 * @desc Add a new mentor question
 * @access Admin (for now, public)
 */
router.post('/questions', requireJwtAuth, addMentorQuestion);

/**
 * @route PUT /api/mentor-interest/questions/:id
 * @desc Update an existing mentor question
 * @access Admin (for now, public)
 */
router.put('/questions/:id', requireJwtAuth, updateMentorQuestion);

/**
 * @route POST /api/mentor-interest/questions/search
 * @desc  Search all mentor questions (requires auth)
 */
router.post('/questions/search', requireJwtAuth, searchMentorQuestions);

/**
 * @route GET /api/mentor-interest/:id
 * @desc Get a single mentor interest by ID
 * @access Public (can be auth-gated later)
 */
router.get('/:id', getMentorInterest);

/**
 * @route POST /api/mentor-interest/:mentor_interest_id/next-question
 * @desc Generate next adaptive question using AI
 * @access Private (requires JWT)
 */
router.post('/:mentor_interest_id/next-question', requireJwtAuth, generateNextQuestion);

/**
 * @route POST /api/mentor-interest/:mentor_interest_id/response/:stage_id
 * @desc Add or update a mentor response
 * @access Public
 */
router.post('/:mentor_interest_id/response/:stage_id', upsertMentorResponse);

/**
 * @route POST /api/mentor-interest/:mentor_interest_id/response/:stage_id/tags
 * @desc Save selected tags for a mentor response
 * @access Private (requires JWT)
 */
router.post('/:mentor_interest_id/response/:stage_id/tags', requireJwtAuth, saveMentorResponseTags);

/**
 * @route GET /api/mentor-interest/:mentor_interest_id/response/:stage_id
 * @desc  Retrieve a single mentor response for this mentor & stage.
 * @access Public
 */
router.get('/:mentor_interest_id/response/:stage_id', getMentorResponse);

module.exports = router;
