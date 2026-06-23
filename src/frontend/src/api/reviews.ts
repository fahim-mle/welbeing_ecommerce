import { API_BASE_URL } from '../config';
import { apiFetch } from '../utils/apiFetch';

const jsonHeaders = { 'Content-Type': 'application/json' };

export interface ReviewUser {
  id: number;
  firstName: string;
  lastName: string;
}

export interface ReviewProduct {
  id: number;
  name: string;
}

export interface Review {
  id: number;
  userId: number;
  productId: number;
  rating: number;
  comment?: string | null;
  createdAt: string;
  updatedAt: string;
  user: ReviewUser;
  product?: ReviewProduct;
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
}

export interface ReviewsResponse {
  data: Review[];
  summary: ReviewSummary;
}

export const fetchProductReviews = async (productId: number): Promise<ReviewsResponse> => {
  const response = await apiFetch(`${API_BASE_URL}/products/${productId}/reviews`, {
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch reviews');
  const result = await response.json();
  return { data: result.data ?? [], summary: result.summary ?? { averageRating: 0, totalReviews: 0 } };
};

export const submitProductReview = async (
  productId: number,
  payload: { rating: number; comment?: string },
): Promise<Review> => {
  const response = await apiFetch(`${API_BASE_URL}/products/${productId}/reviews`, {
    method: 'POST',
    headers: jsonHeaders,
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || 'Failed to submit review');
  }
  const result = await response.json();
  return result.data;
};

export const deleteReview = async (reviewId: number): Promise<void> => {
  const response = await apiFetch(`${API_BASE_URL}/reviews/${reviewId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || 'Failed to delete review');
  }
};
