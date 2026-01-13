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
  });
});
