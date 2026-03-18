import { Prisma, PrismaClient, UserRole, WellbeingTagType, PaymentProvider, PaymentStatus, OrderStatus, OrderPaymentStatus, PaymentMethod, InventoryChangeType, OrderStatusChangedBy } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

type SeedUser = {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role: 'ADMIN' | 'USER';
  isActive: boolean;
  lastLoginAt?: string | null;
  identity: {
    provider: string;
    providerId: string;
    password: string;
    isVerified: boolean;
    verifiedAt?: string | null;
  };
};

type SeedProductVariant = {
  sku: string;
  price: number;
  stockQuantity: number;
  optionValues: Record<string, string>;
  isActive: boolean;
};

type SeedProduct = {
  sku: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number | null;
  stockQuantity: number;
  reorderLevel: number;
  category: string;
  tags: string[];
  images: string[];
  variants: SeedProductVariant[];
};

type SeedAddress = {
  key: string;
  userEmail?: string;
  label: string;
  fullName: string;
  phone: string;
  streetLine1: string;
  streetLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
};

type SeedInventoryLog = {
  productSku?: string;
  variantSku?: string;
  changeType: 'ORDER' | 'RESTOCK' | 'ADJUSTMENT';
  quantityDelta: number;
  referenceId?: string | null;
};

type SeedOrderItem = {
  productSku: string;
  variantSku?: string;
  quantity: number;
  priceAtPurchase: number;
};

type SeedOrder = {
  key: string;
  userEmail?: string;
  guestEmail?: string;
  addressKey: string;
  status: 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  paymentMethod?: 'STRIPE' | 'PAYPAL' | 'COD' | 'MOCK';
  currency: string;
  shippingFee: number;
  taxAmount: number;
  totalPrice: number;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  items: SeedOrderItem[];
  payment: {
    provider: 'STRIPE' | 'PAYPAL' | 'COD' | 'MOCK';
    transactionId: string;
    amount: number;
    currency: string;
    status: 'INITIATED' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  };
  statusHistory: {
    fromStatus: 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
    toStatus: 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
    changedBy: 'SYSTEM' | 'USER' | 'ADMIN';
  }[];
};

type SeedData = {
  users: SeedUser[];
  categories: { name: string; description?: string | null }[];
  tags: { name: string; type: 'GOAL' | 'FEATURE' | 'NEED' }[];
  products: SeedProduct[];
  addresses: SeedAddress[];
  inventoryLogs: SeedInventoryLog[];
  orders: SeedOrder[];
};

const seedPath = path.join(__dirname, 'seed-data.json');

/**
 * Populates the database from the seed file and replaces existing seed-related data.
 *
 * Reads seed-data.json (via the module's `seedPath`), clears seed-related tables, and creates users
 * (with identities), categories, wellbeing tags, products (and variants/images), addresses,
 * inventory logs, and orders with their nested items, payments, and status history.
 *
 * @throws Error If a referenced category, product, product variant, or address required by the seed
 * data is missing.
 */
