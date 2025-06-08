#!/usr/bin/env node

/**
 * Simplified transcription worker for local file storage
 * Processes audio transcription jobs from Redis queue using OpenAI Whisper
 * 
 * Usage: node api/simple-transcription-worker.js
 */

require('dotenv').config();
const path = require('path');
require('module-alias')({ base: path.resolve(__dirname, '..') });

const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const { logger } = require('~/config');

/**
 * Simple Transcription Worker Class
 * Handles local audio files and OpenAI Whisper API
 */
class SimpleTranscriptionWorker {
  constructor() {
    this.isShuttingDown = false;
    this.worker = null;
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.serverPort = process.env.PORT || 3080;
  }

  /**
   * Download/read local audio file
   * @param {string} audioUrl - Local file path or URL
   * @returns {Promise<Buffer>} Audio file buffer
   */
  async getAudioBuffer(audioUrl) {
    try {
      logger.debug('[SimpleWorker] Reading audio file:', audioUrl);

      // Handle local file paths (remove leading slash and resolve)
      let filePath = audioUrl;
      if (audioUrl.startsWith('/uploads/')) {
        filePath = path.join(process.cwd(), audioUrl);
      } else if (audioUrl.startsWith('uploads/')) {
        filePath = path.join(process.cwd(), audioUrl);
      }

      if (!fs.existsSync(filePath)) {
        throw new Error(`Audio file not found: ${filePath}`);
      }

      const audioBuffer = await fs.promises.readFile(filePath);
      
      logger.debug('[SimpleWorker] Audio file read successfully:', {
        size: audioBuffer.length,
        path: filePath
      });

      return audioBuffer;
    } catch (error) {
      logger.error('[SimpleWorker] Error reading audio file:', error);
      throw new Error(`Failed to read audio: ${error.message}`);
    }
  }

  /**
   * Transcribe audio using OpenAI Whisper API
   * @param {Buffer} audioBuffer - Audio file buffer
   * @param {string} filename - Original filename for context
   * @returns {Promise<string>} Transcribed text
   */
  async transcribeAudio(audioBuffer, filename = 'audio.webm') {
    try {
      logger.debug('[SimpleWorker] Starting transcription with OpenAI Whisper');

      if (!this.openaiApiKey) {
        throw new Error('OPENAI_API_KEY not configured');
      }

      // Create form data for multipart upload
      const formData = new FormData();
      formData.append('file', audioBuffer, {
        filename,
        contentType: 'audio/webm',
      });
      formData.append('model', 'whisper-1');
      formData.append('response_format', 'text');

      // Call OpenAI Whisper API
      const response = await axios.post(
        'https://api.openai.com/v1/audio/transcriptions',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            ...formData.getHeaders(),
          },
          timeout: 60000, // 60 second timeout
        }
      );

      const transcribedText = response.data.trim();
      
      if (!transcribedText || transcribedText.length === 0) {
        throw new Error('No transcription text returned from OpenAI');
      }

      logger.debug('[SimpleWorker] Transcription completed:', {
        textLength: transcribedText.length,
        preview: transcribedText.substring(0, 100) + '...'
      });

