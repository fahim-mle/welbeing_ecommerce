import { Request, Response, NextFunction } from 'express';
import { auth, extractAccessToken, TokenPayload } from '../lib/auth';
import { prisma } from '../lib/prisma';

export const adminAuth = async (req: Request, res: Response, next: NextFunction) => {
  const token = extractAccessToken(req);

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: Missing token' });
  }

  // ── Step 1: verify JWT signature and expiry ──────────────────────────────
  // Isolated so that a bad token returns 401, not 500.
  let decoded: TokenPayload;
  try {
    decoded = auth.verifyToken(token);
  } catch {
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }

  if (decoded.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Forbidden: Admin access only' });
  }

  // ── Step 2: database lookup + MFA enforcement ────────────────────────────
  // Separated from JWT verification so Prisma errors surface as 500 (via the
  // global error handler) rather than being silently swallowed as 401.
  try {
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { mfaEnabled: true },
    });

    if (user?.mfaEnabled) {
      // Positive check: the token must NOT carry mfaPending. Treating the
      // absence of the flag as "verified" is insufficient — an attacker who
      // crafts a token without the flag would pass. We explicitly reject any
      // token that signals the MFA step has not been completed.
      if (decoded.mfaPending === true) {
        return res.status(403).json({
          success: false,
          error: {
            message: 'MFA verification required',
            code: 'MFA_VERIFICATION_REQUIRED',
          },
        });
      }
    }

    (req as Request & { user?: TokenPayload }).user = decoded;
    return next();
  } catch (err) {
    // Forward database errors to the global error handler so they are logged
    // and returned as 500, not misclassified as 401 authentication failures.
    return next(err);
  }
};
