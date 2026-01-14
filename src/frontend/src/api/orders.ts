import { API_BASE_URL } from '../config';

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
  guest_email?: string;
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
}

export interface OrderResponse {
  id: number;
  guestEmail: string;
  status: string;
  totalPrice: string;
  shippingAddress: string;
  createdAt: string;
  items: OrderItemResponse[];
}

export const createOrder = async (payload: OrderPayload, token?: string): Promise<OrderResponse> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/orders`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.error || 'Failed to create order');
  }

  const result = await response.json();
  return result.data;
};

export const fetchMyOrders = async (token: string): Promise<OrderResponse[]> => {
    const response = await fetch(`${API_BASE_URL}/orders`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    
    if (!response.ok) {
        throw new Error('Failed to fetch orders');
    }
    
    const result = await response.json();
    return result.data;
};
