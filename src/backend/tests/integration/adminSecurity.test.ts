import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/lib/prisma';
import { auth } from '../../src/lib/auth';

describe('Admin Products API (Secured)', () => {
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    // Clean dependencies first
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.productImage.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.wellbeingTag.deleteMany();
    await prisma.userIdentity.deleteMany();
    await prisma.user.deleteMany();

    // Create Admin User
    const admin = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        role: 'ADMIN',
      },
    });
    adminToken = auth.generateToken({ userId: admin.id, email: admin.email, role: admin.role });

    // Create Normal User
    const user = await prisma.user.create({
      data: {
        email: 'user@test.com',
        role: 'USER',
      },
    });
    userToken = auth.generateToken({ userId: user.id, email: user.email, role: user.role });

    // Seed Category
    await prisma.category.create({
      data: { id: 1, name: 'Test Cat' }
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/admin/products', () => {
    it('should create product when admin', async () => {
      const res = await request(app)
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Admin Product',
          description: 'Desc',
          price: 10,
          categoryId: 1
        });
      
      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Admin Product');
    });

    it('should reject when normal user', async () => {
      const res = await request(app)
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Hacker Product',
          description: 'Desc',
          price: 10,
          categoryId: 1
        });
      
      expect(res.status).toBe(403);
    });

    it('should reject when no token', async () => {
      const res = await request(app)
        .post('/api/admin/products')
        .send({
          name: 'Anon Product',
          description: 'Desc',
          price: 10,
          categoryId: 1
        });
      
      expect(res.status).toBe(401);
    });
  });
});
