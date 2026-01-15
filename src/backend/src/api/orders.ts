import { Router } from 'express';
import { cancelOrder, createOrderFromPayload, findOrderById, findOrdersByUserId } from '../services/orderService';
import { authenticate, AuthRequest } from '../middleware/auth';
import { auth } from '../lib/auth';
import { logger } from '../lib/logger';
import { emailService } from '../lib/email';
import { validateBody, validateQuery } from '../middleware/validation';
import { createOrderSchema } from '../schemas/orders';
import { paginationSchema } from '../schemas/pagination';

const router = Router();

// POST /api/orders
// Address handling:
// - Authenticated users: Provide address_id (existing saved address)
// - Guest users: Provide shipping_address object (creates new address record)
// - Either address_id OR shipping_address is required

// GET /api/orders (My Orders)
router.get('/', authenticate, validateQuery(paginationSchema), async (req, res) => {
    const userId = (req as AuthRequest).user?.userId;
    if (!userId) {
        // Should be caught by middleware, but for safety
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const { page, limit } = req.query as unknown as { page: number; limit: number };

        const orders = await findOrdersByUserId(userId, { page, limit });
        res.json({ data: orders, page, limit });
    } catch (error) {
        const requestId = (req as AuthRequest & { requestId?: string }).requestId;
        logger.error('Failed to fetch orders', { requestId, error, userId });
        res.status(500).json({ message: 'Failed to fetch orders' });
    }
});

// GET /api/orders/:id
router.get('/:id', async (req, res) => {
  const orderId = Number(req.params.id);
  const authPayload = auth.decodeAuthorizationHeader(req.headers.authorization);
  const userId = authPayload?.userId;
  const guestEmail = req.query.guestEmail ? String(req.query.guestEmail).toLowerCase() : undefined;

  if (Number.isNaN(orderId)) {
    return res.status(400).json({ message: 'Invalid order ID' });
  }

  try {
    const order = await findOrderById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.userId) {
      if (!userId || order.userId !== userId) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
    } else {
      if (!guestEmail || order.guestEmail?.toLowerCase() !== guestEmail) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
    }

    res.json({ data: order });
  } catch (error) {
    const requestId = (req as AuthRequest & { requestId?: string }).requestId;
    logger.error('Failed to fetch order', { requestId, error, orderId, userId });
    res.status(500).json({ message: 'Failed to fetch order' });
  }
});

// POST /api/orders/:id/cancel
router.post('/:id/cancel', authenticate, async (req, res) => {
  const userId = (req as AuthRequest).user?.userId;
  const orderId = Number(req.params.id);

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (Number.isNaN(orderId)) {
    return res.status(400).json({ message: 'Invalid order ID' });
  }

  try {
    const order = await cancelOrder(orderId, userId);
    const recipient = order.user?.email ?? order.guestEmail;
    if (recipient) {
      await emailService.sendOrderStatusUpdate(recipient, order.id, order.status);
    }

    res.json({ data: order });
  } catch (error) {
    const requestId = (req as AuthRequest & { requestId?: string }).requestId;
    logger.error('Failed to cancel order', { requestId, error, orderId, userId });
    res.status(500).json({ message: 'Failed to cancel order' });
  }
});

router.post('/', validateBody(createOrderSchema), async (req, res, next) => {
  const decoded = auth.decodeAuthorizationHeader(req.headers.authorization);
  const userId = decoded?.userId;

  try {
    const order = await createOrderFromPayload(userId, req.body);
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
});

export default router;
