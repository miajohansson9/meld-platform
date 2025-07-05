const mongoose = require('mongoose');

const winsViewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  achievedAt: {
    type: String, // yyyy-mm-dd (local, as string for easy querying)
    required: true,
    index: true
  },
  titleInteractionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserInteraction',
    required: true
  },
  descriptionInteractionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserInteraction',
    default: null
  }
}, {
  timestamps: true
});

winsViewSchema.index({ user: 1, achievedAt: 1 }, { unique: true });

const WinsView = mongoose.model('WinsView', winsViewSchema);

module.exports = WinsView; 