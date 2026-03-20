import { baseCookieOptions, accessTokenCookie, refreshTokenCookie, COOKIE_NAMES } from '../../src/lib/cookie';

describe('Cookie Configuration', () => {
  let originalNodeEnv: string | undefined;

  beforeEach(() => {
    originalNodeEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  describe('baseCookieOptions', () => {
    it('should always return httpOnly: true', () => {
      const options = baseCookieOptions();
      expect(options.httpOnly).toBe(true);
    });

    it('should return secure: false when NODE_ENV is not production', () => {
      process.env.NODE_ENV = 'development';
      const options = baseCookieOptions();
      expect(options.secure).toBe(false);
    });

    it('should return secure: false when NODE_ENV is test', () => {
      process.env.NODE_ENV = 'test';
      const options = baseCookieOptions();
      expect(options.secure).toBe(false);
    });

    it('should return secure: true when NODE_ENV is production', () => {
      process.env.NODE_ENV = 'production';
      const options = baseCookieOptions();
      expect(options.secure).toBe(true);
    });

    it('should return sameSite: lax in development', () => {
      process.env.NODE_ENV = 'development';
      const options = baseCookieOptions();
      expect(options.sameSite).toBe('lax');
    });

    it('should return sameSite: strict in production', () => {
      process.env.NODE_ENV = 'production';
      const options = baseCookieOptions();
      expect(options.sameSite).toBe('strict');
    });

    it('should always return path: /', () => {
      const options = baseCookieOptions();
      expect(options.path).toBe('/');
    });
  });

  describe('accessTokenCookie', () => {
    it('should have maxAge of 1 hour', () => {
      const options = accessTokenCookie();
      expect(options.maxAge).toBe(60 * 60 * 1000);
    });

    it('should inherit base cookie options', () => {
      process.env.NODE_ENV = 'production';
      const options = accessTokenCookie();
      expect(options.httpOnly).toBe(true);
      expect(options.secure).toBe(true);
      expect(options.sameSite).toBe('strict');
      expect(options.path).toBe('/');
    });
  });

  describe('refreshTokenCookie', () => {
    it('should have maxAge of 7 days', () => {
      const options = refreshTokenCookie();
      expect(options.maxAge).toBe(7 * 24 * 60 * 60 * 1000);
    });

    it('should inherit base cookie options', () => {
      process.env.NODE_ENV = 'development';
      const options = refreshTokenCookie();
      expect(options.httpOnly).toBe(true);
      expect(options.secure).toBe(false);
      expect(options.sameSite).toBe('lax');
      expect(options.path).toBe('/');
    });
  });

  describe('COOKIE_NAMES', () => {
    it('should have ACCESS_TOKEN and REFRESH_TOKEN keys', () => {
      expect(COOKIE_NAMES.ACCESS_TOKEN).toBe('access_token');
      expect(COOKIE_NAMES.REFRESH_TOKEN).toBe('refresh_token');
    });
  });
});