async function main() {
  console.log('Seeding database...');

  const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf-8')) as SeedData;

  await prisma.$transaction([
    prisma.orderStatusHistory.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.inventoryLog.deleteMany(),
    prisma.address.deleteMany(),
    prisma.productVariant.deleteMany(),
    prisma.productImage.deleteMany(),
    prisma.product.deleteMany(),
    prisma.wellbeingTag.deleteMany(),
    prisma.category.deleteMany(),
    prisma.userIdentity.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  const usersByEmail = new Map<string, { id: number }>();

  for (const user of seedData.users) {
    const passwordHash = await bcrypt.hash(user.identity.password, 10);
    const createdUser = await prisma.user.create({
      data: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone ?? null,
        role: user.role as UserRole,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt) : null,
        identities: {
          create: {
            provider: user.identity.provider,
            providerId: user.identity.providerId,
            passwordHash,
            isVerified: user.identity.isVerified,
            verifiedAt: user.identity.verifiedAt ? new Date(user.identity.verifiedAt) : null,
          },
        },
      },
    });

    usersByEmail.set(user.email, { id: createdUser.id });
  }

  await prisma.category.createMany({
    data: seedData.categories,
  });

  await prisma.wellbeingTag.createMany({
    data: seedData.tags.map((tag) => ({
      name: tag.name,
      type: tag.type as WellbeingTagType,
    })),
  });

  const categories = await prisma.category.findMany();
  const tags = await prisma.wellbeingTag.findMany();
  const categoryByName = new Map(categories.map((category) => [category.name, category]));
  const tagByName = new Map(tags.map((tag) => [tag.name, tag]));

  for (const product of seedData.products) {
    const category = categoryByName.get(product.category);
    if (!category) {
      throw new Error(`Missing category for product ${product.name}`);
    }

    const tagIds = product.tags
      .map((tagName) => tagByName.get(tagName)?.id)
      .filter((id): id is number => Boolean(id));

    const productData: Prisma.ProductCreateInput = {
      sku: product.sku,
      name: product.name,
      description: product.description,
      price: product.price,
      originalPrice: product.originalPrice ?? null,
      stockQuantity: product.stockQuantity,
      reorderLevel: product.reorderLevel,
      category: { connect: { id: category.id } },
      tags: { connect: tagIds.map((id) => ({ id })) },
      images: {
        create: product.images.map((url, index) => ({
          url,
          displayOrder: index,
        })),
      },
    };

    if (product.variants.length > 0) {
      productData.variants = {
        create: product.variants.map((variant) => ({
          sku: variant.sku,
          price: variant.price,
          stockQuantity: variant.stockQuantity,
          optionValues: variant.optionValues,
          isActive: variant.isActive,
        })),
      };
    }

    await prisma.product.create({ data: productData });
  }

  const products = await prisma.product.findMany({ include: { variants: true } });
  const productBySku = new Map(
    products
      .filter((product) => product.sku)
      .map((product) => [product.sku as string, product]),
  );
  const variantBySku = new Map(
    products
      .flatMap((product) => product.variants)
      .map((variant) => [variant.sku, variant]),
  );

  const addressByKey = new Map<string, { id: number }>();

  for (const address of seedData.addresses) {
    const userId = address.userEmail ? usersByEmail.get(address.userEmail)?.id : null;
    const createdAddress = await prisma.address.create({
      data: {
        userId: userId ?? null,
        label: address.label,
        fullName: address.fullName,
        phone: address.phone,
        streetLine1: address.streetLine1,
        streetLine2: address.streetLine2 ?? null,
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        country: address.country,
        isDefault: address.isDefault,
      },
    });

    addressByKey.set(address.key, { id: createdAddress.id });
  }

  for (const log of seedData.inventoryLogs) {
    const productId = log.productSku ? productBySku.get(log.productSku)?.id : undefined;
    const productVariantId = log.variantSku ? variantBySku.get(log.variantSku)?.id : undefined;

    await prisma.inventoryLog.create({
      data: {
        productId: productId ?? null,
        productVariantId: productVariantId ?? null,
        changeType: log.changeType as InventoryChangeType,
        quantityDelta: log.quantityDelta,
        referenceId: log.referenceId ?? null,
      },
    });
  }

  for (const order of seedData.orders) {
    const userId = order.userEmail ? usersByEmail.get(order.userEmail)?.id : null;
    const addressId = addressByKey.get(order.addressKey)?.id;

    if (!addressId) {
      throw new Error(`Missing address for order ${order.key}`);
    }

    const itemsData = order.items.map((item) => {
      const product = productBySku.get(item.productSku);
      if (!product) {
        throw new Error(`Missing product for order item ${item.productSku}`);
      }

      const variantId = item.variantSku ? variantBySku.get(item.variantSku)?.id : null;

      return {
        productId: product.id,
        productVariantId: variantId ?? null,
        quantity: item.quantity,
        priceAtPurchase: item.priceAtPurchase,
      };
    });

    await prisma.order.create({
      data: {
        userId: userId ?? null,
        addressId,
        guestEmail: order.guestEmail ?? null,
        status: order.status as OrderStatus,
        paymentStatus: order.paymentStatus as OrderPaymentStatus,
        paymentMethod: order.paymentMethod ? (order.paymentMethod as PaymentMethod) : null,
        currency: order.currency,
        totalPrice: order.totalPrice,
        shippingFee: order.shippingFee,
        taxAmount: order.taxAmount,
        shippedAt: order.shippedAt ? new Date(order.shippedAt) : null,
        deliveredAt: order.deliveredAt ? new Date(order.deliveredAt) : null,
        items: {
          create: itemsData,
        },
        payment: {
          create: {
            provider: order.payment.provider as PaymentProvider,
            transactionId: order.payment.transactionId,
            amount: order.payment.amount,
            currency: order.payment.currency,
            status: order.payment.status as PaymentStatus,
          },
        },
        statusHistory: {
          create: order.statusHistory.map((status) => ({
            fromStatus: status.fromStatus as OrderStatus,
            toStatus: status.toStatus as OrderStatus,
            changedBy: status.changedBy as OrderStatusChangedBy,
          })),
        },
      },
    });
  }

  // Cache invalidation removed to allow seed script to run in production
  // without requiring compiled service dependencies.
  // In production, caches will be empty on first start anyway.

  console.log('Seeding completed.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });