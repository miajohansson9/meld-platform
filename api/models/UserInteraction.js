const mongoose = require('mongoose');

const userInteractionSchema = new mongoose.Schema({
  /* ─────────────── FOREIGN KEYS ─────────────── */
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  mentorFeedId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MentorFeedItem',
    default: null
  },
  /* if the answer did NOT come from a feed card (e.g. onboarding wizard or daily compass),
     mentorFeedId remains null */

  /* ─────────────── CORE DATA ─────────────── */
  kind: {
    type: String,
    enum: ['onboarding', 'fragment', 'compass', 'reflection', 'goal', 'win'],
    required: true,
    index: true
  },
  promptText: String,                        // literal question shown (UI copy)
  responseText: String,                      // free-text user answer
  numericAnswer: Number,                     // for sliders (mood, energy …)
  captureMethod: {
    type: String,
    enum: ['text', 'slider', 'voice', 'image', 'web'],
    default: 'text'
  },
  interactionMeta: {},                       // flexible JSON blob (e.g. slider min/max)

  /* ─────────────── FLAGS & DATES ─────────────── */
  isPrivate: { type: Boolean, default: false },
  capturedAt: { type: Date, default: Date.now, index: true }
}, {
  timestamps: true
});

// Indexes for performance
userInteractionSchema.index({ user: 1, kind: 1, capturedAt: -1 });
userInteractionSchema.index({ mentorFeedId: 1 });

// Static methods
userInteractionSchema.statics.findByUser = function(userId, options = {}) {
  const { kind, page = 1, limit = 25, sortBy = 'capturedAt', sortDirection = 'desc' } = options;
  
  const query = { user: userId };
  if (kind) query.kind = kind;
  
  const sortOrder = sortDirection === 'asc' ? 1 : -1;
  
  return this.find(query)
    .sort({ [sortBy]: sortOrder })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('mentorFeedId')
    .lean();
};

userInteractionSchema.statics.createInteraction = function(data) {
  return this.create(data);
};

userInteractionSchema.statics.findByMentorFeed = function(mentorFeedId) {
  return this.find({ mentorFeedId }).sort({ capturedAt: -1 }).lean();
};

const UserInteraction = mongoose.model('UserInteraction', userInteractionSchema);

module.exports = UserInteraction; 