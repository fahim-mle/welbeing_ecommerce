import { Request, Response, NextFunction } from 'express';
import { auth, TokenPayload } from '../lib/auth';

export const adminAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = auth.verifyToken(token);

    if (decoded.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Forbidden: Admin access only' });
    }

    // Attach user to request if needed, though usually handled by general auth middleware
    (req as Request & { user?: TokenPayload }).user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
};
