// Configure via Vite env to support different environments without code changes.
// Supports both absolute URLs (http://localhost:3000) and relative paths (/api).
const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api';
const trimmed = rawBaseUrl.replace(/\/+$/, '');
export const API_BASE_URL = trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
