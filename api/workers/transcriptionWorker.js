#!/usr/bin/env node

/**
 * Background Transcription Worker for MELD Mentor Interview
 * Processes audio transcription jobs from the Redis queue using BullMQ
 * 
 * Usage: node api/workers/transcriptionWorker.js
 */

require('module-alias/register');
const axios = require('axios');
const { Readable } = require('stream');
const { logger } = require('~/config');
const { getTranscriptionQueue } = require('~/server/services/transcriptionQueue');
const { getS3FileStream } = require('~/server/services/Files/S3/crud');
const { STTService } = require('~/server/services/Files/Audio/STTService');

/**
 * Transcription Worker Class
 * Handles the processing of audio transcription jobs from the queue
 */
class TranscriptionWorker {
  constructor() {
    this.sttService = null;
    this.worker = null;
    this.isShuttingDown = false;
  }

  /**
   * Initialize the STT service
   */
  async initialize() {
    try {
      this.sttService = await STTService.getInstance();
      logger.info('[TranscriptionWorker] STT service initialized');
    } catch (error) {
      logger.error('[TranscriptionWorker] Failed to initialize STT service:', error);
      throw error;
    }
  }

  /**
   * Download audio file from S3 URL
   * @param {string} audioUrl - S3 URL of the audio file
   * @returns {Promise<Buffer>} Audio file buffer
   */
  async downloadAudioFromS3(audioUrl) {
    try {
      logger.debug('[TranscriptionWorker] Downloading audio from S3:', audioUrl);

      // Use S3 file stream for efficient memory usage
      const audioStream = await getS3FileStream(null, audioUrl);
      
      // Convert stream to buffer
      const chunks = [];
      for await (const chunk of audioStream) {
        chunks.push(chunk);
      }
      const audioBuffer = Buffer.concat(chunks);

      logger.debug('[TranscriptionWorker] Audio downloaded successfully:', {
        size: audioBuffer.length,
        url: audioUrl.substring(0, 50) + '...'
      });

      return audioBuffer;
    } catch (error) {
      logger.error('[TranscriptionWorker] Error downloading audio from S3:', error);
      throw new Error(`Failed to download audio: ${error.message}`);
    }
  }

  /**
   * Extract filename and MIME type from S3 URL
   * @param {string} audioUrl - S3 URL of the audio file
   * @returns {Object} File metadata
   */
  extractFileMetadata(audioUrl) {
    try {
      const url = new URL(audioUrl);
      const pathname = url.pathname;
      const filename = pathname.split('/').pop() || 'audio.webm';
      
      // Extract MIME type from file extension
      const extension = filename.split('.').pop()?.toLowerCase() || 'webm';
      const mimeTypeMap = {
        'mp3': 'audio/mp3',
        'mp4': 'audio/mp4',
        'm4a': 'audio/mp4',
        'wav': 'audio/wav',
        'webm': 'audio/webm',
        'ogg': 'audio/ogg',
        'flac': 'audio/flac'
      };

      const mimetype = mimeTypeMap[extension] || 'audio/webm';

      return {
        originalname: filename,
        mimetype,
        size: 0 // Will be set when we have the buffer
      };
    } catch (error) {
      logger.warn('[TranscriptionWorker] Error extracting file metadata, using defaults:', error);
      return {
        originalname: 'audio.webm',
        mimetype: 'audio/webm',
        size: 0
      };
    }
  }

