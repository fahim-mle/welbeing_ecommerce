// Shared types between frontend and backend

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
}
