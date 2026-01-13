import { z } from 'zod';

export const addressSchema = z.object({
  label: z.string().min(1, 'label is required'),
  fullName: z.string().min(1, 'fullName is required'),
  phone: z.string().min(1, 'phone is required'),
  streetLine1: z.string().min(1, 'streetLine1 is required'),
  streetLine2: z.string().optional().nullable(),
  city: z.string().min(1, 'city is required'),
  state: z.string().min(1, 'state is required'),
  postalCode: z.string().min(1, 'postalCode is required'),
  country: z.string().min(1, 'country is required'),
  isDefault: z.boolean().optional(),
});

export const updateAddressSchema = addressSchema.partial();
