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
    preamble: {
      type: String,
      required: false,
    },
    response_text: {
      type: String,
      default: '',
    },
    audio_url: {
      type: String,
    },
    duration_ms: {
      type: Number,
      required: false,
    },
    source_question_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MentorQuestion',
    },
    version: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: ['pending', 'transcribed', 'submitted', 'rejected'],
      default: 'pending',
    },
    whisper_model: {
      type: String,
      required: false,
    },
    submitted_at: {
      type: Date,
    },
    rejection_reason: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  },
);

// Partial unique constraint - only one non-rejected response per stage
mentorResponseSchema.index(
  { mentor_interest: 1, stage_id: 1 }, 
  { 
    unique: true,
    partialFilterExpression: { status: { $in: ['pending', 'transcribed', 'submitted'] } }
  }
);

module.exports = mongoose.model('MentorResponse', mentorResponseSchema);