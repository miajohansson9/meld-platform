const express = require('express');
const { requireJwtAuth } = require('~/server/middleware');
const ReflectionQuestionController = require('~/server/controllers/ReflectionQuestionController');

const router = express.Router();

// Generate reflection question endpoint
router.post('/generate-question', requireJwtAuth, ReflectionQuestionController.generateReflectionQuestion);

module.exports = router; 