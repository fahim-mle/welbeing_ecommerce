import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import express, { NextFunction, Request, Response } from 'express';

// Load backend-local .env reliably even when running from monorepo root.
// (dotenv/config loads from process.cwd(), which is unstable with workspaces.)
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });
import helmet from 'helmet';
import morgan from 'morgan';
import { randomUUID } from 'crypto';

import metadataRouter from './api/metadata';
import ordersRouter from './api/orders';
import productsRouter from './api/products';
import adminProductsRouter from './api/admin/products';
import adminOrdersRouter from './api/admin/orders';
import adminCatalogRouter from './api/admin/catalog';
import adminUsersRouter from './api/admin/users';
import adminAnalyticsRouter from './api/admin/analytics';
import adminUploadsRouter from './api/admin/uploads';
import authRouter from './api/auth';
import mfaRouter from './api/mfa';
import usersRouter from './api/users';
import addressesRouter from './api/addresses';
import reviewsRouter, { productReviewsRouter } from './api/reviews';
import adminReviewsRouter from './api/admin/reviews';
import { setupSwagger } from './swagger';
import { AppError } from './types/shared';
import { buildCorsOptions } from './lib/cors';
import { logger } from './lib/logger';
import { apiLimiter, authLimiter } from './middleware/rateLimit';
import { prisma } from './lib/prisma';

const app = express();

// Trust proxy headers from nginx reverse proxy
app.set('trust proxy', true);

app.use(helmet());
app.use(cors(buildCorsOptions()));
app.use(cookieParser());
app.use(morgan('dev'));
app.use('/uploads', express.static(path.resolve(process.cwd(), process.env.UPLOAD_DIR || 'uploads')));
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

// MFA sub-router must be mounted before the auth router so that
// /api/auth/mfa/* is matched before the catch-all /api/auth/* handler.
app.use('/api/auth/mfa', authLimiter, mfaRouter);
app.use('/api/auth', authLimiter, authRouter);
app.use('/api', apiLimiter, usersRouter);
app.use('/api/addresses', apiLimiter, addressesRouter);
app.use('/api/products', apiLimiter, productReviewsRouter);
app.use('/api/products', apiLimiter, productsRouter);
app.use('/api/reviews', apiLimiter, reviewsRouter);
app.use('/api/orders', apiLimiter, ordersRouter);
app.use('/api/admin/products', apiLimiter, adminProductsRouter);
app.use('/api/admin/orders', apiLimiter, adminOrdersRouter);
app.use('/api/admin/reviews', apiLimiter, adminReviewsRouter);
app.use('/api/admin/catalog', apiLimiter, adminCatalogRouter);
app.use('/api/admin/users', apiLimiter, adminUsersRouter);
app.use('/api/admin/analytics', apiLimiter, adminAnalyticsRouter);
app.use('/api/admin/uploads', apiLimiter, adminUploadsRouter);
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

    // Best-effort local-dev sanity check: if DB is empty, storefront will show 0 products.
    // This keeps the stable branch safe by only logging guidance (no mutations).
    void (async () => {
      try {
        // If schema hasn't been initialized yet, model queries will throw (P2021).
        // Detect this cheaply using information_schema before calling model APIs.
        const tables = await prisma.$queryRaw<{ table_name: string }[]>`
          SELECT table_name FROM information_schema.tables 
          WHERE table_schema = current_schema() 
          AND table_name IN ('products', 'users')
        `;
        const tableNames = new Set((tables ?? []).map((t) => t.table_name));
        if (!tableNames.has('products') || !tableNames.has('users')) {
          logger.warn('Database schema not initialized. Run db init.', {
            hint: 'cd src/backend && npm run db:init',
          });
          return;
        }

        const productCount = await prisma.product.count({ where: { isVisible: true, stockQuantity: { gt: 0 } } });
        if (productCount === 0) {
          logger.warn('No visible in-stock products found. Did you run db seed?', {
            hint: 'cd src/backend && npm run db:seed',
          });
        }
      } catch (error) {
        // Keep this non-fatal and non-noisy; log a short message with an action.
        logger.warn('Startup DB check skipped (DB not ready).', {
          hint: 'cd src/backend && npm run db:init',
        });
      }
    })();
  });
}

export default app;
