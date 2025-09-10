const { updateUser } = require('~/models/userMethods');
const { logger } = require('~/config');

/**
 * Middleware to track user activity once per session.
 * Updates lastLogin timestamp on the first authenticated request of each session.
 */
const trackUserActivity = async (req, res, next) => {
  try {
    // Only track for authenticated users
    if (!req.user || !req.user._id) {
      return next();
    }

    // Check if we've already tracked activity for this session
    const sessionKey = `activity_tracked_${req.user._id}`;
    
    // Use a simple in-memory cache for session tracking
    if (!global.activityCache) {
      global.activityCache = new Map();
    }

    // If we haven't tracked this user's activity in this session yet
    if (!global.activityCache.has(sessionKey)) {
      // Update lastLogin timestamp
      await updateUser(req.user._id, { lastLogin: new Date() });
      
      // Mark this session as tracked (expires in 30 minutes)
      global.activityCache.set(sessionKey, Date.now());
      
      // Clean up old entries every 100 requests to prevent memory leaks
      if (global.activityCache.size % 100 === 0) {
        const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
        for (const [key, timestamp] of global.activityCache.entries()) {
          if (timestamp < thirtyMinutesAgo) {
            global.activityCache.delete(key);
          }
        }
      }

      logger.debug(`Updated lastLogin for user ${req.user._id}`);
    }

    next();
  } catch (error) {
    logger.error('[trackUserActivity] Error tracking user activity:', error);
    // Don't block the request if activity tracking fails
    next();
  }
};

module.exports = trackUserActivity; 