import { CorsOptions } from 'cors';

/**
 * Build CORS options from environment.
 *
 * - origin: explicit allowlist — never wildcard `*` (required for credentials).
 * - credentials: true so the browser sends/receives cookies.
 * - methods: only the HTTP verbs the API actually uses.
 *
 * Set CORS_ORIGIN env var to the frontend URL.
 * In production behind the Nginx reverse proxy both services share the
 * same origin, so CORS headers are technically redundant — but we keep
 * them as defence-in-depth.
 */
export const buildCorsOptions = (): CorsOptions => {
  const defaultOrigin = 'http://localhost:5173';
  const raw = process.env.CORS_ORIGIN || defaultOrigin;

  // Support comma-separated origins for multi-domain setups.
  const allowedOrigins = raw.split(',').map((o) => o.trim()).filter(Boolean);

  return {
    origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  };
};
