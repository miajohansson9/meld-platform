const mongoose = require('mongoose');

const compassViewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  date: {
    type: String, // yyyy-mm-dd (local, as string for easy querying)
    required: true,
    index: true
  },
  mood: Number, // from numericAnswer
  energy: Number, // from numericAnswer
  alignment: Number, // from numericAnswer (legacy)
  note: String, // daily note/intention
  reflectionInteractionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserInteraction',
    default: null
  },
  // Evening reflection fields
  completion: {
    type: Number,
    enum: [0, 20, 40, 60, 80, 100],
    default: null
  },
  blocker: {
    type: String,
    enum: ['priorityShift', 'emergency', 'lowEnergy', 'overScoped', 'other'],
    default: null
  },
  improvementNote: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

compassViewSchema.index({ user: 1, date: 1 }, { unique: true });

const CompassView = mongoose.model('CompassView', compassViewSchema);

module.exports = CompassView; 