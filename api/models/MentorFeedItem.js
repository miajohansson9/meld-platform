const mongoose = require('mongoose');

const mentorFeedItemSchema = new mongoose.Schema({
  /* ─── Identity ─── */
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null                 // null = template card all new users get
  },
  origin: {
    type: String,
    enum: ['manual', 'ai'],
    default: 'manual'
  },
  trigger: {
    type: {
      type: String,
      enum: ['onboarding', 'analysis', 'scheduled', 'manual'],
      required: true
    },
    refId: mongoose.Schema.Types.ObjectId  // nullable
  },

  /* ─── Copy & Kind ─── */
  type: {
    type: String,
    enum: ['todo', 'follow_up', 'insight', 'reminder'],
    required: true
  },
  todoKind: {
    type: String,
    enum: ['goal', 'reflection', 'plan', 'energy_check', 'gratitude', 'problem'],
    required: false
  },
  promptText: {
    type: String,
    required: true
  },
  systemPrompt: String, // system prompt for the ai to have more context/instructions for conversation

  /* ─── CTA State ─── */
  cta: {
    primaryLabel: {
      type: String,
      default: 'Answer'
    },
    secondaryLabel: String,
    dueAt: Date
  },
  status: {
    feedState: {
      type: String,
      enum: ['new', 'seen', 'clicked', 'dismissed'],
      default: 'new'
    },
    todoState: {
      type: String,
      enum: ['pending', 'answered', 'scheduled', 'skipped', 'snoozed'],
      default: 'pending'
    }
  },
  answeredInteraction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserInteraction',
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },

  /* ─── Ordering ─── */
  priority: {
    type: Number,
    default: 3
  },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  relevanceScore: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.5
  },
  expiresAt: {
    type: Date,
    default: null
  },

  /* ─── Timestamps ─── */
  deliveredAt: {
    type: Date,
    default: null
  },
  snoozedUntil: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for performance
mentorFeedItemSchema.index({ user: 1, 'status.feedState': 1, priority: -1 });
mentorFeedItemSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
mentorFeedItemSchema.index({ 'status.todoState': 1, user: 1 });

// Static methods
mentorFeedItemSchema.statics.findByUser = function(userId, options = {}) {
  const { feedState, todoState, page = 1, limit = 25 } = options;
  
  const query = { user: userId };
  if (feedState) query['status.feedState'] = feedState;
  if (todoState) query['status.todoState'] = todoState;
  
  return this.find(query)
    .sort({ priority: -1, createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('answeredInteraction')
    .lean();
};

mentorFeedItemSchema.statics.createFeedItem = function(data) {
  return this.create(data);
};

mentorFeedItemSchema.statics.updateStatus = function(id, statusUpdate) {
  return this.findByIdAndUpdate(id, { $set: statusUpdate }, { new: true });
};

const MentorFeedItem = mongoose.model('MentorFeedItem', mentorFeedItemSchema);

module.exports = MentorFeedItem; 