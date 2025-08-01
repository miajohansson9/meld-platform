const { z } = require('zod');

const userInterestSchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  currentSituation: z.string().min(1, 'Please select your current situation').trim(),
  
  // College-specific fields
  currentSchool: z.string().trim().optional(),
  studyingField: z.string().trim().optional(),
  graduationYear: z.string().trim().optional(),
  openToStudentMentorship: z.boolean().optional(),
  
  // Working professional fields
  jobTitle: z.string().trim().optional(),
  company: z.string().trim().optional(),
  workCity: z.string().trim().optional(),
  openToMentoring: z.boolean().optional(),
  
  // Recent grad/job searching fields
  studiedField: z.string().trim().optional(),
  currentCity: z.string().trim().optional(),
  activelyApplying: z.string().trim().optional(),
  
  // Taking break/other fields
  currentFocus: z.string().trim().optional(),
  
  // Shared fields
  referralSource: z.string().min(1, 'Please tell us how you heard about MELD').trim(),
  referralSourceOther: z.string().trim().optional(),
  motivation: z.string().min(1, 'Please tell us what you hope to get out of MELD').trim(),
  completedSubstackSignup: z.boolean().optional().default(false),
}).refine((data) => {
  // Conditional validation based on current situation
  if (data.currentSituation === 'In college' && !data.currentSchool?.trim()) {
    return false;
  }
  if (data.currentSituation === 'Currently working' && !data.jobTitle?.trim()) {
    return false;
  }
  if (data.currentSituation === 'Recently graduated / job searching' && !data.studiedField?.trim()) {
    return false;
  }
  return true;
}, {
  message: 'Please fill in all required fields for your situation',
  path: ['currentSituation'], // This will show the error on the situation field
});

module.exports = {
  userInterestSchema,
}; 