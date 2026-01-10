import { Router } from 'express';
import { createOrder, findOrdersByUserId, OrderValidationError } from '../services/orderService';
import { authenticate, AuthRequest } from '../middleware/auth';
import { auth } from '../lib/auth';

const router = Router();

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
    const {
      guest_email: guestEmail,
      items,
      shipping_address: shippingAddress,
      payment_placeholder: paymentPlaceholder,
      disclaimer_accepted: disclaimerAccepted,
    } = req.body ?? {};

    if (!paymentPlaceholder) {
      res.status(400).json({ success: false, error: 'Payment placeholder is required' });
      return;
    }

    if (!disclaimerAccepted) {
      res.status(400).json({ success: false, error: 'Health disclaimer must be accepted' });
      return;
    }

    if (!Array.isArray(items)) {
      res.status(400).json({ success: false, error: 'Items must be an array' });
      return;
    }

    const normalizedItems = items.map((item: any) => ({
      productId: Number(item.product_id),
      quantity: Number(item.quantity),
    }));

    if (normalizedItems.some((item: any) => Number.isNaN(item.productId))) {
      res.status(400).json({ success: false, error: 'Each item must include a product_id' });
      return;
    }

    const order = await createOrder({
      userId,
      guestEmail: userId ? undefined : String(guestEmail || ''),
      shippingAddress: String(shippingAddress || ''),
      items: normalizedItems,
    });

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
