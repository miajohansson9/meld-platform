const express = require('express');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const { logger } = require('~/config');
const fs = require('fs');
const { FileSources } = require('librechat-data-provider');
const { getStrategyFunctions } = require('~/server/services/Files/strategies');
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
  submitMentorResponses,
  validateAccessToken,
  deleteMentorInterest,
  generateAccessToken,
  getAdminMentorResponses,
  updateMentorResponseTranscription,
  getMentorTranscriptionProgress,
  transcribeAndWait,
} = require('../controllers/MentorInterestController');

const router = express.Router();

// Import the shared multer instance configuration
const { createMulterInstance } = require('./files/multer');

// Initialize upload middleware at module load
let upload = null;
(async () => {
  try {
    upload = await createMulterInstance();
    logger.debug('[mentor-interview] Multer instance initialized');
  } catch (error) {
    logger.error('[mentor-interview] Failed to initialize multer:', error);
  }
})();

// Middleware to create pseudo-user for multer compatibility
const createPseudoUser = (req, res, next) => {
  // The shared multer storage expects req.user.id for creating upload paths
  // Since mentor interview routes use access tokens instead of JWT auth,
  // we create a pseudo-user object using the access token as the user ID
  if (!req.user && req.params.access_token) {
    req.user = { id: req.params.access_token };
  }
  next();
};

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
 * @route POST /api/mentor-interview/:access_token/upload-url
 * @desc Generate signed upload URL for mentor interview audio files (S3) or fallback endpoint (other strategies)
 * @access Public (token validated)
 */
