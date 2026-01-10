import { Request, Response, NextFunction } from 'express';

const ADMIN_API_SECRET = process.env.ADMIN_API_SECRET || 'super-secret-admin-key';

export const adminAuth = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-admin-secret'];

  // Check if the provided secret matches the env variable
  if (!apiKey || apiKey !== ADMIN_API_SECRET) {
    return res.status(403).json({ message: 'Forbidden: Invalid Admin Credentials' });
  }

  next();
};
