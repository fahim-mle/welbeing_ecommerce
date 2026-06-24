import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/lib/prisma';
import { auth } from '../../src/lib/auth';

const makeToken = (user: { id: number; email: string; role: 'USER' | 'ADMIN' }) =>
  auth.generateToken({ userId: user.id, email: user.email, role: user.role });

describe('Reviews API', () => {
  const suffix = Date.now();
  let productId: number;
  let secondProductId: number;
  let userId: number;
  let otherUserId: number;
  let adminId: number;
  let userToken: string;
  let otherUserToken: string;
  let adminToken: string;
  const categoryName = `Review Test Category ${suffix}`;

  beforeAll(async () => {
    const category = await prisma.category.create({
      data: { name: categoryName, description: 'Reviews test category' },
    });

    const [product, secondProduct] = await Promise.all([
      prisma.product.create({
        data: {
          name: `Review Test Product ${suffix}`,
          description: 'Review test description',
          price: 25,
          stockQuantity: 10,
          reorderLevel: 0,
          isVisible: true,
          categoryId: category.id,
        },
      }),
      prisma.product.create({
        data: {
          name: `Review Test Second Product ${suffix}`,
          description: 'Second review test description',
          price: 30,
          stockQuantity: 8,
          reorderLevel: 0,
          isVisible: true,
          categoryId: category.id,
        },
      }),
    ]);
    productId = product.id;
    secondProductId = secondProduct.id;

    const [user, otherUser, admin] = await Promise.all([
      prisma.user.create({
        data: {
          email: `review-user-${suffix}@example.com`,
          firstName: 'Review',
          lastName: 'User',
        },
      }),
      prisma.user.create({
        data: {
          email: `review-other-${suffix}@example.com`,
          firstName: 'Other',
          lastName: 'User',
        },
      }),
      prisma.user.create({
        data: {
          email: `review-admin-${suffix}@example.com`,
          firstName: 'Review',
          lastName: 'Admin',
          role: 'ADMIN',
        },
      }),
    ]);

    userId = user.id;
    otherUserId = otherUser.id;
    adminId = admin.id;
    userToken = makeToken({ id: user.id, email: user.email, role: 'USER' });
    otherUserToken = makeToken({ id: otherUser.id, email: otherUser.email, role: 'USER' });
    adminToken = makeToken({ id: admin.id, email: admin.email, role: 'ADMIN' });
  });

  afterAll(async () => {
    await prisma.review.deleteMany({
      where: {
        OR: [
          { productId: { in: [productId, secondProductId] } },
          { userId: { in: [userId, otherUserId, adminId] } },
        ],
      },
    });
    await prisma.product.deleteMany({ where: { id: { in: [productId, secondProductId] } } });
    await prisma.category.deleteMany({ where: { name: categoryName } });
    await prisma.user.deleteMany({ where: { id: { in: [userId, otherUserId, adminId] } } });
  });

  it('GET /api/products/:id/reviews returns public reviews with average rating', async () => {
    await prisma.review.create({
      data: {
        productId,
        userId,
        rating: 5,
        comment: 'Excellent quality.',
      },
    });

    const response = await request(app).get(`/api/products/${productId}/reviews`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          rating: 5,
          comment: 'Excellent quality.',
          user: expect.objectContaining({ firstName: 'Review' }),
        }),
      ]),
    );
    expect(response.body.summary).toEqual(expect.objectContaining({ averageRating: 5, totalReviews: 1 }));
  });

  it('POST /api/products/:id/reviews requires authentication', async () => {
    const response = await request(app)
      .post(`/api/products/${secondProductId}/reviews`)
      .send({ rating: 4, comment: 'Good supplement.' });

    expect(response.status).toBe(401);
  });

  it('POST /api/products/:id/reviews validates rating range', async () => {
    const response = await request(app)
      .post(`/api/products/${secondProductId}/reviews`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ rating: 6, comment: 'Invalid rating.' });

    expect(response.status).toBe(400);
  });

  it('POST /api/products/:id/reviews creates or updates the current user review', async () => {
    const createResponse = await request(app)
      .post(`/api/products/${secondProductId}/reviews`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ rating: 4, comment: 'Good value.' });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.data).toEqual(expect.objectContaining({ rating: 4, comment: 'Good value.' }));

    const updateResponse = await request(app)
      .post(`/api/products/${secondProductId}/reviews`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ rating: 5, comment: 'Better after a week.' });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data).toEqual(expect.objectContaining({ rating: 5, comment: 'Better after a week.' }));

    const count = await prisma.review.count({ where: { productId: secondProductId, userId } });
    expect(count).toBe(1);
  });

  it('PUT /api/reviews/:id allows owners to update their own review only', async () => {
    const review = await prisma.review.create({
      data: { productId, userId: otherUserId, rating: 3, comment: 'Original comment.' },
    });

    const forbiddenResponse = await request(app)
      .put(`/api/reviews/${review.id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ rating: 4, comment: 'Hijacked.' });

    expect(forbiddenResponse.status).toBe(403);

    const ownerResponse = await request(app)
      .put(`/api/reviews/${review.id}`)
      .set('Authorization', `Bearer ${otherUserToken}`)
      .send({ rating: 4, comment: 'Owner update.' });

    expect(ownerResponse.status).toBe(200);
    expect(ownerResponse.body.data).toEqual(expect.objectContaining({ rating: 4, comment: 'Owner update.' }));
  });

  it('DELETE /api/reviews/:id allows owners or admins to remove reviews', async () => {
    const ownerReview = await prisma.review.create({
      data: { productId, userId, rating: 4, comment: 'Owner delete me.' },
    });
    const adminReview = await prisma.review.create({
      data: { productId, userId: otherUserId, rating: 2, comment: 'Admin delete me.' },
    });

    const forbiddenResponse = await request(app)
      .delete(`/api/reviews/${adminReview.id}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(forbiddenResponse.status).toBe(403);

    const ownerResponse = await request(app)
      .delete(`/api/reviews/${ownerReview.id}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(ownerResponse.status).toBe(204);

    const adminResponse = await request(app)
      .delete(`/api/reviews/${adminReview.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adminResponse.status).toBe(204);
  });

  it('GET /api/admin/reviews lists recent reviews for moderation', async () => {
    await prisma.review.create({
      data: { productId, userId, rating: 1, comment: 'Needs moderation.' },
    });

    const response = await request(app)
      .get('/api/admin/reviews')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          rating: 1,
          comment: 'Needs moderation.',
          product: expect.objectContaining({ id: productId }),
          user: expect.objectContaining({ id: userId }),
        }),
      ]),
    );
  });
});
