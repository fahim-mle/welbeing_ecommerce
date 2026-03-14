import { Request, Response, NextFunction } from 'express';
import { auth, extractAccessToken, TokenPayload } from '../lib/auth';
import { prisma } from '../lib/prisma';

export const adminAuth = async (req: Request, res: Response, next: NextFunction) => {
  const token = extractAccessToken(req);

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: Missing token' });
  }

  try {
    const decoded = auth.verifyToken(token);

    if (decoded.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden: Admin access only' });
    }

    // Check if this admin has MFA enrolled. If so, the token must not carry
    // the mfaPending flag — that flag means the user authenticated with their
    // password but has not yet completed the TOTP/backup-code step.
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { mfaEnabled: true },
    });

    if (user?.mfaEnabled && decoded.mfaPending) {
      return res.status(403).json({ message: 'MFA verification required' });
    }

    (req as Request & { user?: TokenPayload }).user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
};
