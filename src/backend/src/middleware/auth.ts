import { Request, Response, NextFunction } from 'express';
import { auth, extractAccessToken, TokenPayload } from '../lib/auth';

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = extractAccessToken(req);
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const decoded = auth.verifyToken(token);
    (req as AuthRequest).user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
