const express = require('express');
const { requireJwtAuth, canDeleteAccount, verifyEmailLimiter } = require('~/server/middleware');
const { checkAdmin } = require('~/server/middleware/roles');
const {
  getUserController,
  deleteUserController,
  verifyEmailController,
  updateUserPluginsController,
  resendVerificationController,
  getTermsStatusController,
  acceptTermsController,
  getAllUsersController,
  updateUserRoleController,
  deleteSpecificUserController,
} = require('~/server/controllers/UserController');

const router = express.Router();

router.get('/', requireJwtAuth, getUserController);
router.get('/terms', requireJwtAuth, getTermsStatusController);
router.post('/terms/accept', requireJwtAuth, acceptTermsController);
router.post('/plugins', requireJwtAuth, updateUserPluginsController);
router.delete('/delete', requireJwtAuth, canDeleteAccount, deleteUserController);
router.post('/verify', verifyEmailController);
router.post('/verify/resend', verifyEmailLimiter, resendVerificationController);

// Admin-only routes
router.get('/all', requireJwtAuth, checkAdmin, getAllUsersController);
router.put('/:userId/role', requireJwtAuth, checkAdmin, updateUserRoleController);
router.delete('/:userId', requireJwtAuth, checkAdmin, deleteSpecificUserController);

module.exports = router;
