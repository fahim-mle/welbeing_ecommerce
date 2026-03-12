import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../../../src/middleware/adminAuth';
import { auth } from '../../../src/lib/auth';
import { COOKIE_NAMES } from '../../../src/lib/cookie';

describe('Admin Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  const validAdminToken = auth.generateToken(
    { userId: 1, email: 'admin@test.com', role: 'ADMIN' },
    '1h'
  );
  const validUserToken = auth.generateToken(
    { userId: 2, email: 'user@test.com', role: 'USER' },
    '1h'
  );

  beforeEach(() => {
    mockRequest = {
      headers: {},
      cookies: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    nextFunction = jest.fn();
  });

  it('should call next() if token is valid and role is ADMIN', () => {
    mockRequest.cookies = {
      [COOKIE_NAMES.ACCESS_TOKEN]: validAdminToken,
    };

    adminAuth(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('should return 401 if no token provided', () => {
    adminAuth(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringMatching(/missing/i) }));
  });

  it('should return 403 if role is not ADMIN', () => {
    mockRequest.cookies = {
      [COOKIE_NAMES.ACCESS_TOKEN]: validUserToken,
    };

    adminAuth(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(403);
  });

  it('should return 401 if token is invalid', () => {
    mockRequest.cookies = {
      [COOKIE_NAMES.ACCESS_TOKEN]: 'invalid-token',
    };

    adminAuth(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
  });
});
