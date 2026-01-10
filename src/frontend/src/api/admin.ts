import type { Product } from './catalog';
import { API_BASE_URL } from '../config';

const getHeaders = (token: string) => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
});

export const fetchAdminProducts = async (token: string): Promise<Product[]> => {
    const response = await fetch(`${API_BASE_URL}/admin/products`, {
        headers: getHeaders(token)
    });
    if (!response.ok) throw new Error('Failed to fetch admin products');
    return response.json();
};

export const createProduct = async (token: string, productData: any): Promise<Product> => {
    const response = await fetch(`${API_BASE_URL}/admin/products`, {
        method: 'POST',
        headers: getHeaders(token),
        body: JSON.stringify(productData)
    });
    if (!response.ok) throw new Error('Failed to create product');
    return response.json();
};

export const updateProduct = async (token: string, id: number, productData: any): Promise<Product> => {
    const response = await fetch(`${API_BASE_URL}/admin/products/${id}`, {
        method: 'PUT',
        headers: getHeaders(token),
        body: JSON.stringify(productData)
    });
    if (!response.ok) throw new Error('Failed to update product');
    return response.json();
};

export const deleteProduct = async (token: string, id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/admin/products/${id}`, {
        method: 'DELETE',
        headers: getHeaders(token)
    });
    if (!response.ok) throw new Error('Failed to delete product');
};
