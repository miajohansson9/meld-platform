const mongoose = require('mongoose');

const mentorResponseSchema = new mongoose.Schema(
  {
    mentor_interest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MentorInterest',
      required: true,
    },
    stage_id: {
      type: Number,
      required: true,
    },
    question: {
      type: String,
      required: false,
    },
    response_text: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('MentorResponse', mentorResponseSchema);