const { z } = require('zod');

const mentorInterestSchema = z.object({
  firstName: z.string().min(1, 'First name is required').trim(),
  lastName: z.string().trim().optional(),
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  jobTitle: z.string().min(1, 'Job title is required').trim(),
  company: z.string().trim().optional(),
  industry: z.string().trim(),
  careerStage: z.string().trim(),
});

const mentorQuestionSchema = z.object({
  question: z.string().min(1, 'Question is required').trim(),
  pillar: z.enum(
    [
      'Starting Points to Success',
      'Profile & Presentation',
      'Financial Fluency',
      'The Future of Work',
    ],
    {
      required_error: 'Pillar is required',
      invalid_type_error: 'Invalid pillar selected',
    },
  ),
  subTags: z.array(z.string()).optional(),
});

module.exports = {
  mentorInterestSchema,
  mentorQuestionSchema,
};
