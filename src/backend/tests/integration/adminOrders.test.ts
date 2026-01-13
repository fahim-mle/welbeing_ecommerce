import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/lib/prisma';
import { auth } from '../../src/lib/auth';

describe('Admin Orders API', () => {
  let adminToken: string;
  let orderId: number;

  beforeAll(async () => {
    // Ensure admin user exists
    let admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!admin) {
        // Create basic admin if not seeded
        admin = await prisma.user.create({ data: { email: 'admin_test_orders@test.com', firstName: 'Admin', lastName: 'User', role: 'ADMIN' } });
    }
    
    // Generate valid admin token
    adminToken = auth.generateToken({ 
        userId: admin.id, 
        email: admin.email, 
        role: admin.role 
    });

    // Create a dummy order for testing
    const product = await prisma.product.create({
        data: { name: 'Order Test Product ' + Date.now(), description: 'Desc', price: 50, stockQuantity: 10, category: { create: { name: 'OrderTestCat ' + Date.now() } } }
    });

    const order = await prisma.order.create({
        data: {
            guestEmail: 'test@customer.com',
            address: {
                create: {
                    label: 'Test Address',
                    fullName: 'Test Customer',
                    phone: '1234567890',
                    streetLine1: '123 Test St',
                    city: 'Test City',
                    state: 'TS',
                    postalCode: '12345',
                    country: 'USA'
                }
            },
            totalPrice: 50,
            status: 'PAID',
            items: {
                create: {
                    productId: product.id,
                    quantity: 1,
                    priceAtPurchase: 50
                }
            }
        }
    });
    orderId = order.id;
  });

  afterAll(async () => {
      // Cleanup happens via seeds usually, but we can leave it for now
      await prisma.$disconnect();
  });

  describe('GET /api/admin/orders', () => {
    it('should list orders for admin', async () => {
      const res = await request(app)
        .get('/api/admin/orders')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0]).toHaveProperty('totalPrice');
    });

    it('should deny non-admin', async () => {
      const res = await request(app)
        .get('/api/admin/orders'); // No token
      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /api/admin/orders/:id/status', () => {
    it('should update order status', async () => {
      const res = await request(app)
        .patch(`/api/admin/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'SHIPPED' });
      
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('SHIPPED');
    });

    it('should reject invalid status', async () => {
      const res = await request(app)
        .patch(`/api/admin/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'INVALID_STATUS' });
      
      expect(res.status).toBe(400);
    });
  });
});
