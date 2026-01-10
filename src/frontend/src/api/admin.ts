import type { Product } from './catalog';
import { API_BASE_URL } from '../config';
import type { OrderResponse } from './orders';

const getHeaders = (token: string) => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
});

export const fetchAdminProducts = async (token: string): Promise<Product[]> => {
    const response = await fetch(`${API_BASE_URL}/admin/products`, {
        headers: getHeaders(token)
    });
    if (!response.ok) throw new Error('Failed to fetch admin products');
    const result = await response.json();
    return result.data || result; // Handle both wrapper formats if existing
};

export const fetchAdminOrders = async (token: string): Promise<OrderResponse[]> => {
    const response = await fetch(`${API_BASE_URL}/admin/orders`, {
        headers: getHeaders(token)
    });
    if (!response.ok) throw new Error('Failed to fetch admin orders');
    const result = await response.json();
    return result.data;
};

export const updateOrderStatus = async (token: string, id: number, status: string): Promise<OrderResponse> => {
    const response = await fetch(`${API_BASE_URL}/admin/orders/${id}/status`, {
        method: 'PATCH',
        headers: getHeaders(token),
        body: JSON.stringify({ status })
    });
    if (!response.ok) throw new Error('Failed to update order status');
    const result = await response.json();
    return result.data;
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
