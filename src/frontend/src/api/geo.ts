import { API_BASE_URL } from '../config';

export interface AddressSuggestion {
  placeId: number;
  displayName: string;
  lat: string;
  lon: string;
  address: Record<string, string>;
}

export const autocompleteAddress = async (query: string): Promise<AddressSuggestion[]> => {
  const url = `${API_BASE_URL}/addresses/autocomplete?q=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to load address suggestions');
  }

  const json = await response.json();
  return json.data || [];
};
