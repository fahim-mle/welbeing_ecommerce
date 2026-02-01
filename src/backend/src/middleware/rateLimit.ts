import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

const isDev = process.env.NODE_ENV === 'development';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  // In dev/HMR the frontend can trigger lots of requests (search typing, refreshes).
  // Keep production conservative.
  max: isDev ? 5_000 : 200,
  standardHeaders: true,
  legacyHeaders: false,
});
