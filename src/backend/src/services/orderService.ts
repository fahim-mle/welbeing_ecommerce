import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

export class OrderValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OrderValidationError';
  }
}

export interface OrderItemInput {
  productId: number;
  productVariantId?: number;
  quantity: number;
}

export interface ShippingAddressInput {
  label: string;
  fullName: string;
  phone: string;
  streetLine1: string;
  streetLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

const normalizeItems = (items: OrderItemInput[]) => {
  const itemMap = new Map<string, { productId: number; productVariantId?: number; quantity: number }>();

  items.forEach((item) => {
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new OrderValidationError('Item quantity must be a positive integer');
    }
    const key = `${item.productId}:${item.productVariantId ?? 'base'}`;
    const current = itemMap.get(key);
    itemMap.set(key, {
      productId: item.productId,
      productVariantId: item.productVariantId,
      quantity: (current?.quantity ?? 0) + item.quantity,
    });
  });

  return Array.from(itemMap.values());
};

export interface CreateOrderInput {
  userId?: number;
  guestEmail?: string;
  addressId?: number;
  shippingAddress?: ShippingAddressInput;
  items: OrderItemInput[];
}

const validateShippingAddress = (shippingAddress: ShippingAddressInput) => {
  const requiredFields: Array<keyof ShippingAddressInput> = [
    'label',
    'fullName',
    'phone',
    'streetLine1',
    'city',
    'state',
    'postalCode',
    'country',
  ];

  for (const field of requiredFields) {
    const value = shippingAddress[field];
    if (!value || String(value).trim().length === 0) {
      throw new OrderValidationError(`Shipping address ${field} is required`);
    }
  }
};

export const createOrder = async ({
  userId,
  guestEmail,
  addressId,
  shippingAddress,
  items,
}: CreateOrderInput) => {
  if (!userId && !guestEmail) {
    throw new OrderValidationError('User ID or guest email is required');
  }

  if (!addressId && !shippingAddress) {
    throw new OrderValidationError('Shipping address is required');
  }

  if (shippingAddress) {
    validateShippingAddress(shippingAddress);
  }

  if (!items.length) {
    throw new OrderValidationError('Order must include at least one item');
  }

  const normalizedItems = normalizeItems(items);
  const productIds = normalizedItems.map((item) => item.productId);

  return prisma.$transaction(async (tx) => {
    const products = await tx.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== productIds.length) {
      throw new OrderValidationError('One or more products were not found');
    }

    const productMap = new Map(products.map((product) => [product.id, product]));

    for (const item of normalizedItems) {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new OrderValidationError('One or more products were not found');
      }

      if (product.stockQuantity <= 0) {
        throw new OrderValidationError(`${product.name} is out of stock`);
      }

      if (product.stockQuantity < item.quantity) {
        throw new OrderValidationError(
          `${product.name} only has ${product.stockQuantity} in stock (requested: ${item.quantity})`
        );
      }
    }

    const totalPrice = normalizedItems.reduce((total, item) => {
      const product = productMap.get(item.productId);
      if (!product) {
        return total;
      }
      return total.plus(product.price.mul(item.quantity));
    }, new Prisma.Decimal(0));

    let resolvedAddressId = addressId;

    if (resolvedAddressId) {
      const existingAddress = await tx.address.findUnique({
        where: { id: resolvedAddressId },
      });
      if (!existingAddress) {
        throw new OrderValidationError('Shipping address was not found');
      }
    }

    if (!resolvedAddressId && shippingAddress) {
      const createdAddress = await tx.address.create({
        data: {
          userId: userId ?? null,
          label: shippingAddress.label,
          fullName: shippingAddress.fullName,
          phone: shippingAddress.phone,
          streetLine1: shippingAddress.streetLine1,
          streetLine2: shippingAddress.streetLine2 ?? null,
          city: shippingAddress.city,
          state: shippingAddress.state,
          postalCode: shippingAddress.postalCode,
          country: shippingAddress.country,
          isDefault: shippingAddress.isDefault ?? false,
        },
      });
      resolvedAddressId = createdAddress.id;
    }

    const order = await tx.order.create({
      data: {
        userId,
        guestEmail,
        addressId: resolvedAddressId,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        totalPrice,
        items: {
          create: normalizedItems.map((item) => ({
            productId: item.productId,
            productVariantId: item.productVariantId,
            quantity: item.quantity,
            priceAtPurchase: productMap.get(item.productId)!.price,
          })),
        },
      },
      include: {
        address: true,
        items: {
          include: {
            product: true,
            productVariant: true,
          },
        },
      },
    });

    for (const item of normalizedItems) {
      const product = productMap.get(item.productId)!;
      await tx.product.update({
        where: {
          id: item.productId,
          stockQuantity: { gte: item.quantity },
        },
        data: {
          stockQuantity: { decrement: item.quantity },
        },
      });
    }

    return order;
  });
};

export const findOrdersByUserId = async (userId: number) => {
  return prisma.order.findMany({
    where: { userId },
    include: {
      address: true,
      items: {
        include: {
          product: true,
          productVariant: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};
