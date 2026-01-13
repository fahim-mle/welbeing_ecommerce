import cors from 'cors';
import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { randomUUID } from 'crypto';

import metadataRouter from './api/metadata';
import ordersRouter from './api/orders';
import productsRouter from './api/products';
import adminProductsRouter from './api/admin/products';
import adminOrdersRouter from './api/admin/orders';
import authRouter from './api/auth';
import { setupSwagger } from './swagger';
import { AppError } from './types/shared';
import { logger } from './lib/logger';
import { apiLimiter, authLimiter } from './middleware/rateLimit';

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use((req, res, next) => {
  const requestId = req.headers['x-request-id']?.toString() ?? randomUUID();
  (req as Request & { requestId?: string }).requestId = requestId;
  res.setHeader('x-request-id', requestId);
  next();
});

setupSwagger(app);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authLimiter, authRouter);
app.use('/api/products', apiLimiter, productsRouter);
app.use('/api/orders', apiLimiter, ordersRouter);
app.use('/api/admin/products', apiLimiter, adminProductsRouter);
app.use('/api/admin/orders', apiLimiter, adminOrdersRouter);
app.use('/api', apiLimiter, metadataRouter); // /api/categories, /api/tags

app.get('/', (req, res) => {
  res.json({ message: 'Health and Wellbeing Store API' });
});

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ message: 'Not Found' });
});

// Global Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  const requestId = (req as Request & { requestId?: string }).requestId;
  if (err instanceof AppError) {
    logger.warn('Handled application error', {
      requestId,
      error: err,
      path: req.path,
      method: req.method,
    });
    res.status(err.statusCode).json({ message: err.message });
    return;
  }

  logger.error('Unhandled error', {
    requestId,
    error: err,
    path: req.path,
    method: req.method,
  });
  res.status(500).json({ message: 'Internal Server Error' });
});

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info('Server is running', { port: PORT });
  });
}

export default app;
