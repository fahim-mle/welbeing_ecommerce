import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/lib/prisma';
import { auth } from '../../src/lib/auth';

describe('Admin Product API', () => {
  let categoryId: number;
  let tagId: number;
  let adminToken: string;

  beforeAll(async () => {
    // Cleanup first
    await prisma.userIdentity.deleteMany({ where: { user: { email: 'admin_test_products@test.com' } } });
    await prisma.user.deleteMany({ where: { email: 'admin_test_products@test.com' } });

    // Create Admin User
    const admin = await prisma.user.create({
        data: { email: 'admin_test_products@test.com', firstName: 'Admin', lastName: 'User', role: 'ADMIN' }
    });
    adminToken = auth.generateToken({ userId: admin.id, email: admin.email, role: admin.role });

    // Ensure we have a category and tag
    const category = await prisma.category.findFirst();
    if (category) {
      categoryId = category.id;
    } else {
      const newCat = await prisma.category.create({
        data: { name: 'Admin Test Category', description: 'Test' }
      });
      categoryId = newCat.id;
    }

    const tag = await prisma.wellbeingTag.findFirst();
    if (tag) {
      tagId = tag.id;
    } else {
      const newTag = await prisma.wellbeingTag.create({
        data: { name: 'Admin Test Tag', type: 'GOAL' }
      });
      tagId = newTag.id;
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // Helper to cleanup products created during tests
  const createdProductIds: number[] = [];
  
  // Use a separate tracking for cleanup to avoid conflicts
  const trackForCleanup = (id: number) => {
    if (!createdProductIds.includes(id)) {
      createdProductIds.push(id);
    }
  };

  afterEach(async () => {
    for (const id of createdProductIds) {
      try {
        await prisma.productImage.deleteMany({ where: { productId: id } });
        // Tags are implicit m-n, handled by prisma
        await prisma.product.delete({ where: { id } });
      } catch (e) {
        // Ignore if already deleted
      }
    }
    createdProductIds.length = 0;
  });

  describe('POST /api/admin/products', () => {
    it('should create a product with valid admin secret', async () => {
      const res = await request(app)
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Admin Created Product',
          description: 'Created via Admin API',
          price: 99.99,
          categoryId: categoryId,
          imageUrls: ['http://example.com/img1.jpg', 'http://example.com/img2.jpg'],
          tagIds: [tagId],
          stockQuantity: 100
        });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Admin Created Product');
      expect(res.body.images).toHaveLength(2);
      expect(res.body.tags).toHaveLength(1);
      trackForCleanup(res.body.id);
    });

    it('should fail without admin secret', async () => {
      const res = await request(app)
        .post('/api/admin/products')
        .send({
          name: 'Unauthorized Product',
          description: 'Should fail',
          price: 10,
          categoryId: categoryId
        });

      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/admin/products/:id', () => {
    let productId: number;

    beforeEach(async () => {
        const product = await prisma.product.create({
            data: {
                name: 'Product to Update',
                description: 'Original',
                price: 50,
                categoryId: categoryId,
                stockQuantity: 50
            }
        });
        productId = product.id;
        trackForCleanup(productId);
    });

    it('should update a product', async () => {
        const res = await request(app)
            .put(`/api/admin/products/${productId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: 'Updated Product Name',
                price: 75
            });
        
        expect(res.status).toBe(200);
        expect(res.body.name).toBe('Updated Product Name');
        // Decimal check often requires matching string or floating point
        expect(Number(res.body.price)).toBe(75);
    });
  });

  describe('DELETE /api/admin/products/:id', () => {
    let productId: number;

    beforeEach(async () => {
        const product = await prisma.product.create({
            data: {
                name: 'Product to Delete',
                description: 'To be deleted',
                price: 10,
                categoryId: categoryId
            }
        });
        productId = product.id;
        // Don't track for cleanup initially, or handle if delete succeeds
    });

    it('should delete a product', async () => {
        const res = await request(app)
            .delete(`/api/admin/products/${productId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        
        expect(res.status).toBe(204);

        const check = await prisma.product.findUnique({ where: { id: productId } });
        expect(check).toBeNull();
    });
  });
});
