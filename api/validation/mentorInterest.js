const { z } = require('zod');

const mentorInterestSchema = z.object({
  firstName: z.string().min(1, 'First name is required').trim(),
  lastName: z.string().trim().optional(),
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  jobTitle: z.string().min(1, 'Job title is required').trim(),
  company: z.string().trim().optional(),
  industry: z.enum([
    'Technology',
    'Finance',
    'Healthcare',
    'Education',
    'Non-Profit',
    'Marketing',
    'Other'
  ], {
    required_error: 'Industry is required',
    invalid_type_error: 'Invalid industry selected'
  }),
  careerStage: z.enum([
    'Early-career (0-5 years)',
    'Mid-career (5-15 years)',
    'Senior-career (15+ years)'
  ], {
    required_error: 'Career stage is required',
    invalid_type_error: 'Invalid career stage selected'
  }),
  pillars: z.array(z.enum([
    'Starting Points to Success',
    'Profile & Presentation',
    'Financial Fluency',
    'The Future of Work'
  ])).min(1, 'At least one pillar must be selected')
});

module.exports = {
  mentorInterestSchema
}; 