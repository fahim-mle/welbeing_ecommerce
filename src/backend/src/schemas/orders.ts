import { z } from 'zod';

export const orderItemSchema = z.object({
  product_id: z.union([z.number(), z.string()]),
  product_variant_id: z.union([z.number(), z.string()]).optional(),
  quantity: z.union([z.number(), z.string()]),
});

export const shippingAddressSchema = z
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

export const createOrderSchema = z
  .object({
    // Unified email field — used for order confirmation and guest order lookup.
    // For guest checkouts this becomes the guestEmail on the order record.
    email: z.string().email().optional(),
    // Indicates who is placing the order so the backend can handle the email
    // correctly alongside the JWT userId (if present).
    user_type: z.enum(['USER', 'GUEST', 'ADMIN']).optional(),
    // Legacy field kept for backward compatibility — prefer `email` + `user_type`.
    guest_email: z.string().email().optional(),
    items: z.array(orderItemSchema),
    // Use a loose record so Zod 4's ZodEffects+optional() chain doesn't silently
    // drop the field when inner refines on shippingAddressSchema fail.
    // The service's validateShippingAddress() handles field-level validation.
    shipping_address: z.record(z.string(), z.unknown()).optional(),
    address_id: z.union([z.number(), z.string()]).optional(),
    payment_placeholder: z.string().min(1, 'payment_placeholder is required'),
    disclaimer_accepted: z.boolean(),
  })
  .refine((data) => data.address_id || data.shipping_address, {
    message: 'Either address_id or shipping_address is required',
  });

export const guestLookupSchema = z
  .object({
    guestEmail: z.string().email().optional(),
    guest_email: z.string().email().optional(),
  })
  .refine((data) => data.email || data.guest_email, {
    message: 'guestEmail is required',
  });
