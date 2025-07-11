const cookies = require('cookie');
const jwt = require('jsonwebtoken');
const {
  registerUser,
  resetPassword,
  setAuthTokens,
  requestPasswordReset,
} = require('~/server/services/AuthService');
const { findSession, getUserById, deleteAllUserSessions } = require('~/models');
const { logger } = require('~/config');

const registrationController = async (req, res) => {
  try {
    const response = await registerUser(req.body);
    const { status, message, userId } = response;
    
    // If registration failed, return error
    if (status !== 201) {
      return res.status(status).send({ message });
    }
    
    // If registration succeeded, automatically log in the user
    const user = await getUserById(userId);
    if (!user) {
      logger.error('[registrationController] User not found after creation');
      return res.status(500).json({ message: 'Registration completed but login failed' });
    }

    // Remove sensitive fields from user object
    const { password: _p, totpSecret: _t, __v, ...userResponse } = user;
    userResponse.id = userResponse._id.toString();

    // Set auth tokens (JWT + refresh token cookie)
    const token = await setAuthTokens(user._id, res);

    return res.status(201).json({ token, user: userResponse });
  } catch (err) {
    logger.error('[registrationController]', err);
    return res.status(500).json({ message: err.message });
  }
};

const resetPasswordRequestController = async (req, res) => {
  try {
    const resetService = await requestPasswordReset(req);
    if (resetService instanceof Error) {
      return res.status(400).json(resetService);
    } else {
      return res.status(200).json(resetService);
    }
  } catch (e) {
    logger.error('[resetPasswordRequestController]', e);
    return res.status(400).json({ message: e.message });
  }
};

const resetPasswordController = async (req, res) => {
  try {
    const resetPasswordService = await resetPassword(
      req.body.userId,
      req.body.token,
      req.body.password,
    );
    if (resetPasswordService instanceof Error) {
      return res.status(400).json(resetPasswordService);
    } else {
      await deleteAllUserSessions({ userId: req.body.userId });
      return res.status(200).json(resetPasswordService);
    }
  } catch (e) {
    logger.error('[resetPasswordController]', e);
    return res.status(400).json({ message: e.message });
  }
};

const refreshController = async (req, res) => {
  const refreshToken = req.headers.cookie ? cookies.parse(req.headers.cookie).refreshToken : null;
  if (!refreshToken) {
    return res.status(200).send('Refresh token not provided');
  }

  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await getUserById(payload.id, '-password -__v -totpSecret');
    if (!user) {
      return res.status(401).redirect('/login');
    }

    const userId = payload.id;

    if (process.env.NODE_ENV === 'CI') {
      const token = await setAuthTokens(userId, res);
      return res.status(200).send({ token, user });
    }

    // Find the session with the hashed refresh token
    const session = await findSession({ userId: userId, refreshToken: refreshToken });

    if (session && session.expiration > new Date()) {
      const token = await setAuthTokens(userId, res, session._id);
      res.status(200).send({ token, user });
    } else if (req?.query?.retry) {
      // Retrying from a refresh token request that failed (401)
      res.status(403).send('No session found');
    } else if (payload.exp < Date.now() / 1000) {
      res.status(403).redirect('/login');
    } else {
      res.status(401).send('Refresh token expired or not found for this user');
    }
  } catch (err) {
    logger.error(`[refreshController] Refresh token: ${refreshToken}`, err);
    res.status(403).send('Invalid refresh token');
  }
};

const validateSignupCodeController = async (req, res) => {
  try {
    const { signupCode } = req.body;
    const validSignupCode = process.env.SIGNUP_CODE;

    if (!signupCode) {
      return res.status(400).json({ 
        message: 'Signup code is required',
        valid: false 
      });
    }

    if (!validSignupCode) {
      logger.error('[validateSignupCodeController] SIGNUP_CODE environment variable not set');
      return res.status(500).json({ 
        message: 'Server configuration error',
        valid: false 
      });
    }

    const isValid = signupCode.toUpperCase() === validSignupCode.toUpperCase();
    
    if (isValid) {
      return res.status(200).json({ 
        message: 'Valid signup code',
        valid: true 
      });
    } else {
      return res.status(400).json({ 
        message: 'Invalid signup code',
        valid: false 
      });
    }
  } catch (err) {
    logger.error('[validateSignupCodeController]', err);
    return res.status(500).json({ 
      message: 'Something went wrong',
      valid: false 
    });
  }
};

module.exports = {
  refreshController,
  registrationController,
  resetPasswordController,
  resetPasswordRequestController,
  validateSignupCodeController,
};
