const mongoose = require('mongoose');

const mentorInterestSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    jobTitle: {
      type: String,
      required: true,
      trim: true,
    },
    company: {
      type: String,
      trim: true,
    },
    industry: {
      type: String,
      required: true,
    },
    careerStage: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  },
);

// Add indexes for common queries
mentorInterestSchema.index({ email: 1 });
mentorInterestSchema.index({ status: 1 });
mentorInterestSchema.index({ createdAt: -1 });

const MentorInterest =
  mongoose.models.MentorInterest || mongoose.model('MentorInterest', mentorInterestSchema);

module.exports = MentorInterest;
