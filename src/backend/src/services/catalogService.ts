import { Prisma, WellbeingTagType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { deleteByPattern, deleteCache, getCache, setCache } from '../lib/redis';

export interface GetAdminProductsOptions {
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedProducts {
  data: Awaited<ReturnType<typeof prisma.product.findMany>>;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const CATEGORY_CACHE_KEY = 'catalog:categories';
const TAG_CACHE_KEY = 'catalog:tags';
const PRODUCT_CACHE_PREFIX = 'catalog:product:';
const PRODUCTS_CACHE_PREFIX = 'catalog:products:';
const CATEGORY_CACHE_TTL_SECONDS = 300;
const TAG_CACHE_TTL_SECONDS = 300;
const PRODUCT_CACHE_TTL_SECONDS = 120;
const PRODUCT_LIST_CACHE_TTL_SECONDS = 60;

const parseCachedValue = <T>(value: string | null) => {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.error('Failed to parse cache value:', error);
    return null;
  }
};

const buildProductsCacheKey = (filters: {
  categoryId?: number;
  tagId?: number;
  search?: string;
  page: number;
  limit: number;
}) => {
  const search = filters.search ? encodeURIComponent(filters.search) : 'all';
  return `${PRODUCTS_CACHE_PREFIX}${filters.categoryId ?? 'all'}:${filters.tagId ?? 'all'}:${search}:${filters.page}:${filters.limit}`;
};

export const invalidateProductCaches = async (productId?: number) => {
  await deleteByPattern(`${PRODUCTS_CACHE_PREFIX}*`);
  await deleteCache(CATEGORY_CACHE_KEY);
  await deleteCache(TAG_CACHE_KEY);
  if (productId !== undefined) {
    await deleteCache(`${PRODUCT_CACHE_PREFIX}${productId}`);
  }
};

const invalidateCategoryTagCaches = async () => {
  await deleteCache(CATEGORY_CACHE_KEY);
  await deleteCache(TAG_CACHE_KEY);
};

export const getProducts = async (filters: {
  categoryId?: number;
  tagId?: number;
  search?: string;
  includeOutOfStock?: boolean;
  page?: number;
  limit?: number;
}) => {
  const where: Prisma.ProductWhereInput = {};
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const skip = (page - 1) * limit;

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

  const cacheKey = buildProductsCacheKey({
    categoryId: filters.categoryId,
    tagId: filters.tagId,
    search: filters.search,
    page,
    limit,
  });

  if (!filters.includeOutOfStock) {
    const cached = parseCachedValue<any>(await getCache(cacheKey));
    if (cached && !Array.isArray(cached) && cached.products && typeof cached.total === 'number') {
      return cached as { products: Awaited<ReturnType<typeof prisma.product.findMany>>; total: number };
    }
  }

  const [products, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        updatedAt: 'desc',
      },
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
    }),
    prisma.product.count({ where }),
  ]);

  const result = { products, total };

  if (!filters.includeOutOfStock) {
    await setCache(cacheKey, JSON.stringify(result), PRODUCT_LIST_CACHE_TTL_SECONDS);
  }

  return result;
};

/**
 * Admin-specific product listing: includes all products regardless of visibility/stock,
 * supports case-insensitive search across name, SKU, and description, and returns
 * pagination metadata. Limit is capped at 100 to prevent runaway queries.
 */
export const getAdminProducts = async (options: GetAdminProductsOptions = {}): Promise<PaginatedProducts> => {
  const { search } = options;
  const page = options.page ?? 1;
  // Cap at 100 to prevent runaway queries
  const limit = Math.min(options.limit ?? 20, 100);
  const skip = (page - 1) * limit;

  const where: Prisma.ProductWhereInput = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {};

  const [data, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        images: {
          orderBy: { displayOrder: 'asc' },
          take: 1,
        },
        tags: true,
      },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getProductById = async (id: number) => {
  const cacheKey = `${PRODUCT_CACHE_PREFIX}${id}`;
  const cached = parseCachedValue<Awaited<ReturnType<typeof prisma.product.findUnique>>>(await getCache(cacheKey));
  if (cached) {
    return cached;
  }

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      images: {
        orderBy: {
          displayOrder: 'asc',
        },
      },
      tags: true,
      variants: {
        where: { isActive: true },
      },
    },
  });

  if (product) {
    await setCache(cacheKey, JSON.stringify(product), PRODUCT_CACHE_TTL_SECONDS);
  }

  return product;
};

export const getCategories = async () => {
  const cached = parseCachedValue<Awaited<ReturnType<typeof prisma.category.findMany>>>(
    await getCache(CATEGORY_CACHE_KEY)
  );
  if (cached) {
    return cached;
  }

  const categories = await prisma.category.findMany();
  await setCache(CATEGORY_CACHE_KEY, JSON.stringify(categories), CATEGORY_CACHE_TTL_SECONDS);
  return categories;
};

export const getTags = async () => {
  const cached = parseCachedValue<Awaited<ReturnType<typeof prisma.wellbeingTag.findMany>>>(
    await getCache(TAG_CACHE_KEY)
  );
  if (cached) {
    return cached;
  }

  const tags = await prisma.wellbeingTag.findMany();
  await setCache(TAG_CACHE_KEY, JSON.stringify(tags), TAG_CACHE_TTL_SECONDS);
  return tags;
};

export const createProduct = async (data: {
  name: string;
  description: string;
  price: number;
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
  const product = await prisma.product.create({
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

  await invalidateProductCaches(product.id);
  return product;
};

export const updateProduct = async (
  id: number,
  data: {
    name?: string;
    description?: string;
    price?: number;
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

  const product = await prisma.product.update({
    where: { id },
    data: updateData,
    include: {
      images: true,
      tags: true,
      category: true,
    },
  });

  await invalidateProductCaches(id);
  return product;
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

  const result = await prisma.$transaction([deleteImages, deleteProduct]);
  await invalidateProductCaches(id);
  return result;
};

export const createCategory = async (data: { name: string; description?: string; parentId?: number }) => {
  const category = await prisma.category.create({
    data: {
      name: data.name,
      description: data.description,
      parentId: data.parentId ?? null,
    },
  });
  await invalidateCategoryTagCaches();
  return category;
};

export const updateCategory = async (
  id: number,
  data: { name?: string; description?: string; parentId?: number | null }
) => {
  const category = await prisma.category.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      parentId: data.parentId ?? undefined,
    },
  });
  await invalidateCategoryTagCaches();
  return category;
};

export const deleteCategory = async (id: number) => {
  const category = await prisma.category.findUnique({
    where: { id },
    include: { products: true },
  });

  if (!category) {
    throw new Error('Category not found');
  }

  if (category.products.length > 0) {
    throw new Error('Cannot delete category with products');
  }

  await prisma.category.delete({ where: { id } });
  await invalidateCategoryTagCaches();
};

export const createTag = async (data: { name: string; type: WellbeingTagType }) => {
  const tag = await prisma.wellbeingTag.create({
    data: {
      name: data.name,
      type: data.type,
    },
  });
  await invalidateCategoryTagCaches();
  return tag;
};

export const updateTag = async (id: number, data: { name?: string; type?: WellbeingTagType }) => {
  const tag = await prisma.wellbeingTag.update({
    where: { id },
    data: {
      name: data.name,
      type: data.type,
    },
  });
  await invalidateCategoryTagCaches();
  return tag;
};

export const deleteTag = async (id: number) => {
  await prisma.wellbeingTag.delete({ where: { id } });
  await invalidateCategoryTagCaches();
};
