const { Queue, Worker } = require('bullmq');
const { isEnabled } = require('~/server/utils');
const { logger } = require('~/config');
const ioredisClient = require('~/cache/ioredisClient');

/**
 * Service class for handling background audio transcription jobs using BullMQ
 * Integrates with LibreChat's existing Redis infrastructure
 */
class TranscriptionQueue {
  constructor() {
    this.queueName = 'audio-transcription';
    this.queue = null;
    this.worker = null;
    this.isRedisEnabled = isEnabled(process.env.USE_REDIS);
    
    if (this.isRedisEnabled && ioredisClient) {
      this.initializeQueue();
    } else {
      logger.warn('[TranscriptionQueue] Redis not available - background transcription disabled');
    }
  }

  /**
   * Initialize the BullMQ queue with Redis connection
   */
  initializeQueue() {
    try {
      // Create BullMQ-compatible Redis connection
      // BullMQ requires maxRetriesPerRequest: null
      const Redis = require('ioredis');
      const connection = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
        maxRetriesPerRequest: null, // Required by BullMQ
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
        lazyConnect: true,
      });
      
      this.queue = new Queue(this.queueName, {
        connection,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: 10, // Keep last 10 completed jobs
          removeOnFail: 5, // Keep last 5 failed jobs
        },
      });

      this.queue.on('error', (error) => {
        logger.error('[TranscriptionQueue] Queue error:', error);
      });

      logger.info('[TranscriptionQueue] Initialized successfully');
    } catch (error) {
      logger.error('[TranscriptionQueue] Failed to initialize:', error);
      this.queue = null;
    }
  }

  /**
   * Add a new transcription job to the queue
   * @param {string} mentorResponseId - MongoDB ObjectId of MentorResponse
   * @param {string} audioUrl - S3 URL of the audio file
   * @param {number} stageId - Stage ID for the question
   * @param {string} accessToken - Access token for authentication
   * @param {number} durationMs - Audio duration in milliseconds
   * @returns {Promise<Object|null>} Job object or null if queue unavailable
   */
  async addJob(mentorResponseId, audioUrl, stageId, accessToken, durationMs = 0) {
    if (!this.queue) {
      logger.warn('[TranscriptionQueue] Queue not available - job not added');
      return null;
    }

    try {
      const jobData = {
        mentorResponseId,
        audioUrl,
        stageId,
        accessToken,
        durationMs,
        timestamp: new Date().toISOString(),
      };

      const job = await this.queue.add('transcribe-audio', jobData, {
        // Higher priority for shorter audio files (faster processing)
        priority: Math.max(1, 100 - Math.floor(durationMs / 1000 / 60)), // 1-100 based on minutes
      });

      logger.info('[TranscriptionQueue] Job added:', {
        jobId: job.id,
        mentorResponseId,
        stageId,
        durationMs,
      });

      return job;
    } catch (error) {
      logger.error('[TranscriptionQueue] Failed to add job:', error);
      return null;
    }
  }

  /**
   * Get the status of jobs for a specific access token
   * Used by the /progress endpoint to show background processing status
   * @param {string} accessToken - Access token to filter jobs
   * @returns {Promise<Array>} Array of job statuses
   */
  async getJobStatuses(accessToken) {
    if (!this.queue) {
      return [];
    }

    try {
      // Get active, waiting, and completed jobs
      const [active, waiting, completed, failed] = await Promise.all([
        this.queue.getActive(),
        this.queue.getWaiting(),
        this.queue.getCompleted(0, 50), // Last 50 completed
        this.queue.getFailed(0, 10), // Last 10 failed
      ]);

      const allJobs = [...active, ...waiting, ...completed, ...failed];
      
      // Filter by access token and format response
      const statuses = allJobs
        .filter(job => job.data?.accessToken === accessToken)
        .map(job => ({
          stage_id: job.data.stageId,
          mentor_response_id: job.data.mentorResponseId,
          status: this.getJobStatus(job),
          duration_ms: job.data.durationMs,
          created_at: job.timestamp,
          progress: job.progress || 0,
        }));

      return statuses;
    } catch (error) {
      logger.error('[TranscriptionQueue] Failed to get job statuses:', error);
      return [];
    }
  }

  /**
   * Get standardized status from BullMQ job
   * @param {Object} job - BullMQ job object
   * @returns {string} Standardized status
   */
  getJobStatus(job) {
    if (job.isCompleted()) return 'transcribed';
    if (job.isFailed()) return 'failed';
    if (job.isActive()) return 'processing';
    if (job.isWaiting()) return 'pending';
    return 'unknown';
  }

  /**
   * Get detailed status of a specific job by ID
   * @param {string} jobId - The job ID to check
   * @returns {Promise<Object|null>} Job status or null if not found
   */
  async getJobStatusById(jobId) {
    if (!this.queue) {
      return null;
    }

    try {
      const job = await this.queue.getJob(jobId);
      if (!job) {
        return null;
      }

      const state = await job.getState();
      
      return {
        id: job.id,
        state: state,
        status: this.getJobStatus(job), // Our standardized status
        progress: job.progress,
        data: job.data,
        returnvalue: job.returnvalue,
        failedReason: job.failedReason,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
        timestamp: job.timestamp
      };
    } catch (error) {
      logger.error('[TranscriptionQueue] Error getting job status by ID:', error);
      return { error: error.message };
    }
  }

  /**
   * Get queue statistics for monitoring
   * @returns {Promise<Object>} Queue statistics
   */
  async getQueueStats() {
    if (!this.queue) {
      return { available: false };
    }

    try {
      const [active, waiting, completed, failed] = await Promise.all([
        this.queue.getActiveCount(),
        this.queue.getWaitingCount(),
        this.queue.getCompletedCount(),
        this.queue.getFailedCount(),
      ]);

      return {
        available: true,
        active,
        waiting,
        completed,
        failed,
        total: active + waiting,
      };
    } catch (error) {
      logger.error('[TranscriptionQueue] Failed to get queue stats:', error);
      return { available: false, error: error.message };
    }
  }

  /**
   * Create a worker instance for processing transcription jobs
   * This should be called in a separate worker process
   * @param {Function} processor - Function to process transcription jobs
   * @returns {Worker|null} Worker instance or null if queue unavailable
   */
  createWorker(processor) {
    if (!this.isRedisEnabled) {
      logger.warn('[TranscriptionQueue] Cannot create worker - Redis not available');
      return null;
    }

    try {
      // Create BullMQ-compatible Redis connection for worker
      // Must use same configuration as the queue
      const Redis = require('ioredis');
      const connection = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
        maxRetriesPerRequest: null, // Required by BullMQ
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
        lazyConnect: true,
      });
      
      this.worker = new Worker(this.queueName, processor, {
        connection,
        concurrency: 2, // Process 2 jobs simultaneously
        removeOnComplete: 10,
        removeOnFail: 5,
      });

      this.worker.on('completed', (job) => {
        logger.info('[TranscriptionQueue] Job completed:', {
          jobId: job.id,
          mentorResponseId: job.data.mentorResponseId,
          stageId: job.data.stageId,
        });
      });

      this.worker.on('failed', (job, err) => {
        logger.error('[TranscriptionQueue] Job failed:', {
          jobId: job?.id,
          mentorResponseId: job?.data?.mentorResponseId,
          error: err.message,
        });
      });

      this.worker.on('error', (error) => {
        logger.error('[TranscriptionQueue] Worker error:', error);
      });

      logger.info('[TranscriptionQueue] Worker created successfully');
      return this.worker;
    } catch (error) {
      logger.error('[TranscriptionQueue] Failed to create worker:', error);
      return null;
    }
  }

  /**
   * Gracefully close the queue and worker connections
   */
  async close() {
    const promises = [];
    
    if (this.worker) {
      promises.push(this.worker.close());
    }
    
    if (this.queue) {
      promises.push(this.queue.close());
    }

    try {
      await Promise.all(promises);
      logger.info('[TranscriptionQueue] Closed successfully');
    } catch (error) {
      logger.error('[TranscriptionQueue] Error during close:', error);
    }
  }
}

// Create singleton instance
let transcriptionQueueInstance = null;

/**
 * Get or create the singleton TranscriptionQueue instance
 * @returns {TranscriptionQueue} TranscriptionQueue instance
 */
function getTranscriptionQueue() {
  if (!transcriptionQueueInstance) {
    transcriptionQueueInstance = new TranscriptionQueue();
  }
  return transcriptionQueueInstance;
}

module.exports = {
  TranscriptionQueue,
  getTranscriptionQueue,
}; 