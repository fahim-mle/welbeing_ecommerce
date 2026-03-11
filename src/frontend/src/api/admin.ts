import type { Category, Product, WellbeingTag } from './catalog';
import { API_BASE_URL } from '../config';
import type { OrderResponse } from './orders';

const getHeaders = (token: string) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

export interface PaginatedAdminOrders {
  data: OrderResponse[];
  page: number;
  limit: number;
  hasNextPage: boolean;
}

export interface AdminUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role: 'USER' | 'ADMIN';
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt?: string;
}

export interface PaginatedAdminUsers {
  data: AdminUser[];
  page: number;
  limit: number;
  hasNextPage: boolean;
}

export const fetchAdminProducts = async (token: string, page = 1, limit = 20): Promise<Product[]> => {
  const response = await fetch(`${API_BASE_URL}/admin/products?page=${page}&limit=${limit}`, {
    headers: getHeaders(token),
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch admin products');
  const result = await response.json();
  return result.data?.products ?? result.data ?? result;
};

export const fetchAdminOrders = async (
  token: string,
  page = 1,
  limit = 20,
): Promise<PaginatedAdminOrders> => {
  const response = await fetch(`${API_BASE_URL}/admin/orders?page=${page}&limit=${limit}`, {
    headers: getHeaders(token),
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch admin orders');
  const result = await response.json();
  const data = Array.isArray(result.data) ? result.data : [];
  return {
    data,
    page: result.page ?? page,
    limit: result.limit ?? limit,
    hasNextPage: data.length === (result.limit ?? limit),
  };
};

export const fetchAdminUsers = async (token: string, page = 1, limit = 20): Promise<PaginatedAdminUsers> => {
  const response = await fetch(`${API_BASE_URL}/admin/users?page=${page}&limit=${limit}`, {
    headers: getHeaders(token),
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch users');
  const result = await response.json();
  const data = Array.isArray(result.data) ? result.data : [];
  return {
    data,
    page: result.page ?? page,
    limit: result.limit ?? limit,
    hasNextPage: data.length === (result.limit ?? limit),
  };
};

export const updateAdminUser = async (
  token: string,
  id: number,
  payload: { role?: AdminUser['role']; isActive?: boolean },
): Promise<AdminUser> => {
  const response = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
    method: 'PATCH',
    headers: getHeaders(token),
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || 'Failed to update user');
  }
  const result = await response.json();
  return result.data;
};

export const fetchAdminOrder = async (token: string, id: number): Promise<OrderResponse> => {
  const response = await fetch(`${API_BASE_URL}/admin/orders/${id}`, {
    headers: getHeaders(token),
    credentials: 'include',
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || 'Failed to fetch order details');
  }
  const result = await response.json();
  return result.data;
};

export const updateOrderStatus = async (token: string, id: number, status: string): Promise<OrderResponse> => {
    const response = await fetch(`${API_BASE_URL}/admin/orders/${id}/status`, {
        method: 'PATCH',
        headers: getHeaders(token),
        credentials: 'include',
        body: JSON.stringify({ status })
    });
    if (!response.ok) throw new Error('Failed to update order status');
    const result = await response.json();
    return result.data;
};

export type AdminProductPayload = Partial<Product> & Record<string, unknown>;

export const createProduct = async (token: string, productData: AdminProductPayload): Promise<Product> => {
    const response = await fetch(`${API_BASE_URL}/admin/products`, {
        method: 'POST',
        headers: getHeaders(token),
        credentials: 'include',
        body: JSON.stringify(productData)
    });
    if (!response.ok) throw new Error('Failed to create product');
    return response.json();
};

export const updateProduct = async (token: string, id: number, productData: AdminProductPayload): Promise<Product> => {
    const response = await fetch(`${API_BASE_URL}/admin/products/${id}`, {
        method: 'PUT',
        headers: getHeaders(token),
        credentials: 'include',
        body: JSON.stringify(productData)
    });
    if (!response.ok) throw new Error('Failed to update product');
    return response.json();
};

export const deleteProduct = async (token: string, id: number): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/admin/products/${id}`, {
    method: 'DELETE',
    headers: getHeaders(token),
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to delete product');
};

export const createCategory = async (
  token: string,
  payload: { name: string; description?: string; parentId?: number | null },
): Promise<Category> => {
  const response = await fetch(`${API_BASE_URL}/admin/catalog/categories`, {
    method: 'POST',
    headers: getHeaders(token),
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || 'Failed to create category');
  }
  const result = await response.json();
  return result.data;
};

export const updateCategory = async (
  token: string,
  id: number,
  payload: { name?: string; description?: string; parentId?: number | null },
): Promise<Category> => {
  const response = await fetch(`${API_BASE_URL}/admin/catalog/categories/${id}`, {
    method: 'PUT',
    headers: getHeaders(token),
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || 'Failed to update category');
  }
  const result = await response.json();
  return result.data;
};

export const deleteCategory = async (token: string, id: number): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/admin/catalog/categories/${id}`, {
    method: 'DELETE',
    headers: getHeaders(token),
    credentials: 'include',
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || 'Failed to delete category');
  }
};

export const createTag = async (
  token: string,
  payload: { name: string; type: WellbeingTag['type'] },
): Promise<WellbeingTag> => {
  const response = await fetch(`${API_BASE_URL}/admin/catalog/tags`, {
    method: 'POST',
    headers: getHeaders(token),
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || 'Failed to create tag');
  }
  const result = await response.json();
  return result.data;
};

export const updateTag = async (
  token: string,
  id: number,
  payload: { name?: string; type?: WellbeingTag['type'] },
): Promise<WellbeingTag> => {
  const response = await fetch(`${API_BASE_URL}/admin/catalog/tags/${id}`, {
    method: 'PUT',
    headers: getHeaders(token),
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || 'Failed to update tag');
  }
  const result = await response.json();
  return result.data;
};

export const deleteTag = async (token: string, id: number): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/admin/catalog/tags/${id}`, {
    method: 'DELETE',
    headers: getHeaders(token),
    credentials: 'include',
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || 'Failed to delete tag');
  }
};
