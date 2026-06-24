import { prisma } from '../lib/prisma';

export interface ReviewInput {
  rating: number;
  comment: string | null;
}

const reviewInclude = {
  user: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
  },
  product: {
    select: {
      id: true,
      name: true,
    },
  },
};

export const listProductReviews = async (productId: number, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const [reviews, totalReviews, aggregate] = await Promise.all([
    prisma.review.findMany({
      where: { productId },
      include: { user: reviewInclude.user },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.review.count({ where: { productId } }),
    prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
    }),
  ]);

  return {
    reviews,
    summary: {
      averageRating: aggregate._avg.rating ? Number(aggregate._avg.rating.toFixed(2)) : 0,
      totalReviews,
    },
  };
};

export const createOrUpdateProductReview = async (productId: number, userId: number, input: ReviewInput) => {
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
  if (!product) {
    return { status: 404 as const, review: null };
  }

  const existing = await prisma.review.findFirst({ where: { productId, userId }, select: { id: true } });
  if (existing) {
    const review = await prisma.review.update({
      where: { id: existing.id },
      data: input,
      include: reviewInclude,
    });
    return { status: 200 as const, review };
  }

  const review = await prisma.review.create({
    data: { productId, userId, ...input },
    include: reviewInclude,
  });
  return { status: 201 as const, review };
};

export const updateOwnReview = async (reviewId: number, userId: number, input: ReviewInput) => {
  const review = await prisma.review.findUnique({ where: { id: reviewId }, select: { userId: true } });
  if (!review) {
    return { status: 404 as const, review: null };
  }
  if (review.userId !== userId) {
    return { status: 403 as const, review: null };
  }

  const updated = await prisma.review.update({
    where: { id: reviewId },
    data: input,
    include: reviewInclude,
  });
  return { status: 200 as const, review: updated };
};

export const deleteReview = async (reviewId: number, userId: number, role: string) => {
  const review = await prisma.review.findUnique({ where: { id: reviewId }, select: { userId: true } });
  if (!review) {
    return 404 as const;
  }
  if (review.userId !== userId && role !== 'ADMIN') {
    return 403 as const;
  }

  await prisma.review.delete({ where: { id: reviewId } });
  return 204 as const;
};

export const listAdminReviews = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      include: reviewInclude,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.review.count(),
  ]);

  return { reviews, total };
};
