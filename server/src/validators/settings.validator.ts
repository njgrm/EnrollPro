import { z } from 'zod';

export const updateIdentitySchema = z.object({
  schoolName: z.string().min(1, 'School name is required').max(200),
});

export const toggleEnrollmentSchema = z.object({
  enrollmentOpen: z.boolean(),
});
