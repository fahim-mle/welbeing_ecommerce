const API_BASE_URL = 'http://localhost:3000/api';

export interface OrderItemPayload {
  product_id: number;
  quantity: number;
}

export interface OrderPayload {
  guest_email: string;
  items: OrderItemPayload[];
  shipping_address: string;
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

export const createOrder = async (payload: OrderPayload): Promise<OrderResponse> => {
  const response = await fetch(`${API_BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.error || 'Failed to create order');
  }

  const result = await response.json();
  return result.data;
};
