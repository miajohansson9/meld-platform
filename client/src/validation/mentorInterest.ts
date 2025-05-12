import { z } from 'zod';

export const mentorInterestSchema = z.object({
  firstName: z.string().min(1, 'First name is required').trim(),
  lastName: z.string().trim().optional(),
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  jobTitle: z.string().min(1, 'Job title is required').trim(),
  company: z.string().trim().optional(),
  industry: z.string().trim(),
  careerStage: z.string().trim(),
});
