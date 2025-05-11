const mongoose = require('mongoose');

const mentorQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  pillar: { type: String, required: true },
  subTags: [{ type: String }],
  dateAdded: { type: Date, default: Date.now },
});

module.exports = mongoose.model('MentorQuestion', mentorQuestionSchema);
