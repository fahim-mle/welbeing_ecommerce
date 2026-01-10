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

    const order = await tx.order.create({
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

    for (const item of normalizedItems) {
      const product = productMap.get(item.productId)!;
      const result = await tx.product.updateMany({
        where: {
          id: item.productId,
          updatedAt: product.updatedAt,
          stockQuantity: { gte: item.quantity },
        },
        data: {
          stockQuantity: { decrement: item.quantity },
        },
      });

      if (result.count === 0) {
        throw new OrderValidationError(
          `Product "${product.name}" was modified by another transaction. Please try again.`
        );
      }
    }

    return order;
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
