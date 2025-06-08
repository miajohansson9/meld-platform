#!/usr/bin/env node

/**
 * Production script to start the transcription worker
 * Usage: node api/start-transcription-worker.js
 */

require('dotenv').config();
const path = require('path');
require('module-alias')({ base: path.resolve(__dirname, '.') });
const { logger } = require('~/config');
const TranscriptionWorker = require('./workers/transcriptionWorker');

async function startTranscriptionWorker() {
  logger.info('[WORKER] Starting MELD Transcription Worker...');

  // Validate required environment variables based on storage strategy
  const requiredEnvVars = ['OPENAI_API_KEY'];
  
  // Only require AWS if using S3/S3-compatible storage
  const useS3 = process.env.CDN_PROVIDER === 's3' || process.env.CDN_PROVIDER === 'r2';
  if (useS3) {
    requiredEnvVars.push('AWS_BUCKET_NAME');
  }

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    logger.error('[WORKER] Missing required environment variables:', missingVars);
    logger.error('[WORKER] Please ensure your .env file contains:');
    missingVars.forEach(varName => {
      logger.error(`[WORKER]   ${varName}=your_value_here`);
    });
    
    if (!process.env.OPENAI_API_KEY) {
      logger.error('[WORKER] OPENAI_API_KEY is required for speech-to-text transcription');
    }
    
    process.exit(1);
  }
  
  logger.info(`[WORKER] Using ${useS3 ? 'S3' : 'local'} file storage for transcription`)

  // Check Redis configuration
  if (!process.env.USE_REDIS || process.env.USE_REDIS !== 'true') {
    logger.error('[WORKER] Redis is required for background transcription');
    logger.error('[WORKER] Please set USE_REDIS=true in your .env file');
    process.exit(1);
  }

  try {
    // Create and start the worker
    const worker = new TranscriptionWorker();
    
    logger.info('[WORKER] Environment validation passed');
    logger.info('[WORKER] Starting transcription worker process...');
    
    await worker.start();
    
  } catch (error) {
    logger.error('[WORKER] Failed to start transcription worker:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions gracefully
process.on('uncaughtException', (error) => {
  logger.error('[WORKER] Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('[WORKER] Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the worker
startTranscriptionWorker(); 