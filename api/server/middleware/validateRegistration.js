const { isEnabled } = require('~/server/utils');
const { logger } = require('~/config');

function validateRegistration(req, res, next) {
  if (req.invite) {
    return next();
  }

  if (!isEnabled(process.env.ALLOW_REGISTRATION)) {
    return res.status(403).json({
      message: 'Registration is not allowed.',
    });
  }

  // Validate signup code if it's required
  const requiredSignupCode = process.env.SIGNUP_CODE;
  if (requiredSignupCode) {
    const { signup_code } = req.body;
    
    if (!signup_code) {
      logger.warn('[validateRegistration] Missing signup code');
      return res.status(400).json({
        message: 'Signup code is required.',
      });
    }

    if (signup_code.toUpperCase() !== requiredSignupCode.toUpperCase()) {
      logger.warn('[validateRegistration] Invalid signup code provided');
      return res.status(400).json({
        message: 'Invalid signup code.',
      });
    }

    logger.info('[validateRegistration] Valid signup code provided');
  }

  next();
}

module.exports = validateRegistration;
