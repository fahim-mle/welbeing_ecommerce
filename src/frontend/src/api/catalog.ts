import { API_BASE_URL } from '../config';

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number; // Decimal comes as string from Prisma usually, but here mapped to number or string? JSON usually string for Decimal.
  // Wait, Prisma Decimal is string in JSON. But let's check my curl output.
  // "price":"29.99"
  // So it is string. But in frontend we might want number.
  // I'll type it string for safety, but maybe convert.
  stockStatus: 'IN_STOCK' | 'OUT_OF_STOCK';
  categoryId: number;
  category?: Category;
  images: ProductImage[];
  tags: WellbeingTag[];
  ingredients?: string;
  usageInstructions?: string;
  benefits?: string;
  safetyDisclaimers?: string;
}

export interface ProductImage {
  id: number;
  url: string;
  displayOrder: number;
  altText?: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
}

export interface WellbeingTag {
  id: number;
  name: string;
  type: 'GOAL' | 'FEATURE' | 'NEED';
}

export interface CatalogFilters {
  categoryId?: number;
  tagId?: number;
  search?: string;
}

export const fetchProducts = async (filters: CatalogFilters = {}): Promise<Product[]> => {
  const params = new URLSearchParams();
  if (filters.categoryId) params.append('category', String(filters.categoryId));
  if (filters.tagId) params.append('tag', String(filters.tagId));
  if (filters.search) params.append('search', filters.search);

  const response = await fetch(`${API_BASE_URL}/products?${params.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch products');
  const result = await response.json();
  console.log(result);
  return result.data;
};

export const fetchProductById = async (id: number): Promise<Product> => {
  const response = await fetch(`${API_BASE_URL}/products/${id}`);
  if (!response.ok) throw new Error('Failed to fetch product');
  const result = await response.json();
  return result.data;
};

export const fetchCategories = async (): Promise<Category[]> => {
  const response = await fetch(`${API_BASE_URL}/categories`);
  if (!response.ok) throw new Error('Failed to fetch categories');
  const result = await response.json();
  return result.data;
};

export const fetchTags = async (): Promise<WellbeingTag[]> => {
  const response = await fetch(`${API_BASE_URL}/tags`);
  if (!response.ok) throw new Error('Failed to fetch tags');
  const result = await response.json();
  return result.data;
};
