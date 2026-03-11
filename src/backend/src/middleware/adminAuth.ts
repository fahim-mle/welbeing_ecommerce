import { Request, Response, NextFunction } from 'express';
import { auth, extractAccessToken, TokenPayload } from '../lib/auth';

export const adminAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = extractAccessToken(req);

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: Missing token' });
  }

  try {
    const decoded = auth.verifyToken(token);

    if (decoded.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden: Admin access only' });
    }

    (req as Request & { user?: TokenPayload }).user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
};