  /**
   * Update mentor response with transcription results
   * @param {string} mentorResponseId - MongoDB ObjectId
   * @param {string} accessToken - Access token for authentication
   * @param {string} stageId - Stage ID for the question
   * @param {string} transcribedText - The transcribed text
   * @param {string} whisperModel - Model used for transcription
   */
  async updateMentorResponse(mentorResponseId, accessToken, stageId, transcribedText, whisperModel) {
    try {
      logger.debug('[TranscriptionWorker] Updating mentor response:', {
        mentorResponseId,
        stageId,
        textLength: transcribedText.length
      });

      const updateUrl = `http://localhost:${process.env.PORT || 3080}/api/mentor-interview/${accessToken}/response/${stageId}`;
      
      const response = await axios.patch(updateUrl, {
        response_text: transcribedText,
        status: 'transcribed',
        whisper_model: whisperModel
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      });

      if (response.status === 200) {
        logger.info('[TranscriptionWorker] Successfully updated mentor response:', {
          mentorResponseId,
          stageId,
          status: response.data.status
        });
      } else {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
    } catch (error) {
      logger.error('[TranscriptionWorker] Error updating mentor response:', {
        mentorResponseId,
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
    
    logger.info('[TranscriptionWorker] Processing transcription job:', {
      jobId: job.id,
      mentorResponseId,
      stageId,
      durationMs
    });

    let audioBuffer = null;
    let audioFile = null;

    try {
      // Update job progress
      await job.updateProgress(10);

      // Step 1: Download audio from S3
      audioBuffer = await this.downloadAudioFromS3(audioUrl);
      await job.updateProgress(30);

      // Step 2: Extract file metadata
      audioFile = this.extractFileMetadata(audioUrl);
      audioFile.size = audioBuffer.length;

      // Step 3: Get STT provider configuration
      const [provider, sttSchema] = await this.sttService.getProviderSchema();
      await job.updateProgress(40);

      logger.debug('[TranscriptionWorker] Using STT provider:', {
        provider,
        model: sttSchema.model
      });

      // Step 4: Call Whisper API
      const transcribedText = await this.sttService.sttRequest(provider, sttSchema, {
        audioBuffer,
        audioFile
      });
      await job.updateProgress(80);

      if (!transcribedText || transcribedText.trim().length === 0) {
        throw new Error('No transcription text returned from STT service');
      }

      logger.debug('[TranscriptionWorker] Transcription completed:', {
        textLength: transcribedText.length,
        preview: transcribedText.substring(0, 100) + '...'
      });

      // Step 5: Update database with transcription
      await this.updateMentorResponse(
        mentorResponseId,
        accessToken,
        stageId,
        transcribedText,
        sttSchema.model || 'whisper-1'
      );
      await job.updateProgress(100);

      logger.info('[TranscriptionWorker] Job completed successfully:', {
        jobId: job.id,
        mentorResponseId,
        stageId,
        textLength: transcribedText.length
      });

      return { success: true, text: transcribedText };

    } catch (error) {
      logger.error('[TranscriptionWorker] Job failed:', {
        jobId: job.id,
        mentorResponseId,
        stageId,
        error: error.message,
        stack: error.stack
      });

      // Try to update the database with failed status if we have enough info
      try {
        if (accessToken && stageId) {
          await this.updateMentorResponse(
            mentorResponseId,
            accessToken,
            stageId,
            `[Transcription failed: ${error.message}]`,
            'error'
          );
        }
      } catch (updateError) {
        logger.error('[TranscriptionWorker] Failed to update response with error status:', updateError);
      }

      throw error;
    } finally {
      // Clear references to help garbage collection
      audioBuffer = null;
      audioFile = null;
    }
  }

  /**
   * Start the worker process
   */
  async start() {
    try {
      logger.info('[TranscriptionWorker] Starting transcription worker...');

      // Initialize STT service
      await this.initialize();

      // Get the transcription queue
      const transcriptionQueue = getTranscriptionQueue();
      
      // Create the worker
      this.worker = transcriptionQueue.createWorker((job) => this.processJob(job));

      if (!this.worker) {
        throw new Error('Failed to create worker - Redis not available');
      }

      logger.info('[TranscriptionWorker] Worker started successfully');

      // Keep the process alive
      return new Promise((resolve, reject) => {
        this.worker.on('error', (error) => {
          logger.error('[TranscriptionWorker] Worker error:', error);
          reject(error);
        });

        // Handle graceful shutdown
        process.on('SIGINT', () => this.shutdown());
        process.on('SIGTERM', () => this.shutdown());
      });

    } catch (error) {
      logger.error('[TranscriptionWorker] Failed to start worker:', error);
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
    logger.info('[TranscriptionWorker] Shutting down gracefully...');

    try {
      if (this.worker) {
        await this.worker.close();
        logger.info('[TranscriptionWorker] Worker closed');
      }

      // Close the queue connection
      const transcriptionQueue = getTranscriptionQueue();
      await transcriptionQueue.close();

      logger.info('[TranscriptionWorker] Shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('[TranscriptionWorker] Error during shutdown:', error);
      process.exit(1);
    }
  }
}

// Run the worker if this file is executed directly
if (require.main === module) {
  const worker = new TranscriptionWorker();
  
  worker.start().catch((error) => {
    logger.error('[TranscriptionWorker] Fatal error:', error);
    process.exit(1);
  });
}

module.exports = TranscriptionWorker; 