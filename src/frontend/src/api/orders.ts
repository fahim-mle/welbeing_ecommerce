import { API_BASE_URL } from '../config';
import { apiFetch } from '../utils/apiFetch';

export interface OrderItemPayload {
  product_id: number;
  product_variant_id?: number;
  quantity: number;
}

export interface ShippingAddressPayload {
  label: string;
  fullName: string;
  phone: string;
  streetLine1: string;
  streetLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

export interface OrderPayload {
  email?: string;
  user_type?: 'USER' | 'GUEST' | 'ADMIN';
  items: OrderItemPayload[];
  shipping_address?: ShippingAddressPayload;
  address_id?: number;
  payment_placeholder: string;
  disclaimer_accepted: boolean;
}

export interface OrderItemResponse {
  id: number;
  productId: number;
  quantity: number;
  priceAtPurchase: string;
  product: {
    id: number;
    name: string;
    price: string;
  };
  productVariant?: {
    id: number;
    sku: string;
    optionValues?: Record<string, string>;
  } | null;
}

export interface OrderAddressResponse {
  id: number;
  label: string;
  fullName: string;
  phone: string;
  streetLine1: string;
  streetLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface OrderStatusHistory {
  id: number;
  fromStatus: string;
  toStatus: string;
  changedBy?: string;
  createdAt: string;
}

export interface OrderResponse {
  id: number;
  guestEmail?: string | null;
  status: string;
  paymentStatus?: string;
  totalPrice: string;
  shippingFee?: string;
  taxAmount?: string;
  shippingAddress?: string | null;
  address?: OrderAddressResponse | null;
  createdAt: string;
  items: OrderItemResponse[];
  user?: {
    email: string;
  } | null;
  statusHistory?: OrderStatusHistory[];
}

export const createOrder = async (payload: OrderPayload): Promise<OrderResponse> => {
  const response = await apiFetch(`${API_BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const errorMessage = errorBody?.error?.message || errorBody?.error || errorBody?.message || 'Failed to create order';
    throw new Error(errorMessage);
  }

  const result = await response.json();
  return result.data;
};

export interface PaginatedOrders {
  data: OrderResponse[];
  page: number;
  limit: number;
  hasNextPage: boolean;
}

export const fetchMyOrders = async (page = 1, limit = 6): Promise<PaginatedOrders> => {
  const response = await apiFetch(`${API_BASE_URL}/orders?page=${page}&limit=${limit}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch orders');
  }

  const result = await response.json();
  const data = Array.isArray(result.data) ? result.data : [];
  return {
    data,
    page: result.page ?? page,
    limit: result.limit ?? limit,
    hasNextPage: data.length === (result.limit ?? limit),
  };
};

export const cancelOrder = async (orderId: number): Promise<OrderResponse> => {
  const response = await apiFetch(`${API_BASE_URL}/orders/${orderId}/cancel`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error?.message || error?.message || 'Failed to cancel order');
  }

  const result = await response.json();
  return result.data;
};

export const fetchOrder = async (
  id: number,
  guestEmail?: string,
): Promise<OrderResponse> => {
  const query = guestEmail ? `?guestEmail=${encodeURIComponent(guestEmail)}` : '';
  const response = await apiFetch(`${API_BASE_URL}/orders/${id}${query}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.error || errorBody?.message || 'Failed to fetch order');
  }

  const result = await response.json();
  return result.data;
};
