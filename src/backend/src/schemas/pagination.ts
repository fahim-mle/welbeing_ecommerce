import { z } from 'zod';

const parsePositiveInt = (value: unknown) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0) {
    return undefined;
  }

  return num;
};

export const paginationSchema = z
  .object({
    page: z.any().optional(),
    limit: z.any().optional(),
  })
  .transform((data) => {
    const page = parsePositiveInt(data.page) ?? 1;
    const limit = parsePositiveInt(data.limit) ?? 20;

    return { page, limit };
  });
