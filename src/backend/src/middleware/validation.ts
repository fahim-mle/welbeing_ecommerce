import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

const buildValidationMessage = (issues: { message: string }[]) => {
  return issues.map((issue) => issue.message).join('; ');
};

export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body ?? {});
    if (!result.success) {
      const message = buildValidationMessage(result.error.issues);
      return res.status(400).json({ message: message || 'Invalid request payload' });
    }

    req.body = result.data;
    next();
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query ?? {});
    if (!result.success) {
      const message = buildValidationMessage(result.error.issues);
      return res.status(400).json({ message: message || 'Invalid query parameters' });
    }

    req.query = result.data as any;
    next();
  };
};
