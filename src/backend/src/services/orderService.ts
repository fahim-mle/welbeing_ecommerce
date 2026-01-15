import {
  InventoryChangeType,
  OrderPaymentStatus,
  OrderStatus,
  PaymentProvider,
  PaymentStatus,
  Prisma,
} from '@prisma/client';
import { prisma } from '../lib/prisma';
import { BusinessRuleError, ValidationError } from '../types/shared';
import { paymentService } from './paymentService';
import { emailService } from '../lib/email';
import { invalidateProductCaches } from './catalogService';

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
      throw new ValidationError('Item quantity must be a positive integer');
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
  paymentToken: string;
}

export interface OrderRequestItemInput {
  product_id: number | string;
  product_variant_id?: number | string;
  quantity: number | string;
}

export interface OrderRequestPayload {
  guest_email?: string;
  items?: OrderRequestItemInput[];
  shipping_address?: Record<string, any>;
  address_id?: number | string;
  payment_placeholder?: string;
  disclaimer_accepted?: boolean;
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
      throw new ValidationError(`Shipping address ${field} is required`);
    }
  }
};

export const createOrderFromPayload = async (userId: number | undefined, payload: OrderRequestPayload) => {
  const {
    guest_email: guestEmail,
    items,
    shipping_address: shippingAddress,
    address_id: addressId,
    payment_placeholder: paymentPlaceholder,
    disclaimer_accepted: disclaimerAccepted,
  } = payload ?? {};

  if (!paymentPlaceholder) {
    throw new ValidationError('Payment placeholder is required');
  }

  if (!disclaimerAccepted) {
    throw new ValidationError('Health disclaimer must be accepted');
  }

  if (!Array.isArray(items)) {
    throw new ValidationError('Items must be an array');
  }

  const normalizedItems = items.map((item) => ({
    productId: Number(item.product_id),
    productVariantId: item.product_variant_id ? Number(item.product_variant_id) : undefined,
    quantity: Number(item.quantity),
  }));

  if (normalizedItems.some((item) => Number.isNaN(item.productId))) {
    throw new ValidationError('Each item must include a product_id');
  }

  const parsedAddressId = addressId ? Number(addressId) : undefined;
  if (addressId && Number.isNaN(parsedAddressId)) {
    throw new ValidationError('address_id must be a number');
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

  return createOrder({
    userId,
    guestEmail: userId ? undefined : guestEmail ? String(guestEmail) : undefined,
    addressId: parsedAddressId,
    shippingAddress: normalizedAddress,
    items: normalizedItems,
    paymentToken: String(paymentPlaceholder),
  });
};

export const createOrder = async ({
  userId,
  guestEmail,
  addressId,
  shippingAddress,
  items,
  paymentToken,
}: CreateOrderInput) => {
  if (!userId && !guestEmail) {
    throw new ValidationError('User ID or guest email is required');
  }

  if (!addressId && !shippingAddress) {
    throw new ValidationError('Shipping address is required');
  }

  if (shippingAddress) {
    validateShippingAddress(shippingAddress);
  }

  if (!items.length) {
    throw new ValidationError('Order must include at least one item');
  }

  const normalizedItems = normalizeItems(items);
  const productIds = normalizedItems.map((item) => item.productId);

  const result = await prisma.$transaction(async (tx) => {
    const products = await tx.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== productIds.length) {
      throw new ValidationError('One or more products were not found');
    }

    const productMap = new Map(products.map((product) => [product.id, product]));

    for (const item of normalizedItems) {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new ValidationError('One or more products were not found');
      }

      if (product.stockQuantity <= 0) {
        throw new BusinessRuleError(`${product.name} is out of stock`);
      }

      if (product.stockQuantity < item.quantity) {
        throw new BusinessRuleError(
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
        throw new ValidationError('Shipping address was not found');
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
        status: OrderStatus.PENDING,
        paymentStatus: OrderPaymentStatus.PENDING,
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
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    for (const item of normalizedItems) {
      await tx.product.update({
        where: {
          id: item.productId,
          stockQuantity: { gte: item.quantity },
        },
        data: {
          stockQuantity: { decrement: item.quantity },
        },
      });

      if (item.productVariantId) {
        await tx.productVariant.update({
          where: {
            id: item.productVariantId,
            stockQuantity: { gte: item.quantity },
          },
          data: {
            stockQuantity: { decrement: item.quantity },
          },
        });
      }

      await tx.inventoryLog.create({
        data: {
          productId: item.productId,
          productVariantId: item.productVariantId ?? null,
          changeType: InventoryChangeType.ORDER,
          quantityDelta: -item.quantity,
          referenceId: String(order.id),
        },
      });
    }

    const paymentResult = await paymentService.processPayment(totalPrice.toNumber(), paymentToken);
    const paymentVerified = await paymentService.verifyPayment(paymentResult.transactionId);
    const paymentStatus = paymentVerified ? PaymentStatus.SUCCESS : PaymentStatus.FAILED;
    const orderPaymentStatus = paymentVerified ? OrderPaymentStatus.PAID : OrderPaymentStatus.FAILED;
    const orderStatus = paymentVerified ? OrderStatus.PAID : OrderStatus.PENDING;

    await tx.payment.create({
      data: {
        orderId: order.id,
        provider: paymentResult.provider ?? PaymentProvider.MOCK,
        transactionId: paymentResult.transactionId,
        amount: totalPrice,
        currency: order.currency,
        status: paymentStatus,
      },
    });

    const updatedOrder = await tx.order.update({
      where: { id: order.id },
      data: {
        status: orderStatus,
        paymentStatus: orderPaymentStatus,
      },
      include: {
        address: true,
        items: {
          include: {
            product: true,
            productVariant: true,
          },
        },
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    return { order: updatedOrder, paymentVerified };
  });

  if (result.paymentVerified) {
    const recipient = result.order.user?.email ?? result.order.guestEmail;
    if (recipient) {
      await emailService.sendOrderConfirmation(recipient, result.order.id);
    }
  }

  const affectedProductIds = new Set(normalizedItems.map((item) => item.productId));
  for (const productId of affectedProductIds) {
    try {
      await invalidateProductCaches(productId);
    } catch (error) {
      console.error(`Failed to invalidate cache for product ${productId}`, error);
    }
  }

  return result.order;
};

export const findOrdersByUserId = async (userId: number, options?: { page?: number; limit?: number }) => {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 20;
  const skip = (page - 1) * limit;

  return prisma.order.findMany({
    where: { userId },
    skip,
    take: limit,
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

export const findOrderById = async (orderId: number) => {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
      address: true,
      items: {
        include: {
          product: true,
          productVariant: true,
        },
      },
      user: {
        select: {
          email: true,
        },
      },
      statusHistory: {
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });
};

export const cancelOrder = async (orderId: number, userId?: number) => {
  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!order) {
      throw new ValidationError('Order not found');
    }

    if (userId && order.userId !== userId) {
      throw new ValidationError('Order not found');
    }

    const cancellableStatuses: OrderStatus[] = [OrderStatus.PENDING, OrderStatus.PAID];
    if (!cancellableStatuses.includes(order.status)) {
      throw new BusinessRuleError('Order cannot be cancelled');
    }

    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stockQuantity: { increment: item.quantity } },
      });

      if (item.productVariantId) {
        await tx.productVariant.update({
          where: { id: item.productVariantId },
          data: { stockQuantity: { increment: item.quantity } },
        });
      }

      await tx.inventoryLog.create({
        data: {
          productId: item.productId,
          productVariantId: item.productVariantId ?? null,
          changeType: InventoryChangeType.ADJUSTMENT,
          quantityDelta: item.quantity,
          referenceId: String(order.id),
        },
      });
    }

    const updated = await tx.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.CANCELLED,
        paymentStatus: order.paymentStatus === OrderPaymentStatus.PAID ? OrderPaymentStatus.REFUNDED : order.paymentStatus,
      },
      include: {
        items: true,
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        fromStatus: order.status,
        toStatus: OrderStatus.CANCELLED,
        changedBy: userId ? 'USER' : 'SYSTEM',
      },
    });

    return updated;
  });

  const affectedProductIds = new Set(result.items.map((item) => item.productId));
  for (const productId of affectedProductIds) {
    try {
      await invalidateProductCaches(productId);
    } catch (error) {
      console.error(`Failed to invalidate cache for product ${productId}`, error);
    }
  }

  return result;
};

export const findAdminOrders = async (options?: { page?: number; limit?: number }) => {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 20;
  const skip = (page - 1) * limit;

  return prisma.order.findMany({
    skip,
    take: limit,
    include: {
      items: {
        include: {
          product: true,
          productVariant: true,
        },
      },
      user: {
        select: {
          email: true,
          role: true,
        },
      },
      address: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

export const updateOrderStatus = async (orderId: number, status: OrderStatus) => {
  const validStatuses: OrderStatus[] = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
  if (!validStatuses.includes(status)) {
    throw new ValidationError('Invalid status');
  }

  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: { email: true },
        },
      },
    });

    if (!order) {
      throw new ValidationError('Order not found');
    }

    const updated = await tx.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        items: true,
        user: {
          select: { email: true },
        },
      },
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        fromStatus: order.status,
        toStatus: status,
        changedBy: 'ADMIN',
      },
    });

    return updated;
  });

  const recipient = result.user?.email ?? result.guestEmail;
  if (recipient) {
    await emailService.sendOrderStatusUpdate(recipient, result.id, status);
  }

  return result;
};
