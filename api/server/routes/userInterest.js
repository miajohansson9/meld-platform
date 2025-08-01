const express = require('express');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const { checkAdmin } = require('~/server/middleware/roles');
const { 
  submitUserInterest,
  getUserInterests,
  deleteUserInterest,
  updateSubstackSignup
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

/**
 * @route PATCH /api/user-interest/:id/newsletter-signup
 * @desc Mark user as having completed newsletter signup (ADMIN or PUBLIC for self-reporting)
 * @access Mixed (Public for user self-reporting, Admin for manual marking)
 */
router.patch('/:id/newsletter-signup', updateSubstackSignup);

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