import { z } from 'zod';

const imageUrlsSchema = z.array(z.string().min(1)).default([]);
const tagIdsSchema = z.array(z.union([z.number(), z.string()])).default([]);

export const createProductSchema = z.object({
  name: z.string().min(1, 'name is required'),
  description: z.string().min(1, 'description is required'),
  price: z.union([z.number(), z.string()]),
  categoryId: z.union([z.number(), z.string()]),
  imageUrls: imageUrlsSchema.optional(),
  tagIds: tagIdsSchema.optional(),
  stockQuantity: z.union([z.number(), z.string()]).optional(),
  isVisible: z.boolean().optional(),
  ingredients: z.string().optional(),
  usageInstructions: z.string().optional(),
  benefits: z.string().optional(),
  safetyDisclaimers: z.string().optional(),
});

export const updateProductSchema = createProductSchema.partial();
