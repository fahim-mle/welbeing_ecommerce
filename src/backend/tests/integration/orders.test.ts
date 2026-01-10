import request from 'supertest';
import app from '../../src/app';

describe('Orders API', () => {
  it('POST /api/orders should create a guest order', async () => {
    const productsResponse = await request(app).get('/api/products');
    expect(productsResponse.status).toBe(200);
    const product = productsResponse.body.data[0];

    const orderPayload = {
      guest_email: 'guest@example.com',
      items: [
        {
          product_id: product.id,
          quantity: 1,
        },
      ],
      shipping_address: '123 Wellness Way, Fit City, FC 12345',
      payment_placeholder: 'test-card',
      disclaimer_accepted: true,
    };

    const response = await request(app).post('/api/orders').send(orderPayload);
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.guestEmail).toBe(orderPayload.guest_email);
    expect(response.body.data.items.length).toBeGreaterThan(0);
  });
});
