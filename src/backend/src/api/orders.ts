import { Router } from 'express';
import { createGuestOrder, OrderValidationError } from '../services/orderService';

const router = Router();

router.post('/', async (req, res, next) => {
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

    const normalizedItems = items.map((item) => ({
      productId: Number(item.product_id),
      quantity: Number(item.quantity),
    }));

    if (normalizedItems.some((item) => Number.isNaN(item.productId))) {
      res.status(400).json({ success: false, error: 'Each item must include a product_id' });
      return;
    }

    const order = await createGuestOrder({
      guestEmail: String(guestEmail || ''),
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
