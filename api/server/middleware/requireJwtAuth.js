const passport = require('passport');
const trackUserActivity = require('./trackUserActivity');

// Combine JWT authentication with activity tracking
const requireJwtAuth = [
  passport.authenticate('jwt', { session: false }),
  trackUserActivity
];

module.exports = requireJwtAuth;
