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

export const productListQuerySchema = z
  .object({
    category: z.union([z.number(), z.string()]).optional(),
    tag: z.union([z.number(), z.string()]).optional(),
    search: z.string().optional(),
    page: z.any().optional(),
    limit: z.any().optional(),
  })
  .transform((data) => {
    const parseNumber = (value: unknown) => {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? undefined : parsed;
    };

    const page = parseNumber(data.page);
    const limit = parseNumber(data.limit);

    return {
      category: parseNumber(data.category),
      tag: parseNumber(data.tag),
      search: data.search,
      page: page && page > 0 ? page : 1,
      limit: limit && limit > 0 ? limit : 20,
    };
  });
