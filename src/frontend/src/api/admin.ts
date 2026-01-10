import type { Product } from './catalog';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET || 'super-secret-admin-key';

const headers = {
    'Content-Type': 'application/json',
    'x-admin-secret': ADMIN_SECRET
};

export const fetchAdminProducts = async (): Promise<Product[]> => {
    const response = await fetch(`${API_URL}/admin/products`, {
        headers
    });
    if (!response.ok) throw new Error('Failed to fetch admin products');
    return response.json();
};

export const createProduct = async (productData: any): Promise<Product> => {
    const response = await fetch(`${API_URL}/admin/products`, {
        method: 'POST',
        headers,
        body: JSON.stringify(productData)
    });
    if (!response.ok) throw new Error('Failed to create product');
    return response.json();
};

export const updateProduct = async (id: number, productData: any): Promise<Product> => {
    const response = await fetch(`${API_URL}/admin/products/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(productData)
    });
    if (!response.ok) throw new Error('Failed to update product');
    return response.json();
};

export const deleteProduct = async (id: number): Promise<void> => {
    const response = await fetch(`${API_URL}/admin/products/${id}`, {
        method: 'DELETE',
        headers
    });
    if (!response.ok) throw new Error('Failed to delete product');
};
