import fs from 'fs';
import path from 'path';
import { prisma } from '../../src/lib/prisma';
import { seedDatabase } from '../../prisma/seed';

const reviewSeedData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../prisma/seed-reviews.json'), 'utf-8'),
) as { reviews: { userEmail: string; productSku: string; rating: number; comment: string }[] };

const clearSeededData = async () => {
  await prisma.orderStatusHistory.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.inventoryLog.deleteMany();
  await prisma.review.deleteMany();
  await prisma.address.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.wellbeingTag.deleteMany();
  await prisma.category.deleteMany();
  await prisma.userIdentity.deleteMany();
  await prisma.user.deleteMany();
};

describe('review seed data', () => {
  afterAll(async () => {
    await clearSeededData();
  });

  it('loads seeded reviews against seeded users and products', async () => {
    await seedDatabase(prisma);

    const expectedReviewCount = reviewSeedData.reviews.length;
    const reviewCount = await prisma.review.count();
    const product = await prisma.product.findUnique({
      where: { sku: 'SUPP-001' },
      include: {
        reviews: {
          include: { user: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    expect(reviewCount).toBe(expectedReviewCount);
    expect(product?.reviews).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          rating: 5,
          comment: expect.stringContaining('Mixes incredibly well'),
          user: expect.objectContaining({ email: 'user1@welbeing.com' }),
        }),
      ]),
    );
  });
});
