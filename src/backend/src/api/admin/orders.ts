import { Router, Request, Response, NextFunction } from 'express';
import { adminAuth } from '../../middleware/adminAuth';
import { findAdminOrders, updateOrderStatus } from '../../services/orderService';

const router = Router();

// Apply admin auth middleware to all routes
router.use(adminAuth);

// GET /api/admin/orders
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orders = await findAdminOrders();
    res.json({ data: orders });
  } catch (error) {
    console.error('Error fetching admin orders:', error);
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
    console.error('Error updating order status:', error);
    next(error);
  }
});

export default router;
