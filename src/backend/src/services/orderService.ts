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
  quantity: number;
}

interface CreateGuestOrderInput {
  guestEmail: string;
  shippingAddress: string;
  items: OrderItemInput[];
}

const normalizeItems = (items: OrderItemInput[]) => {
  const itemMap = new Map<number, number>();

  items.forEach((item) => {
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new OrderValidationError('Item quantity must be a positive integer');
    }
    const current = itemMap.get(item.productId) ?? 0;
    itemMap.set(item.productId, current + item.quantity);
  });

  return Array.from(itemMap.entries()).map(([productId, quantity]) => ({
    productId,
    quantity,
  }));
};

export interface CreateOrderInput {
  userId?: number;
  guestEmail?: string;
  shippingAddress: string;
  items: OrderItemInput[];
}

export const createOrder = async ({
  userId,
  guestEmail,
  shippingAddress,
  items,
}: CreateOrderInput) => {
  if (!userId && !guestEmail) {
    throw new OrderValidationError('User ID or guest email is required');
  }

  if (!shippingAddress) {
    throw new OrderValidationError('Shipping address is required');
  }

  if (!items.length) {
    throw new OrderValidationError('Order must include at least one item');
  }

  const normalizedItems = normalizeItems(items);
  const productIds = normalizedItems.map((item) => item.productId);

  const products = await prisma.product.findMany({
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
    if (product.stockStatus !== 'IN_STOCK') {
      throw new OrderValidationError(`${product.name} is out of stock`);
    }
  }

  const totalPrice = normalizedItems.reduce((total, item) => {
    const product = productMap.get(item.productId);
    if (!product) {
      return total;
    }
    return total.plus(product.price.mul(item.quantity));
  }, new Prisma.Decimal(0));

  return prisma.order.create({
    data: {
      userId,
      guestEmail,
      shippingAddress,
      status: 'PAID',
      totalPrice,
      items: {
        create: normalizedItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          priceAtPurchase: productMap.get(item.productId)!.price,
        })),
      },
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });
};

export const findOrdersByUserId = async (userId: number) => {
  return prisma.order.findMany({
    where: { userId },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};
