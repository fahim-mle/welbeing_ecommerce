import { authenticate, AuthRequest } from '../../src/middleware/auth';
import { adminAuth } from '../../src/middleware/adminAuth';
import { auth } from '../../src/lib/auth';
import { COOKIE_NAMES } from '../../src/lib/cookie';

const mockReq = (cookies?: Record<string, string>, authHeader?: string) => ({
  cookies,
  headers: { authorization: authHeader },
} as any);

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = () => jest.fn();

const validUserToken = auth.generateToken(
  { userId: 1, email: 'user@test.com', role: 'USER' },
  '1h'
);
const validAdminToken = auth.generateToken(
  { userId: 2, email: 'admin@test.com', role: 'ADMIN' },
  '1h'
);

describe('authenticate middleware', () => {
  it('should call next() with valid cookie token', () => {
    const req = mockReq({ [COOKIE_NAMES.ACCESS_TOKEN]: validUserToken });
    const res = mockRes();
    const next = mockNext();

    authenticate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect((req as AuthRequest).user).toBeDefined();
    expect((req as AuthRequest).user?.userId).toBe(1);
  });

  it('should call next() with valid Bearer header token', () => {
    const req = mockReq(undefined, `Bearer ${validUserToken}`);
    const res = mockRes();
    const next = mockNext();

    authenticate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect((req as AuthRequest).user).toBeDefined();
    expect((req as AuthRequest).user?.email).toBe('user@test.com');
  });

  it('should return 401 when no token present', () => {
    const req = mockReq();
    const res = mockRes();
    const next = mockNext();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 for expired/invalid token', () => {
    const req = mockReq({ [COOKIE_NAMES.ACCESS_TOKEN]: 'invalid-token' });
    const res = mockRes();
    const next = mockNext();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should set req.user with correct payload', () => {
    const req = mockReq({ [COOKIE_NAMES.ACCESS_TOKEN]: validUserToken });
    const res = mockRes();
    const next = mockNext();

    authenticate(req, res, next);

    expect((req as AuthRequest).user).toBeDefined();
    expect((req as AuthRequest).user?.userId).toBe(1);
    expect((req as AuthRequest).user?.email).toBe('user@test.com');
    expect((req as AuthRequest).user?.role).toBe('USER');
  });

  it('should prioritize cookie over header', () => {
    const req = mockReq(
      { [COOKIE_NAMES.ACCESS_TOKEN]: validAdminToken },
      `Bearer ${validUserToken}`
    );
    const res = mockRes();
    const next = mockNext();

    authenticate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect((req as AuthRequest).user?.role).toBe('ADMIN');
  });
});

describe('adminAuth middleware', () => {
  it('should call next() with valid admin cookie token', () => {
    const req = mockReq({ [COOKIE_NAMES.ACCESS_TOKEN]: validAdminToken });
    const res = mockRes();
    const next = mockNext();

    adminAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 403 for non-admin token', () => {
    const req = mockReq({ [COOKIE_NAMES.ACCESS_TOKEN]: validUserToken });
    const res = mockRes();
    const next = mockNext();

    adminAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Forbidden: Admin access only',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when no token present', () => {
    const req = mockReq();
    const res = mockRes();
    const next = mockNext();

    adminAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Unauthorized: Missing token',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 for invalid token', () => {
    const req = mockReq({ [COOKIE_NAMES.ACCESS_TOKEN]: 'bad-token' });
    const res = mockRes();
    const next = mockNext();

    adminAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Unauthorized: Invalid token',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should prioritize cookie over header (admin access granted)', () => {
    const req = mockReq(
      { [COOKIE_NAMES.ACCESS_TOKEN]: validAdminToken },
      `Bearer ${validUserToken}`
    );
    const res = mockRes();
    const next = mockNext();

    adminAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should set req.user with admin payload', () => {
    const req = mockReq({ [COOKIE_NAMES.ACCESS_TOKEN]: validAdminToken });
    const res = mockRes();
    const next = mockNext();

    adminAuth(req, res, next);

    expect((req as any).user).toBeDefined();
    expect((req as any).user.userId).toBe(2);
    expect((req as any).user.email).toBe('admin@test.com');
    expect((req as any).user.role).toBe('ADMIN');
  });
});
