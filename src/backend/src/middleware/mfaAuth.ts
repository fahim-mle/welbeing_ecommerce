import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

/**
 * Blocks requests that carry a short-lived MFA-pending token from reaching
 * routes that require a fully-authenticated session.
 *
 * Context: when a user with MFA enabled logs in, the server issues a temporary
 * token with `mfaPending: true`. That token is only valid for the two
 * unauthenticated MFA completion endpoints (/verify, /verify-backup-code).
 * Without this guard, a holder of such a token could call management routes
 * (enroll, status, regenerate-backup-codes) that sit behind the standard
 * `authenticate` middleware, which only checks token validity — not MFA state.
 *
 * Apply this middleware AFTER `authenticate` on any route that must not be
 * reachable with a pending-MFA token.
 */
export const requireMfaVerified = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.mfaPending) {
    return res.status(403).json({
      success: false,
      error: {
        message: 'MFA verification required to access this resource',
        code: 'MFA_VERIFICATION_REQUIRED',
      },
    });
  }
  next();
};
