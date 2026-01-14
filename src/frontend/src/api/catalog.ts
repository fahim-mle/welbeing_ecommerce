import { API_BASE_URL } from '../config';

export interface ProductVariant {
  id: number;
  productId: number;
  sku: string;
  price: number;
  stockQuantity: number;
  optionValues: Record<string, string>;
  isActive: boolean;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  stockQuantity: number;
  isVisible: boolean;
  categoryId: number;
  category?: Category;
  images: ProductImage[];
  tags: WellbeingTag[];
  variants?: ProductVariant[];
  ingredients?: string;
  usageInstructions?: string;
  benefits?: string;
  safetyDisclaimers?: string;
  createdAt: string;
  updatedAt: string;
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
  page?: number;
  limit?: number;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedProducts {
  data: Product[];
  pagination: Pagination;
}

export const fetchProducts = async (filters: CatalogFilters = {}): Promise<PaginatedProducts> => {
  const params = new URLSearchParams();
  if (filters.categoryId) params.append('category', String(filters.categoryId));
  if (filters.tagId) params.append('tag', String(filters.tagId));
  if (filters.search) params.append('search', filters.search);
  if (filters.page) params.append('page', String(filters.page));
  if (filters.limit) params.append('limit', String(filters.limit));

  const response = await fetch(`${API_BASE_URL}/products?${params.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch products');
  const result = await response.json();
  return { data: result.data, pagination: result.pagination };
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
