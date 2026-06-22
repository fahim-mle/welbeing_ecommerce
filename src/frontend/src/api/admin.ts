import type { Category, Product, WellbeingTag } from './catalog';
import { API_BASE_URL } from '../config';
import { apiFetch } from '../utils/apiFetch';
import type { OrderResponse } from './orders';

const jsonHeaders = { 'Content-Type': 'application/json' };

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
  mfaEnabled?: boolean;
  lastLoginAt?: string | null;
  createdAt?: string;
}

export interface PaginatedAdminUsers {
  data: AdminUser[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AdminUsersFilters {
  search?: string;
  role?: string;
  status?: string;
  mfaEnabled?: string;
}

export interface PaginatedAdminProducts {
  data: Product[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const fetchAdminProducts = async (
  page = 1,
  limit = 20,
  search?: string,
): Promise<PaginatedAdminProducts> => {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  if (search) {
    params.append('search', search);
  }

  const response = await apiFetch(`${API_BASE_URL}/admin/products?${params.toString()}`, {
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch admin products');
  const result = await response.json();
  return result;
};

export const fetchAdminOrders = async (
  page = 1,
  limit = 20,
): Promise<PaginatedAdminOrders> => {
  const response = await apiFetch(`${API_BASE_URL}/admin/orders?page=${page}&limit=${limit}`, {
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

export const fetchAdminUsers = async (
  page = 1,
  limit = 20,
  filters?: AdminUsersFilters,
): Promise<PaginatedAdminUsers> => {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());

  if (filters?.search) {
    params.append('search', filters.search);
  }
  if (filters?.role && filters.role !== 'all') {
    params.append('role', filters.role);
  }
  if (filters?.status && filters.status !== 'all') {
    params.append('status', filters.status);
  }
  if (filters?.mfaEnabled && filters.mfaEnabled !== 'all') {
    params.append('mfaEnabled', filters.mfaEnabled);
  }

  const response = await apiFetch(`${API_BASE_URL}/admin/users?${params.toString()}`, {
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch users');
  const result = await response.json();
  return result;
};

export const updateAdminUser = async (
  id: number,
  payload: { role?: AdminUser['role']; isActive?: boolean },
): Promise<AdminUser> => {
  const response = await apiFetch(`${API_BASE_URL}/admin/users/${id}`, {
    method: 'PATCH',
    headers: jsonHeaders,
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

export const fetchAdminOrder = async (id: number): Promise<OrderResponse> => {
  const response = await apiFetch(`${API_BASE_URL}/admin/orders/${id}`, {
    credentials: 'include',
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || 'Failed to fetch order details');
  }
  const result = await response.json();
  return result.data;
};

export const updateOrderStatus = async (id: number, status: string): Promise<OrderResponse> => {
    const response = await apiFetch(`${API_BASE_URL}/admin/orders/${id}/status`, {
        method: 'PATCH',
        headers: jsonHeaders,
        credentials: 'include',
        body: JSON.stringify({ status })
    });
    if (!response.ok) throw new Error('Failed to update order status');
    const result = await response.json();
    return result.data;
};

export type AdminProductPayload = Partial<Product> & Record<string, unknown>;

export const createProduct = async (productData: AdminProductPayload): Promise<Product> => {
    const response = await apiFetch(`${API_BASE_URL}/admin/products`, {
        method: 'POST',
        headers: jsonHeaders,
        credentials: 'include',
        body: JSON.stringify(productData)
    });
    if (!response.ok) throw new Error('Failed to create product');
    return response.json();
};

export const updateProduct = async (id: number, productData: AdminProductPayload): Promise<Product> => {
    const response = await apiFetch(`${API_BASE_URL}/admin/products/${id}`, {
        method: 'PUT',
        headers: jsonHeaders,
        credentials: 'include',
        body: JSON.stringify(productData)
    });
    if (!response.ok) throw new Error('Failed to update product');
    return response.json();
};

export interface UploadedImage {
  key: string;
  url: string;
  size: number;
  mimetype: string;
  width: number;
  height: number;
}

export const uploadProductImage = async (file: File): Promise<UploadedImage> => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await apiFetch(`${API_BASE_URL}/admin/uploads/images`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || 'Failed to upload product image');
  }

  return response.json();
};

export const deleteProduct = async (id: number): Promise<void> => {
  const response = await apiFetch(`${API_BASE_URL}/admin/products/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to delete product');
};

export const createCategory = async (
  payload: { name: string; description?: string; parentId?: number | null },
): Promise<Category> => {
  const response = await apiFetch(`${API_BASE_URL}/admin/catalog/categories`, {
    method: 'POST',
    headers: jsonHeaders,
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
  id: number,
  payload: { name?: string; description?: string; parentId?: number | null },
): Promise<Category> => {
  const response = await apiFetch(`${API_BASE_URL}/admin/catalog/categories/${id}`, {
    method: 'PUT',
    headers: jsonHeaders,
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

export const deleteCategory = async (id: number): Promise<void> => {
  const response = await apiFetch(`${API_BASE_URL}/admin/catalog/categories/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || 'Failed to delete category');
  }
};

export const createTag = async (
  payload: { name: string; type: WellbeingTag['type'] },
): Promise<WellbeingTag> => {
  const response = await apiFetch(`${API_BASE_URL}/admin/catalog/tags`, {
    method: 'POST',
    headers: jsonHeaders,
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
  id: number,
  payload: { name?: string; type?: WellbeingTag['type'] },
): Promise<WellbeingTag> => {
  const response = await apiFetch(`${API_BASE_URL}/admin/catalog/tags/${id}`, {
    method: 'PUT',
    headers: jsonHeaders,
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

export const deleteTag = async (id: number): Promise<void> => {
  const response = await apiFetch(`${API_BASE_URL}/admin/catalog/tags/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || 'Failed to delete tag');
  }
};
