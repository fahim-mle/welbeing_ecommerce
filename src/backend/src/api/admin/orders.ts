import { Router, Request, Response, NextFunction } from 'express';
import { adminAuth } from '../../middleware/adminAuth';
import { findAdminOrders, updateOrderStatus } from '../../services/orderService';
import { logger } from '../../lib/logger';
import { validateQuery } from '../../middleware/validation';
import { paginationSchema } from '../../schemas/pagination';

const router = Router();

// Apply admin auth middleware to all routes
router.use(adminAuth);

// GET /api/admin/orders
router.get('/', validateQuery(paginationSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = req.query as unknown as { page: number; limit: number };

    const orders = await findAdminOrders({ page, limit });
    res.json({ data: orders, page, limit });
  } catch (error) {
    const requestId = (req as Request & { requestId?: string }).requestId;
    logger.error('Error fetching admin orders', { requestId, error });
    next(error);
  }
});

// PATCH /api/admin/orders/:id/status
router.patch('/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { status } = req.body;
  const orderId = Number(id);

  if (Number.isNaN(orderId)) {
    return res.status(400).json({ message: 'Invalid order ID' });
  }

  try {
    const order = await updateOrderStatus(orderId, status);
    res.json({ data: order });
  } catch (error) {
    const requestId = (req as Request & { requestId?: string }).requestId;
    logger.error('Error updating order status', { requestId, error, orderId });
    next(error);
  }
});

export default router;
