const express = require('express');
const { requireJwtAuth } = require('~/server/middleware');
const ReflectionQuestionController = require('~/server/controllers/ReflectionQuestionController');

const router = express.Router();

// Generate reflection question endpoint
router.post('/generate-question', requireJwtAuth, ReflectionQuestionController.generateReflectionQuestion);

// Generate daily summary endpoint
router.post('/generate-summary', requireJwtAuth, ReflectionQuestionController.generateDailySummary);

module.exports = router; 