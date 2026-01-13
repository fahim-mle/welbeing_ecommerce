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
