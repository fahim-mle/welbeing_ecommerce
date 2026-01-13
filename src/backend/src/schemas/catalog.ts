import { z } from 'zod';

export const categorySchema = z.object({
  name: z.string().min(1, 'name is required'),
  description: z.string().optional(),
  parentId: z.union([z.number(), z.string()]).optional(),
});

export const updateCategorySchema = categorySchema.partial();

export const tagSchema = z.object({
  name: z.string().min(1, 'name is required'),
  type: z.enum(['GOAL', 'FEATURE', 'NEED']),
});

export const updateTagSchema = tagSchema.partial();
