import { prisma } from '../lib/prisma';

export const analyticsService = {
  async getDashboardStats() {
    const [userCount, orderCount, revenueAgg, statusCounts, lowStockProducts, topProducts] = await Promise.all([
      prisma.user.count(),
      prisma.order.count(),
      prisma.order.aggregate({
        where: { paymentStatus: 'PAID' },
        _sum: { totalPrice: true },
      }),
      prisma.order.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      prisma.product.findMany({
        where: {
          stockQuantity: {
            lte: 5,
          },
        },
        select: {
          id: true,
          name: true,
          stockQuantity: true,
          reorderLevel: true,
        },
        take: 10,
      }),
      prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
    ]);

    const topProductIds = topProducts.map((entry) => entry.productId);
    const topProductDetails = await prisma.product.findMany({
      where: { id: { in: topProductIds } },
      select: { id: true, name: true },
    });

    const topProductsWithNames = topProducts.map((entry) => ({
      productId: entry.productId,
      name: topProductDetails.find((product) => product.id === entry.productId)?.name ?? 'Unknown',
      quantity: entry._sum.quantity ?? 0,
    }));

    return {
      users: userCount,
      orders: orderCount,
      revenue: revenueAgg._sum.totalPrice ?? 0,
      statusCounts: statusCounts.reduce<Record<string, number>>((acc, entry) => {
        acc[entry.status] = entry._count._all;
        return acc;
      }, {}),
      lowStockProducts,
      topProducts: topProductsWithNames,
    };
  },
};
