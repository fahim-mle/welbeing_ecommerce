// Configure via Vite env to support different environments without code changes.
// We normalize to ensure the returned value includes the `/api` prefix.
//
// Examples:
// - VITE_API_BASE_URL=http://localhost:3000      -> http://localhost:3000/api
// - VITE_API_BASE_URL=http://localhost:3000/api  -> http://localhost:3000/api
const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3000';
const trimmed = rawBaseUrl.replace(/\/+$/, '');
export const API_BASE_URL = trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
