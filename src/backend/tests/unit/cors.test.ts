import { buildCorsOptions } from '../../src/lib/cors';

describe('CORS Configuration', () => {
  let originalCorsOrigin: string | undefined;

  beforeEach(() => {
    originalCorsOrigin = process.env.CORS_ORIGIN;
  });

  afterEach(() => {
    if (originalCorsOrigin === undefined) {
      delete process.env.CORS_ORIGIN;
    } else {
      process.env.CORS_ORIGIN = originalCorsOrigin;
    }
  });

  it('should always return credentials: true', () => {
    const options = buildCorsOptions();
    expect(options.credentials).toBe(true);
  });

  it('should use http://localhost:5173 as default origin when CORS_ORIGIN is not set', () => {
    delete process.env.CORS_ORIGIN;
    const options = buildCorsOptions();
    expect(options.origin).toBe('http://localhost:5173');
  });

  it('should read CORS_ORIGIN from env when set', () => {
    process.env.CORS_ORIGIN = 'https://example.com';
    const options = buildCorsOptions();
    expect(options.origin).toBe('https://example.com');
  });

  it('should split comma-separated origins into an array', () => {
    process.env.CORS_ORIGIN = 'https://a.com,https://b.com';
    const options = buildCorsOptions();
    expect(Array.isArray(options.origin)).toBe(true);
    expect(options.origin).toEqual(['https://a.com', 'https://b.com']);
  });

  it('should handle comma-separated origins with spaces', () => {
    process.env.CORS_ORIGIN = 'https://a.com, https://b.com, https://c.com';
    const options = buildCorsOptions();
    expect(Array.isArray(options.origin)).toBe(true);
    expect(options.origin).toEqual(['https://a.com', 'https://b.com', 'https://c.com']);
  });

  it('should return a string for single origin, not an array', () => {
    process.env.CORS_ORIGIN = 'https://single.com';
    const options = buildCorsOptions();
    expect(typeof options.origin).toBe('string');
    expect(options.origin).toBe('https://single.com');
  });

  it('should include expected HTTP methods', () => {
    const options = buildCorsOptions();
    expect(options.methods).toEqual(
      expect.arrayContaining(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']),
    );
  });

  it('should include expected allowed headers', () => {
    const options = buildCorsOptions();
    expect(options.allowedHeaders).toEqual(
      expect.arrayContaining(['Content-Type', 'Authorization', 'X-Request-Id']),
    );
  });
});
