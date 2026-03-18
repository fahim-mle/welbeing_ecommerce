import rateLimit from 'express-rate-limit';

const isDev = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  // Disable rate limiting in test; keep strict in production.
  max: isTest ? 10_000 : 20,
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  // In dev/HMR the frontend can trigger lots of requests (search typing, refreshes).
  // Keep production conservative.
  max: isDev || isTest ? 5_000 : 200,
  standardHeaders: true,
  legacyHeaders: false,
});
