const mongoose = require('mongoose');

const mentorQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  pillar: { type: String, required: true },
  subTags: [{ type: String }],
  dateAdded: { type: Date, default: Date.now },
  file_id: { type: String, required: true, unique: true },
});

module.exports = mongoose.model('MentorQuestion', mentorQuestionSchema);
