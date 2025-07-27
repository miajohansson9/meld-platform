const express = require('express');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const { checkAdmin } = require('~/server/middleware/roles');
const { 
  submitUserInterest,
  getUserInterests,
  deleteUserInterest
} = require('../controllers/UserInterestController');

const router = express.Router();

// ============================================
// ADMIN/AUTHENTICATED ROUTES (require JWT)
// ============================================

/**
 * @route GET /api/user-interest
 * @desc Get all user interest submissions (ADMIN)
 * @access Private (requires JWT + Admin)
 */
router.get('/', requireJwtAuth, checkAdmin, getUserInterests);

/**
 * @route DELETE /api/user-interest/:id
 * @desc Delete a user interest submission (ADMIN)
 * @access Private (requires JWT + Admin)
 */
router.delete('/:id', requireJwtAuth, checkAdmin, deleteUserInterest);

// ============================================
// PUBLIC ROUTES (no authentication required)
// ============================================

/**
 * @route POST /api/user-interest
 * @desc Submit user interest form
 * @access Public
 */
router.post('/', submitUserInterest);

module.exports = router; 