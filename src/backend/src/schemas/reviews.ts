import { z } from 'zod';

export const reviewBodySchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional().nullable().transform((value) => value || null),
});

export type ReviewBody = z.infer<typeof reviewBodySchema>;
