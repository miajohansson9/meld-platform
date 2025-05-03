const express = require('express');
const { submitMentorInterest } = require('../controllers/MentorInterestController');

const router = express.Router();

/**
 * @route POST /api/mentor-interest
 * @desc Submit a mentor interest form
 * @access Public
 */
router.post('/', submitMentorInterest);

module.exports = router; 