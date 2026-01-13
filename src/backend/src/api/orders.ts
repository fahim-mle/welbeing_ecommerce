import { Router } from 'express';
import { z } from 'zod';
import { createOrderFromPayload, findOrdersByUserId } from '../services/orderService';
import { authenticate, AuthRequest } from '../middleware/auth';
import { auth } from '../lib/auth';
import { ValidationError } from '../types/shared';
import { logger } from '../lib/logger';

const router = Router();

const orderItemSchema = z.object({
  product_id: z.union([z.number(), z.string()]),
  product_variant_id: z.union([z.number(), z.string()]).optional(),
  quantity: z.union([z.number(), z.string()]),
});

const shippingAddressSchema = z
  .object({
    label: z.string().min(1, 'shipping_address.label is required'),
    full_name: z.string().min(1).optional(),
    fullName: z.string().min(1).optional(),
    phone: z.string().min(1, 'shipping_address.phone is required'),
    street_line_1: z.string().min(1).optional(),
    streetLine1: z.string().min(1).optional(),
    street_line_2: z.string().optional().nullable(),
    streetLine2: z.string().optional().nullable(),
    city: z.string().min(1, 'shipping_address.city is required'),
    state: z.string().min(1, 'shipping_address.state is required'),
    postal_code: z.string().min(1).optional(),
    postalCode: z.string().min(1).optional(),
    country: z.string().min(1, 'shipping_address.country is required'),
    is_default: z.boolean().optional(),
    isDefault: z.boolean().optional(),
  })
  .refine((data) => data.full_name || data.fullName, {
    message: 'shipping_address.full_name is required',
  })
  .refine((data) => data.street_line_1 || data.streetLine1, {
    message: 'shipping_address.street_line_1 is required',
  })
  .refine((data) => data.postal_code || data.postalCode, {
    message: 'shipping_address.postal_code is required',
  });

const createOrderSchema = z
  .object({
    guest_email: z.string().email().optional(),
    items: z.array(orderItemSchema),
    shipping_address: shippingAddressSchema.optional(),
    address_id: z.union([z.number(), z.string()]).optional(),
    payment_placeholder: z.string().min(1, 'payment_placeholder is required'),
    disclaimer_accepted: z.boolean(),
  })
  .refine((data) => data.address_id || data.shipping_address, {
    message: 'Either address_id or shipping_address is required',
  });

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
        const page = req.query.page ? Number(req.query.page) : 1;
        const limit = req.query.limit ? Number(req.query.limit) : 20;

        if (!Number.isInteger(page) || page <= 0) {
            return res.status(400).json({ message: 'page must be a positive integer' });
        }

        if (!Number.isInteger(limit) || limit <= 0) {
            return res.status(400).json({ message: 'limit must be a positive integer' });
        }

        const orders = await findOrdersByUserId(userId, { page, limit });
        res.json({ data: orders, page, limit });
    } catch (error) {
        const requestId = (req as AuthRequest & { requestId?: string }).requestId;
        logger.error('Failed to fetch orders', { requestId, error, userId });
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
    const parsed = createOrderSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      const message = parsed.error.errors.map((err) => err.message).join('; ');
      throw new ValidationError(message || 'Invalid order payload');
    }

    const order = await createOrderFromPayload(userId, parsed.data);
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
});

export default router;
