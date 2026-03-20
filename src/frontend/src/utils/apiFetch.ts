import { API_BASE_URL } from '../config';

/**
 * Wraps fetch with automatic token-refresh on 401.
 *
 * Flow:
 *  1. Make the request.
 *  2. If the response is 401, call /auth/refresh-token (which rotates the
 *     httpOnly cookie pair server-side).
 *  3. If refresh succeeds, retry the original request once.
 *  4. If refresh fails (refresh token expired / revoked), dispatch the
 *     'auth:expired' event so AuthContext can force-logout the user.
 *
 * Multiple concurrent 401s share a single in-flight refresh call so we
 * never send more than one refresh request at a time.
 */

let refreshPromise: Promise<boolean> | null = null;

const tryRefresh = (): Promise<boolean> => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = fetch(`${API_BASE_URL}/auth/refresh-token`, {
    method: 'POST',
    credentials: 'include',
  })
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
};

export const apiFetch = async (
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> => {
  const res = await fetch(input, { credentials: 'include', ...init });

  if (res.status !== 401) return res;

  const refreshed = await tryRefresh();

  if (!refreshed) {
    window.dispatchEvent(new Event('auth:expired'));
    return res;
  }

  // Retry with the fresh access-token cookie
  return fetch(input, { credentials: 'include', ...init });
};
