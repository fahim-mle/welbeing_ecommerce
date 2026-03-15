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
    page: z.any().optional(),
    limit: z.any().optional(),
  })
  .transform((data, ctx) => {
    // Default to 1 / 20 when the param is absent; reject non-positive integers.
    const parsePage = (raw: unknown): number => {
      if (raw === undefined || raw === null || raw === '') return 1;
      const n = Number(raw);
      if (!Number.isInteger(n) || n < 1) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Page must be >= 1', path: ['page'] });
        return z.NEVER;
      }
      return n;
    };

    const parseLimit = (raw: unknown): number => {
      if (raw === undefined || raw === null || raw === '') return 20;
      const n = Number(raw);
      if (!Number.isInteger(n) || n < 1 || n > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Limit must be between 1 and 100',
          path: ['limit'],
        });
        return z.NEVER;
      }
      return n;
    };

    return {
      search: data.search || undefined,
      page: parsePage(data.page),
      limit: parseLimit(data.limit),
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
    page: z.any().optional(),
    limit: z.any().optional(),
  })
  .transform((data, ctx) => {
    const parsePage = (raw: unknown): number => {
      if (raw === undefined || raw === null || raw === '') return 1;
      const n = Number(raw);
      if (!Number.isInteger(n) || n < 1) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Page must be >= 1', path: ['page'] });
        return z.NEVER;
      }
      return n;
    };

    const parseLimit = (raw: unknown): number => {
      if (raw === undefined || raw === null || raw === '') return 20;
      const n = Number(raw);
      if (!Number.isInteger(n) || n < 1 || n > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Limit must be between 1 and 100',
          path: ['limit'],
        });
        return z.NEVER;
      }
      return n;
    };

    // Transform the string 'true'/'false' to a boolean, or leave as undefined.
    const mfaEnabled =
      data.mfaEnabled === 'true' ? true : data.mfaEnabled === 'false' ? false : undefined;

    return {
      search: data.search || undefined,
      role: data.role,
      status: data.status,
      mfaEnabled,
      page: parsePage(data.page),
      limit: parseLimit(data.limit),
    };
  });

export type AdminUsersQuery = z.infer<typeof adminUsersQuerySchema>;
