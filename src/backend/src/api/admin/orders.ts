import { Router, Request, Response } from 'express';
import { adminAuth } from '../../middleware/adminAuth';
import { findAdminOrders, OrderValidationError, updateOrderStatus } from '../../services/orderService';

const router = Router();

// Apply admin auth middleware to all routes
router.use(adminAuth);

// GET /api/admin/orders
router.get('/', async (req: Request, res: Response) => {
  try {
    const orders = await findAdminOrders();
    res.json({ data: orders });
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// PATCH /api/admin/orders/:id/status
router.patch('/:id/status', async (req: Request, res: Response) => {
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
    if (error instanceof OrderValidationError) {
      return res.status(400).json({ message: error.message });
    }
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Failed to update order status' });
  }
});

export default router;
