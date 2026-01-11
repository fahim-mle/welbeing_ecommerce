import { Router } from 'express';
import { createOrder, findOrdersByUserId, OrderValidationError, ShippingAddressInput } from '../services/orderService';
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
      address_id: addressId,
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
      productVariantId: item.product_variant_id ? Number(item.product_variant_id) : undefined,
      quantity: Number(item.quantity),
    }));

    if (normalizedItems.some((item: any) => Number.isNaN(item.productId))) {
      res.status(400).json({ success: false, error: 'Each item must include a product_id' });
      return;
    }

    const parsedAddressId = addressId ? Number(addressId) : undefined;
    if (addressId && Number.isNaN(parsedAddressId)) {
      res.status(400).json({ success: false, error: 'address_id must be a number' });
      return;
    }

    let normalizedAddress: ShippingAddressInput | undefined;
    if (shippingAddress) {
      const source = shippingAddress as Record<string, any>;
      normalizedAddress = {
        label: String(source.label ?? 'Shipping'),
        fullName: String(source.full_name ?? source.fullName ?? ''),
        phone: String(source.phone ?? ''),
        streetLine1: String(source.street_line_1 ?? source.streetLine1 ?? ''),
        streetLine2: source.street_line_2 ?? source.streetLine2 ?? null,
        city: String(source.city ?? ''),
        state: String(source.state ?? ''),
        postalCode: String(source.postal_code ?? source.postalCode ?? ''),
        country: String(source.country ?? ''),
        isDefault: Boolean(source.is_default ?? source.isDefault ?? false),
      };
    }

    const order = await createOrder({
      userId,
      guestEmail: userId ? undefined : String(guestEmail || ''),
      addressId: parsedAddressId,
      shippingAddress: normalizedAddress,
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
