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

/**
 * Query schema for the admin products list endpoint.
 * Validates page (>= 1) and limit (1–100) strictly, returning 400 on violations.
 * Limit values above 100 are capped in the service layer; the schema only rejects
 * values that are clearly invalid (non-positive integers).
 */
export const adminProductsQuerySchema = z
  .object({
    search: z.string().optional(),
    page: z.preprocess(
      (val) => (Array.isArray(val) ? undefined : typeof val === 'string' ? Number(val) : val),
      z.number().int().min(1).optional()
    ).optional(),
    limit: z.preprocess(
      (val) => (Array.isArray(val) ? undefined : typeof val === 'string' ? Number(val) : val),
      z.number().int().min(1).max(100).optional()
    ).optional(),
  })
  .transform((data) => {
    return {
      search: data.search || undefined,
      page: data.page ?? 1,
      limit: data.limit ?? 20,
    };
  });

/**
 * Query schema for the admin users list endpoint.
 * Validates page (>= 1) and limit (1–100) strictly, returning 400 on violations.
 * Supports optional search (email, firstName, lastName), role, status, and mfaEnabled filters.
 * The mfaEnabled string param ('true'/'false') is transformed to a boolean at parse time.
 */
export const adminUsersQuerySchema = z
  .object({
    search: z.string().optional(),
    role: z.enum(['USER', 'ADMIN']).optional(),
    status: z.enum(['active', 'inactive']).optional(),
    // Query params arrive as strings; transform to boolean or undefined after validation.
    mfaEnabled: z.enum(['true', 'false']).optional(),
    page: z.preprocess(
      (val) => (Array.isArray(val) ? undefined : typeof val === 'string' ? Number(val) : val),
      z.number().int().min(1).optional()
    ).optional(),
    limit: z.preprocess(
      (val) => (Array.isArray(val) ? undefined : typeof val === 'string' ? Number(val) : val),
      z.number().int().min(1).max(100).optional()
    ).optional(),
  })
  .transform((data) => {
    // Transform the string 'true'/'false' to a boolean, or leave as undefined.
    const mfaEnabled =
      data.mfaEnabled === 'true' ? true : data.mfaEnabled === 'false' ? false : undefined;

    return {
      search: data.search || undefined,
      role: data.role,
      status: data.status,
      mfaEnabled,
      page: data.page ?? 1,
      limit: data.limit ?? 20,
    };
  });

export type AdminUsersQuery = z.infer<typeof adminUsersQuerySchema>;
