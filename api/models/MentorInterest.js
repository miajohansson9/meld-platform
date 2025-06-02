const mongoose = require('mongoose');
const crypto = require('crypto');

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
    // Security fields - excluded from normal queries
    accessToken: {
      type: String,
      required: true,
      unique: true,
      default: () => crypto.randomBytes(32).toString('hex'), // 64-char hex string
      select: false, // Never include in normal queries
    },
    tokenExpiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      select: false, // Never include in normal queries
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
mentorInterestSchema.index({ accessToken: 1 }); // For token lookups

const MentorInterest =
  mongoose.models.MentorInterest || mongoose.model('MentorInterest', mentorInterestSchema);

module.exports = MentorInterest;
