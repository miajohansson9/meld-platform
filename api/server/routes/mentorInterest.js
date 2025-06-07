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
  generateNextQuestion,
  getMentorInterest,
  generatePersonalizedIntro,
  getAllMentorResponses,
  grammarFixMentorResponses,
  submitMentorResponses,
  validateAccessToken,
  deleteMentorInterest,
  generateAccessToken,
  getAdminMentorResponses,
} = require('../controllers/MentorInterestController');

const router = express.Router();

// ============================================
// ADMIN/AUTHENTICATED ROUTES (require JWT)
// ============================================

/**
 * @route GET /api/mentor-interest
 * @desc Get all mentor interest responses (ADMIN)
 * @access Private (requires JWT)
 */
router.get('/', requireJwtAuth, getMentorInterests);

/**
 * @route DELETE /api/mentor-interest/:id
 * @desc Delete a mentor interest submission (ADMIN)
 * @access Private (requires JWT)
 */
router.delete('/:id', requireJwtAuth, deleteMentorInterest);

/**
 * @route GET /api/mentor-interest/questions
 * @desc Get all mentor questions (ADMIN)
 * @access Private (requires JWT)
 */
router.get('/questions', requireJwtAuth, getMentorQuestions);

/**
 * @route GET /api/mentor-interest/admin-responses
 * @desc Get all mentor responses with mentor details (ADMIN)
 * @access Private (requires JWT)
 */
router.get('/admin-responses', requireJwtAuth, getAdminMentorResponses);

/**
 * @route POST /api/mentor-interest/questions
 * @desc Add a new mentor question (ADMIN)
 * @access Private (requires JWT)
 */
router.post('/questions', requireJwtAuth, addMentorQuestion);

/**
 * @route PUT /api/mentor-interest/questions/:id
 * @desc Update an existing mentor question (ADMIN)
 * @access Private (requires JWT)
 */
router.put('/questions/:id', requireJwtAuth, updateMentorQuestion);

/**
 * @route POST /api/mentor-interest/questions/search
 * @desc Search all mentor questions (ADMIN)
 * @access Private (requires JWT)
 */
router.post('/questions/search', requireJwtAuth, searchMentorQuestions);

/**
 * @route POST /api/mentor-interest/:id/generate-token
 * @desc Generate access token for existing mentor interest submission (ADMIN)
 * @access Private (requires JWT)
 */
router.post('/:id/generate-token', requireJwtAuth, generateAccessToken);

// ============================================
// PUBLIC ROUTES (no authentication required)
// ============================================

/**
 * @route POST /api/mentor-interest
 * @desc Submit a mentor interest form
 * @access Public
 */
router.post('/', submitMentorInterest);

// ============================================
// MENTOR INTERVIEW ROUTES (access token required)
// ============================================

/**
 * @route GET /api/mentor-interview/:access_token
 * @desc Get mentor interest data by access token
 * @access Public (token validated)
 */
router.get('/:access_token', validateAccessToken, getMentorInterest);

/**
 * @route POST /api/mentor-interview/:access_token/generate-intro
 * @desc Generate personalized introduction using AI
 * @access Public (token validated)
 */
router.post('/:access_token/generate-intro', validateAccessToken, generatePersonalizedIntro);

/**
 * @route POST /api/mentor-interview/:access_token/generate-question
 * @desc Generate next adaptive question using AI
 * @access Public (token validated)
 */
router.post('/:access_token/generate-question', validateAccessToken, generateNextQuestion);

/**
 * @route POST /api/mentor-interview/:access_token/response/:stage_id
 * @desc Add or update a mentor response
 * @access Public (token validated)
 */
router.post('/:access_token/response/:stage_id', validateAccessToken, upsertMentorResponse);

/**
 * @route GET /api/mentor-interview/:access_token/response/:stage_id
 * @desc Retrieve a single mentor response
 * @access Public (token validated)
 */
router.get('/:access_token/response/:stage_id', validateAccessToken, getMentorResponse);

/**
 * @route GET /api/mentor-interview/:access_token/responses
 * @desc Get all mentor responses for review
 * @access Public (token validated)
 */
router.get('/:access_token/responses', validateAccessToken, getAllMentorResponses);

/**
 * @route POST /api/mentor-interview/:access_token/grammar-fix
 * @desc Return AI-cleaned versions of mentor responses
 * @access Public (token validated)
 */
router.post('/:access_token/grammar-fix', validateAccessToken, grammarFixMentorResponses);

/**
 * @route POST /api/mentor-interview/:access_token/submit
 * @desc Submit final mentor responses
 * @access Public (token validated)
 */
router.post('/:access_token/submit', validateAccessToken, submitMentorResponses);

module.exports = router;
