import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body ?? {});
    if (!result.success) {
      const message = result.error.issues.map((issue) => issue.message).join('; ');
      return res.status(400).json({ message: message || 'Invalid request payload' });
    }

    req.body = result.data;
    next();
  };
};
