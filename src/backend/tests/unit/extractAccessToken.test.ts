import { extractAccessToken } from '../../src/lib/auth';
import { COOKIE_NAMES } from '../../src/lib/cookie';

const mockRequest = (cookies?: Record<string, string>, authHeader?: string) => ({
  cookies,
  headers: {
    authorization: authHeader,
  },
} as any);

describe('extractAccessToken', () => {
  it('should return token from cookie when present', () => {
    const req = mockRequest({ [COOKIE_NAMES.ACCESS_TOKEN]: 'cookie-token' });
    const token = extractAccessToken(req);
    expect(token).toBe('cookie-token');
  });

  it('should return token from Bearer header when no cookie', () => {
    const req = mockRequest(undefined, 'Bearer header-token');
    const token = extractAccessToken(req);
    expect(token).toBe('header-token');
  });

  it('should prioritize cookie over Bearer header', () => {
    const req = mockRequest(
      { [COOKIE_NAMES.ACCESS_TOKEN]: 'cookie-token' },
      'Bearer header-token'
    );
    const token = extractAccessToken(req);
    expect(token).toBe('cookie-token');
  });

  it('should return undefined when neither cookie nor header present', () => {
    const req = mockRequest();
    const token = extractAccessToken(req);
    expect(token).toBeUndefined();
  });

  it('should return undefined for malformed Bearer header', () => {
    const req = mockRequest(undefined, 'Basic xyz');
    const token = extractAccessToken(req);
    expect(token).toBeUndefined();
  });

  it('should return undefined when cookies object is undefined', () => {
    const req = mockRequest(undefined, undefined);
    const token = extractAccessToken(req);
    expect(token).toBeUndefined();
  });

  it('should return empty string for Bearer header with no token', () => {
    const req = mockRequest(undefined, 'Bearer ');
    const token = extractAccessToken(req);
    expect(token).toBe('');
  });

  it('should return undefined when authorization header is not Bearer', () => {
    const req = mockRequest(undefined, 'Token abc123');
    const token = extractAccessToken(req);
    expect(token).toBeUndefined();
  });

  it('should handle empty cookies object', () => {
    const req = mockRequest({}, undefined);
    const token = extractAccessToken(req);
    expect(token).toBeUndefined();
  });
});