router.post('/:access_token/upload-url', validateAccessToken, async (req, res) => {
  try {
    const { filename, content_type, base_path = 'audio' } = req.body;

    if (!filename || !content_type) {
      return res.status(400).json({ 
        error: 'Missing required fields: filename and content_type' 
      });
    }

    // Get the appropriate file strategy (S3, Azure, etc.)
    
    const fileStrategy = req.app.locals.fileStrategy || FileSources.local;
    const { getSignedUploadUrl } = getStrategyFunctions(fileStrategy);
    
    if (getSignedUploadUrl) {
      // S3 strategy - use presigned URLs for direct client upload
      const pseudoUserId = req.params.access_token;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const uniqueFilename = `${timestamp}-${filename}`;

      const uploadUrl = await getSignedUploadUrl({
        userId: pseudoUserId,
        fileName: uniqueFilename,
        contentType: content_type,
        basePath: base_path,
      });

      res.json({ upload_url: uploadUrl });
    } else {
      // Non-S3 strategies - return endpoint for server-side upload
      const uploadEndpoint = `/api/mentor-interview/${req.params.access_token}/upload-audio`;
      res.json({ 
        upload_url: uploadEndpoint,
        method: 'POST',
        use_server_upload: true
      });
    }
  } catch (error) {
    logger.error('[mentor-interview] Error generating upload URL:', error);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
});

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
 * @route PATCH /api/mentor-interview/:access_token/response/:stage_id
 * @desc Update mentor response with transcription (WORKER ENDPOINT)
 * @access Public (token validated)
 */
router.patch('/:access_token/response/:stage_id', validateAccessToken, updateMentorResponseTranscription);

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
 * @route POST /api/mentor-interview/:access_token/submit
 * @desc Submit final mentor responses
 * @access Public (token validated)
 */
router.post('/:access_token/submit', validateAccessToken, submitMentorResponses);

/**
 * @route GET /api/mentor-interview/:access_token/progress
 * @desc Get transcription progress for all mentor responses
 * @access Public (token validated)
 */
router.get('/:access_token/progress', validateAccessToken, getMentorTranscriptionProgress);

/**
 * @route POST /api/mentor-interview/:access_token/transcribe/:stage_id
 * @desc Trigger transcription and wait for completion (synchronous)
 * @access Public (token validated)
 */
router.post('/:access_token/transcribe/:stage_id', validateAccessToken, transcribeAndWait);

/**
 * @route GET /api/mentor-interview/:access_token/debug-queue
 * @desc Debug endpoint to check transcription queue status
 * @access Public (token validated)
 */
router.get('/:access_token/debug-queue', validateAccessToken, async (req, res) => {
  try {
    const { getTranscriptionQueue } = require('~/server/services/transcriptionQueue');
    const transcriptionQueue = getTranscriptionQueue();
    
    if (!transcriptionQueue) {
      return res.json({
        queue_available: false,
        message: 'Transcription queue not available - Redis may not be configured'
      });
    }

    const stats = await transcriptionQueue.getQueueStats();
    const jobStatuses = await transcriptionQueue.getJobStatuses(req.params.access_token);
    
    logger.info('[debug-queue] Queue stats:', stats);
    logger.info('[debug-queue] Job statuses for token:', {
      token: req.params.access_token.substring(0, 8) + '...',
      jobs: jobStatuses
    });

    res.json({
      queue_available: true,
      queue_stats: stats,
      job_statuses: jobStatuses,
      access_token_preview: req.params.access_token.substring(0, 8) + '...'
    });
  } catch (error) {
    logger.error('[debug-queue] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /api/mentor-interview/:access_token/upload-audio
 * @desc Server-side audio upload for non-S3 strategies
 * @access Public (token validated)
 */
router.post('/:access_token/upload-audio', validateAccessToken, createPseudoUser, (req, res, next) => {
  // Check if upload is ready
  if (!upload) {
    return res.status(500).json({ error: 'Upload service not ready' });
  }
  // Apply multer middleware
  upload.single('audio')(req, res, next);
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    // Debug req.app state
    logger.debug('[mentor-interview] req.app exists:', !!req.app);
    logger.debug('[mentor-interview] req.app.locals exists:', !!(req.app && req.app.locals));
    logger.debug('[mentor-interview] res.app exists:', !!res.app);
    
    // Try to get fileStrategy with fallback
    let fileStrategy = FileSources.local; // Default fallback
    
    if (req.app && req.app.locals && req.app.locals.fileStrategy) {
      fileStrategy = req.app.locals.fileStrategy;
      logger.debug('[mentor-interview] Using fileStrategy from req.app.locals:', fileStrategy);
    } else if (res.app && res.app.locals && res.app.locals.fileStrategy) {
      fileStrategy = res.app.locals.fileStrategy;
      logger.debug('[mentor-interview] Using fileStrategy from res.app.locals:', fileStrategy);
    } else {
      logger.warn('[mentor-interview] No app.locals found, using default fileStrategy:', fileStrategy);
    }

    // Get the appropriate file strategy
    const { getRandomValues } = require('~/server/utils');
    const { handleFileUpload } = getStrategyFunctions(fileStrategy);
    
    if (!handleFileUpload) {
      return res.status(501).json({ error: 'File upload not supported for current storage strategy' });
    }

    // Create a file ID for tracking
    const file_id = await getRandomValues(16); // 32 character hex string
    
    // Create a pseudo request object with access token as user ID
    // Note: We need to explicitly preserve req.app since it might not be enumerable
    const pseudoReq = {
      ...req,
      app: req.app, // Explicitly preserve the Express app reference
      user: { id: req.params.access_token }
    };

    // Upload the file using the current strategy
    const result = await handleFileUpload({
      req: pseudoReq,
      file: req.file,
      file_id,
      basePath: 'audio'
    });

    // Clean up temporary file
    if (req.file.path) {
      try {
        await fs.promises.unlink(req.file.path);
      } catch (unlinkError) {
        logger.warn('[mentor-interview] Error deleting temporary file:', unlinkError);
      }
    }

    res.json({ 
      file_url: result.filepath,
      bytes: result.bytes || req.file.size
    });

  } catch (error) {
    logger.error('[mentor-interview] Error uploading audio file:', error);
    
    // Clean up temporary file on error
    if (req.file && req.file.path) {
      try {
        await fs.promises.unlink(req.file.path);
      } catch (unlinkError) {
        logger.warn('[mentor-interview] Error deleting temporary file after upload error:', unlinkError);
      }
    }
    
    res.status(500).json({ error: 'Failed to upload audio file' });
  }
});

module.exports = router;
