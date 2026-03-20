import { CookieOptions } from 'express';

const isProduction = () => process.env.NODE_ENV === 'production';

/**
 * Environment-aware cookie defaults.
 *
 * Dev  : Secure=false, SameSite=Lax   (plain HTTP, cross-port)
 * Prod : Secure=true,  SameSite=Strict (HTTPS, same origin via proxy)
 */
export const baseCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: isProduction(),
  sameSite: isProduction() ? 'strict' : 'lax',
  path: '/',
});

/** Short-lived access token cookie (1 hour). */
export const accessTokenCookie = (): CookieOptions => ({
  ...baseCookieOptions(),
  maxAge: 60 * 60 * 1000,
});

/** Long-lived refresh token cookie (7 days). */
export const refreshTokenCookie = (): CookieOptions => ({
  ...baseCookieOptions(),
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

/** Cookie names — single source of truth. */
export const COOKIE_NAMES = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
} as const;
