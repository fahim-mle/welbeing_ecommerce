import cors from 'cors';
import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import metadataRouter from './api/metadata';
import ordersRouter from './api/orders';
import productsRouter from './api/products';
import adminProductsRouter from './api/admin/products';
import adminOrdersRouter from './api/admin/orders';
import authRouter from './api/auth';
import { setupSwagger } from './swagger';
import { AppError } from './types/shared';

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

setupSwagger(app);

app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/admin/products', adminProductsRouter);
app.use('/api/admin/orders', adminOrdersRouter);
app.use('/api', metadataRouter); // /api/categories, /api/tags

app.get('/', (req, res) => {
  res.json({ message: 'Health and Wellbeing Store API' });
});

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ message: 'Not Found' });
});

// Global Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }

  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;
