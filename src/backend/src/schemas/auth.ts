import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const verifyEmailRequestSchema = z.object({
  email: z.string().email('Valid email is required'),
});

export const resetPasswordRequestSchema = z.object({
  email: z.string().email('Valid email is required'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const oauthSchema = z.object({
  providerToken: z.string().min(1, 'Provider token is required'),
  email: z.string().email('Valid email is required'),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
});

export const verifyEnrollmentSchema = z.object({
  token: z.string().length(6).regex(/^\d{6}$/, 'Token must be 6 digits'),
});
