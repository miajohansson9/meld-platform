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
  note: String, // daily note/intention
  dailySummary: String, // AI-generated summary of the day combining morning and evening
  eveningNote: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

compassViewSchema.index({ user: 1, date: 1 }, { unique: true });

const CompassView = mongoose.model('CompassView', compassViewSchema);

module.exports = CompassView; 