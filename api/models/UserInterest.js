const mongoose = require('mongoose');

const userInterestSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    currentSituation: {
      type: String,
      required: true,
      trim: true,
    },
    
    // College-specific fields
    currentSchool: {
      type: String,
      trim: true,
    },
    studyingField: {
      type: String,
      trim: true,
    },
    graduationYear: {
      type: String,
      trim: true,
    },
    openToStudentMentorship: {
      type: Boolean,
    },
    
    // Working professional fields
    jobTitle: {
      type: String,
      trim: true,
    },
    company: {
      type: String,
      trim: true,
    },
    workCity: {
      type: String,
      trim: true,
    },
    openToMentoring: {
      type: Boolean,
    },
    
    // Recent grad/job searching fields
    studiedField: {
      type: String,
      trim: true,
    },
    currentCity: {
      type: String,
      trim: true,
    },
    activelyApplying: {
      type: String,
      trim: true,
    },
    
    // Taking break/other fields
    currentFocus: {
      type: String,
      trim: true,
    },
    
    // Shared fields
    referralSource: {
      type: String,
      required: true,
      trim: true,
    },
    referralSourceOther: {
      type: String,
      trim: true,
    },
    motivation: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

// Add indexes for common queries
userInterestSchema.index({ email: 1 });
userInterestSchema.index({ createdAt: -1 });

const UserInterest =
  mongoose.models.UserInterest || mongoose.model('UserInterest', userInterestSchema);

module.exports = UserInterest; 