import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

export const getProducts = async (filters: {
  categoryId?: number;
  tagId?: number;
  search?: string;
  includeOutOfStock?: boolean;
}) => {
  const where: Prisma.ProductWhereInput = {};

  if (!filters.includeOutOfStock) {
    where.stockQuantity = { gt: 0 };
    where.isVisible = true; // Only show visible products by default
  }

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

export const createProduct = async (data: {
  name: string;
  description: string;
  price: number;
  stockStatus?: string;
  stockQuantity?: number;
  isVisible?: boolean;
  ingredients?: string;
  usageInstructions?: string;
  benefits?: string;
  safetyDisclaimers?: string;
  categoryId: number;
  imageUrls: string[];
  tagIds: number[];
}) => {
  return prisma.product.create({
    data: {
      name: data.name,
      description: data.description,
      price: data.price,
      stockQuantity: data.stockQuantity || 0,
      isVisible: data.isVisible !== undefined ? data.isVisible : true,
      ingredients: data.ingredients,
      usageInstructions: data.usageInstructions,
      benefits: data.benefits,
      safetyDisclaimers: data.safetyDisclaimers,
      categoryId: data.categoryId,
      images: {
        create: data.imageUrls.map((url, index) => ({
          url,
          displayOrder: index,
        })),
      },
      tags: {
        connect: data.tagIds.map((id) => ({ id })),
      },
    },
    include: {
      images: true,
      tags: true,
      category: true,
    },
  });
};

export const updateProduct = async (
  id: number,
  data: {
    name?: string;
    description?: string;
    price?: number;
    stockStatus?: string;
    stockQuantity?: number;
    isVisible?: boolean;
    ingredients?: string;
    usageInstructions?: string;
    benefits?: string;
    safetyDisclaimers?: string;
    categoryId?: number;
    imageUrls?: string[];
    tagIds?: number[];
  }
) => {
  const updateData: Prisma.ProductUpdateInput = {
    name: data.name,
    description: data.description,
    price: data.price,
    stockQuantity: data.stockQuantity,
    isVisible: data.isVisible,
    ingredients: data.ingredients,
    usageInstructions: data.usageInstructions,
    benefits: data.benefits,
    safetyDisclaimers: data.safetyDisclaimers,
  };

  if (data.categoryId) {
    updateData.category = {
      connect: { id: data.categoryId },
    };
  }

  if (data.imageUrls) {
    updateData.images = {
      deleteMany: {},
      create: data.imageUrls.map((url, index) => ({
        url,
        displayOrder: index,
      })),
    };
  }

  if (data.tagIds) {
    updateData.tags = {
      set: data.tagIds.map((id) => ({ id })),
    };
  }

  return prisma.product.update({
    where: { id },
    data: updateData,
    include: {
      images: true,
      tags: true,
      category: true,
    },
  });
};

export const deleteProduct = async (id: number) => {
  // Check if product exists and if it has orders
  const product = await prisma.product.findUnique({
    where: { id },
    include: { orderItems: true },
  });

  if (!product) {
    throw new Error('Product not found');
  }

  if (product.orderItems.length > 0) {
    throw new Error('Cannot delete product that has been ordered.');
  }

  const deleteImages = prisma.productImage.deleteMany({
    where: { productId: id },
  });

  const deleteProduct = prisma.product.delete({
    where: { id },
  });

  return prisma.$transaction([deleteImages, deleteProduct]);
};
