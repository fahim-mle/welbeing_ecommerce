import { API_BASE_URL } from '../config';

export interface Address {
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
  isDefault?: boolean;
}

export const fetchAddresses = async (token: string): Promise<Address[]> => {
  const response = await fetch(`${API_BASE_URL}/addresses`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch addresses');
  }

  const result = await response.json();
  return result.data;
};

export const createAddress = async (payload: Omit<Address, 'id'>, token: string): Promise<Address> => {
  const response = await fetch(`${API_BASE_URL}/addresses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.message || 'Failed to create address');
  }

  const result = await response.json();
  return result.data;
};
