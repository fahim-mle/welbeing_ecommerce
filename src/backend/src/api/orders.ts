import { Router } from 'express';
import { createOrderFromPayload, findOrdersByUserId, OrderValidationError } from '../services/orderService';
import { authenticate, AuthRequest } from '../middleware/auth';
import { auth } from '../lib/auth';

const router = Router();

// POST /api/orders
// Address handling:
// - Authenticated users: Provide address_id (existing saved address)
// - Guest users: Provide shipping_address object (creates new address record)
// - Either address_id OR shipping_address is required

// GET /api/orders (My Orders)
router.get('/', authenticate, async (req, res) => {
    const userId = (req as AuthRequest).user?.userId;
    if (!userId) {
        // Should be caught by middleware, but for safety
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const orders = await findOrdersByUserId(userId);
        res.json({ data: orders });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch orders' });
    }
});

router.post('/', async (req, res, next) => {
  let userId: number | undefined;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
          const decoded = auth.verifyToken(authHeader.split(' ')[1]) as any;
          userId = decoded.userId;
      } catch (e) {
          // Token invalid, proceed as guest
      }
  }

  try {
    const order = await createOrderFromPayload(userId, req.body ?? {});
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    if (error instanceof OrderValidationError) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }
    next(error);
  }
});

export default router;
