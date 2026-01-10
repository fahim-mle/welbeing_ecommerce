import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

export const getProducts = async (filters: {
  categoryId?: number;
  tagId?: number;
  search?: string;
}) => {
  const where: Prisma.ProductWhereInput = {
    stockStatus: 'IN_STOCK', // Default to showing in-stock items, or make this configurable
  };

  if (filters.categoryId) {
    where.categoryId = filters.categoryId;
  }

  if (filters.tagId) {
    where.tags = {
      some: {
        id: filters.tagId,
      },
    };
  }

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search } },
      { description: { contains: filters.search } },
    ];
  }

  return prisma.product.findMany({
    where,
    include: {
      category: true,
      images: {
        orderBy: {
          displayOrder: 'asc',
        },
        take: 1, // Only get primary image for list view
      },
      tags: true,
    },
  });
};

export const getProductById = async (id: number) => {
  return prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      images: {
        orderBy: {
          displayOrder: 'asc',
        },
      },
      tags: true,
    },
  });
};

export const getCategories = async () => {
  return prisma.category.findMany();
};

export const getTags = async () => {
  return prisma.wellbeingTag.findMany();
};
