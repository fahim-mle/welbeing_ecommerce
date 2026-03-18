import { Router } from 'express';
import { cancelOrder, createOrderFromPayload, findOrderById, findOrdersByUserId } from '../services/orderService';
import { authenticate, AuthRequest } from '../middleware/auth';
import { auth, extractAccessToken } from '../lib/auth';
import { logger } from '../lib/logger';
import { emailService } from '../lib/email';
import { validateBody, validateQuery } from '../middleware/validation';
import { createOrderSchema, guestLookupSchema } from '../schemas/orders';
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
  const token = extractAccessToken(req);
  
  // Authenticate first - return 401 if token is missing or invalid
  if (!token) {
    return res.status(401).json({
      success: false,
      error: { message: 'Authentication required', code: 'UNAUTHORIZED' },
    });
  }

  let userId: number;
  try {
    const authPayload = auth.verifyToken(token);
    userId = authPayload.userId;
  } catch {
    return res.status(401).json({
      success: false,
      error: { message: 'Invalid or expired token', code: 'UNAUTHORIZED' },
    });
  }

  if (Number.isNaN(orderId)) {
    return res.status(400).json({
      success: false,
      error: { message: 'Invalid order ID', code: 'INVALID_ORDER_ID' },
    });
  }

  try {
    const order = await findOrderById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: { message: 'Order not found', code: 'NOT_FOUND' },
      });
    }

    if (order.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      });
    }

    return res.json({ success: true, data: order });
  } catch (error) {
    const requestId = (req as AuthRequest & { requestId?: string }).requestId;
    logger.error('Failed to fetch order', { requestId, error, orderId, userId });
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch order', code: 'INTERNAL_SERVER_ERROR' },
    });
  }
});

// POST /api/orders/:id/guest
router.post('/:id/guest', validateBody(guestLookupSchema), async (req, res) => {
  const orderId = Number(req.params.id);
  const guestEmail = String(req.body.guestEmail ?? req.body.guest_email).toLowerCase();

  if (Number.isNaN(orderId)) {
    return res.status(400).json({
      success: false,
      error: { message: 'Invalid order ID', code: 'INVALID_ORDER_ID' },
    });
  }

  try {
    const order = await findOrderById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: { message: 'Order not found', code: 'NOT_FOUND' },
      });
    }

    if (order.userId) {
      return res.status(403).json({
        success: false,
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      });
    }

    if (!order.guestEmail || order.guestEmail.toLowerCase() !== guestEmail) {
      return res.status(403).json({
        success: false,
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      });
    }

    return res.json({ success: true, data: order });
  } catch (error) {
    const requestId = (req as AuthRequest & { requestId?: string }).requestId;
    logger.error('Failed to fetch guest order', { requestId, error, orderId });
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch order', code: 'INTERNAL_SERVER_ERROR' },
    });
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
  const token = extractAccessToken(req);
  let userId: number | undefined;
  
  if (token) {
    try {
      const decoded = auth.verifyToken(token);
      userId = decoded.userId;
    } catch {
      userId = undefined;
    }
  }
  
  const hasAuthToken = !!token;

  logger.info('Creating order', {
    userId,
    hasAuthToken,
    userType: req.body.user_type,
    hasEmail: !!req.body.email,
    hasGuestEmail: !!req.body.guest_email,
  });

  const requiresAuthenticatedUser =
    req.body.user_type === 'USER' || req.body.user_type === 'ADMIN';

  if ((hasAuthToken || requiresAuthenticatedUser) && !userId) {
    const requestId = (req as AuthRequest & { requestId?: string }).requestId;
    logger.warn('Authorization token present but userId not decoded', {
      hasAuthToken,
      requestId,
      userType: req.body.user_type,
    });
    return res.status(401).json({
      success: false,
      error: {
        message: 'Invalid or expired authentication token. Please log in again.',
        code: 'INVALID_TOKEN',
      },
    });
  }

  try {
    const order = await createOrderFromPayload(userId, req.body);
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
});

export default router;