      return transcribedText;
    } catch (error) {
      logger.error('[SimpleWorker] Transcription failed:', error);
      throw new Error(`Transcription failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Update mentor response with transcription results
   * @param {string} accessToken - Access token for authentication
   * @param {string} stageId - Stage ID for the question  
   * @param {string} transcribedText - The transcribed text
   */
  async updateMentorResponse(accessToken, stageId, transcribedText) {
    try {
      logger.debug('[SimpleWorker] Updating mentor response:', {
        stageId,
        textLength: transcribedText.length
      });

      const updateUrl = `http://localhost:${this.serverPort}/api/mentor-interview/${accessToken}/response/${stageId}`;
      
      const response = await axios.patch(updateUrl, {
        response_text: transcribedText,
        status: 'transcribed',
        whisper_model: 'whisper-1'
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      if (response.status === 200) {
        logger.info('[SimpleWorker] Successfully updated mentor response:', {
          stageId,
          status: response.data.status
        });
      } else {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
    } catch (error) {
      logger.error('[SimpleWorker] Error updating mentor response:', {
        stageId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Process a single transcription job
   * @param {Object} job - BullMQ job object
   */
  async processJob(job) {
    const { mentorResponseId, audioUrl, stageId, accessToken, durationMs } = job.data;
    
    logger.info('[SimpleWorker] Processing transcription job:', {
      jobId: job.id,
      mentorResponseId,
      stageId,
      durationMs,
      audioUrl
    });

    try {
      // Update job progress
      await job.updateProgress(10);

      // Step 1: Read local audio file
      const audioBuffer = await this.getAudioBuffer(audioUrl);
      await job.updateProgress(30);

      // Step 2: Extract filename for context
      const filename = path.basename(audioUrl) || 'audio.webm';
      await job.updateProgress(40);

      // Step 3: Transcribe with OpenAI Whisper
      const transcribedText = await this.transcribeAudio(audioBuffer, filename);
      await job.updateProgress(80);

      // Step 4: Update database with transcription
      await this.updateMentorResponse(accessToken, stageId, transcribedText);
      await job.updateProgress(100);

      logger.info(`[SimpleWorker] Job completed successfully: ${transcribedText}`);

      return { success: true, text: transcribedText };

    } catch (error) {
      logger.error('[SimpleWorker] Job failed:', {
        jobId: job.id,
        mentorResponseId,
        stageId,
        error: error.message,
        stack: error.stack
      });

      // Try to update the database with failed status
      try {
        await this.updateMentorResponse(accessToken, stageId, `[Transcription failed: ${error.message}]`);
      } catch (updateError) {
        logger.error('[SimpleWorker] Failed to update response with error status:', updateError);
      }

      throw error;
    }
  }

  /**
   * Start the worker process
   */
  async start() {
    try {
      logger.info('[SimpleWorker] Starting simple transcription worker...');

      // Validate environment
      if (!this.openaiApiKey) {
        throw new Error('OPENAI_API_KEY is required for transcription');
      }

      // Check Redis is available
      if (!process.env.USE_REDIS || process.env.USE_REDIS !== 'true') {
        throw new Error('Redis is required (USE_REDIS=true)');
      }

      // Get the transcription queue
      const { getTranscriptionQueue } = require('~/server/services/transcriptionQueue');
      const transcriptionQueue = getTranscriptionQueue();
      
      if (!transcriptionQueue) {
        throw new Error('Transcription queue not available - Redis may not be configured');
      }

      // Create the worker
      this.worker = transcriptionQueue.createWorker((job) => this.processJob(job));

      if (!this.worker) {
        throw new Error('Failed to create worker - Redis not available');
      }

      logger.info('[SimpleWorker] Worker started successfully');

      // Handle worker events
      this.worker.on('completed', (job) => {
        logger.info(`[SimpleWorker] Job ${job.id} completed successfully`);
      });

      this.worker.on('failed', (job, err) => {
        logger.error(`[SimpleWorker] Job ${job.id} failed:`, err.message);
      });

      this.worker.on('error', (error) => {
        logger.error('[SimpleWorker] Worker error:', error);
      });

      // Keep the process alive
      return new Promise((resolve, reject) => {
        // Handle graceful shutdown
        process.on('SIGINT', () => this.shutdown());
        process.on('SIGTERM', () => this.shutdown());
        
        this.worker.on('error', (error) => {
          logger.error('[SimpleWorker] Fatal worker error:', error);
          reject(error);
        });
      });

    } catch (error) {
      logger.error('[SimpleWorker] Failed to start worker:', error);
      throw error;
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    if (this.isShuttingDown) {
      return;
    }

    this.isShuttingDown = true;
    logger.info('[SimpleWorker] Shutting down gracefully...');

    try {
      if (this.worker) {
        await this.worker.close();
        logger.info('[SimpleWorker] Worker closed');
      }

      // Close the queue connection
      const { getTranscriptionQueue } = require('~/server/services/transcriptionQueue');
      const transcriptionQueue = getTranscriptionQueue();
      await transcriptionQueue.close();

      logger.info('[SimpleWorker] Shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('[SimpleWorker] Error during shutdown:', error);
      process.exit(1);
    }
  }
}

// Handle uncaught exceptions gracefully
process.on('uncaughtException', (error) => {
  logger.error('[SimpleWorker] Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('[SimpleWorker] Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the worker if this file is executed directly
if (require.main === module) {
  const worker = new SimpleTranscriptionWorker();
  
  worker.start().catch((error) => {
    logger.error('[SimpleWorker] Fatal error:', error);
    process.exit(1);
  });
}

module.exports = SimpleTranscriptionWorker; 