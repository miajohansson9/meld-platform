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
      enum: ['Technology', 'Finance', 'Healthcare', 'Education', 'Non-Profit', 'Marketing', 'Other'],
    },
    careerStage: {
      type: String,
      required: true,
      enum: ['Early-career (0-5 years)', 'Mid-career (5-15 years)', 'Senior-career (15+ years)'],
    },
    pillars: [{
      type: String,
      enum: ['Starting Points to Success', 'Profile & Presentation', 'Financial Fluency', 'The Future of Work'],
    }],
    topics: {
      type: String,
      trim: true,
    },
    privacyPreferences: [{
      type: String,
      enum: ['First Name', 'Job Title', 'Industry', 'Career Stage', 'None'],
    }],
    consent: {
      type: Boolean,
      required: true,
      default: false,
    },
    comments: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes for common queries
mentorInterestSchema.index({ email: 1 });
mentorInterestSchema.index({ status: 1 });
mentorInterestSchema.index({ createdAt: -1 });

const MentorInterest = mongoose.models.MentorInterest || mongoose.model('MentorInterest', mentorInterestSchema);

module.exports = MentorInterest; 