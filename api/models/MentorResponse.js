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
      enum: ['pending', 'transcribed', 'submitted'],
      default: 'pending',
    },
    whisper_model: {
      type: String,
      required: false,
    },
    submitted_at: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

// Unique constraint for mentor_interest + stage_id combination
mentorResponseSchema.index({ mentor_interest: 1, stage_id: 1 }, { unique: true });

module.exports = mongoose.model('MentorResponse', mentorResponseSchema);