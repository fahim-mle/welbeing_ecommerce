import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/lib/prisma';

describe('Orders API', () => {
  let productId: number;
  let orderId: number | null = null;
  let addressId: number | null = null;

  beforeAll(async () => {
    const category = await prisma.category.upsert({
      where: { name: 'Test Orders Category' },
      update: {},
      create: { name: 'Test Orders Category', description: 'Orders test category' },
    });

    const product = await prisma.product.create({
      data: {
        name: 'Order Test Product',
        description: 'Order test description',
        price: 12.5,
        stockQuantity: 10,
        reorderLevel: 0,
        isVisible: true,
        categoryId: category.id,
        images: {
          create: [{ url: 'https://example.com/order-test.jpg', displayOrder: 0 }],
        },
      },
    });

    productId = product.id;
  });

  afterAll(async () => {
    if (orderId) {
      await prisma.orderStatusHistory.deleteMany({ where: { orderId } });
      await prisma.payment.deleteMany({ where: { orderId } });
      await prisma.inventoryLog.deleteMany({ where: { referenceId: String(orderId) } });
      await prisma.orderItem.deleteMany({ where: { orderId } });
      await prisma.order.deleteMany({ where: { id: orderId } });
    }

    if (addressId) {
      await prisma.address.deleteMany({ where: { id: addressId } });
    }

    await prisma.productImage.deleteMany({ where: { productId } });
    await prisma.product.deleteMany({ where: { id: productId } });
    await prisma.category.deleteMany({ where: { name: 'Test Orders Category' } });
  });

  it('POST /api/orders should create a guest order', async () => {
    const orderPayload = {
      guest_email: 'guest@example.com',
      items: [
        {
          product_id: productId,
          quantity: 1,
        },
      ],
      shipping_address: {
        label: 'Home',
        full_name: 'Guest User',
        phone: '1234567890',
        street_line_1: '123 Wellness Way',
        street_line_2: 'Apt 1',
        city: 'Fit City',
        state: 'FC',
        postal_code: '12345',
        country: 'USA'
      },
      payment_placeholder: 'test-card',
      disclaimer_accepted: true,
    };

    const response = await request(app).post('/api/orders').send(orderPayload);
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.guestEmail).toBe(orderPayload.guest_email);
    expect(response.body.data.items.length).toBeGreaterThan(0);

    orderId = response.body.data.id ?? null;
    addressId = response.body.data.addressId ?? null;
  });
});
