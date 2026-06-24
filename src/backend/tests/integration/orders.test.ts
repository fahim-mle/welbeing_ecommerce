import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/lib/prisma';

describe('Orders API', () => {
  let productId: number;
  const categoryName = `Test Orders Category ${Date.now()}`;
  const orderIds: number[] = [];
  const addressIds: number[] = [];

  beforeAll(async () => {
    const category = await prisma.category.create({
      data: { name: categoryName, description: 'Orders test category' },
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
    if (orderIds.length > 0) {
      await prisma.orderStatusHistory.deleteMany({ where: { orderId: { in: orderIds } } });
      await prisma.payment.deleteMany({ where: { orderId: { in: orderIds } } });
      await prisma.inventoryLog.deleteMany({ where: { referenceId: { in: orderIds.map(String) } } });
      await prisma.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
      await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
    }

    if (addressIds.length > 0) {
      await prisma.address.deleteMany({ where: { id: { in: addressIds } } });
    }

    await prisma.productImage.deleteMany({ where: { productId } });
    await prisma.product.deleteMany({ where: { id: productId } });
    await prisma.category.deleteMany({ where: { name: categoryName } });
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

    if (response.body.data.id) orderIds.push(response.body.data.id);
    if (response.body.data.addressId) addressIds.push(response.body.data.addressId);
  });

  it('POST /api/orders applies GST for Australian shipping addresses', async () => {
    const response = await request(app).post('/api/orders').send({
      guest_email: 'australia-guest@example.com',
      items: [
        {
          product_id: productId,
          quantity: 2,
        },
      ],
      shipping_address: {
        label: 'Home',
        full_name: 'Australian Guest',
        phone: '1234567890',
        street_line_1: '10 Wellness Street',
        city: 'Brisbane',
        state: 'QLD',
        postal_code: '4000',
        country: 'Australia',
      },
      payment_placeholder: 'test-card',
      disclaimer_accepted: true,
    });

    if (response.body.data.id) orderIds.push(response.body.data.id);
    if (response.body.data.addressId) addressIds.push(response.body.data.addressId);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(Number(response.body.data.taxAmount).toFixed(2)).toBe('2.50');
    expect(Number(response.body.data.totalPrice).toFixed(2)).toBe('27.50');
  });
});
