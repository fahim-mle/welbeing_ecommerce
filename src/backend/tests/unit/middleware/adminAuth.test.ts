import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../../../src/middleware/adminAuth';
import { auth } from '../../../src/lib/auth';
import { COOKIE_NAMES } from '../../../src/lib/cookie';

// Mock prisma so the unit test has no DB dependency
jest.mock('../../../src/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

import { prisma } from '../../../src/lib/prisma';

const mockFindUnique = prisma.user.findUnique as jest.Mock;

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
  const mfaPendingAdminToken = auth.generateToken(
    { userId: 3, email: 'mfa-admin@test.com', role: 'ADMIN', mfaPending: true },
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
    jest.clearAllMocks();
  });

  it('should call next() if token is valid, role is ADMIN, and MFA is not enabled', async () => {
    mockFindUnique.mockResolvedValue({ mfaEnabled: false });
    mockRequest.cookies = {
      [COOKIE_NAMES.ACCESS_TOKEN]: validAdminToken,
    };

    await adminAuth(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('should call next() if admin has MFA enabled and token has no mfaPending flag', async () => {
    // MFA is enrolled but the user has already completed the TOTP step —
    // the issued token does not carry mfaPending.
    mockFindUnique.mockResolvedValue({ mfaEnabled: true });
    mockRequest.cookies = {
      [COOKIE_NAMES.ACCESS_TOKEN]: validAdminToken,
    };

    await adminAuth(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('should return 403 with MFA_VERIFICATION_REQUIRED if admin has MFA enabled and token has mfaPending: true', async () => {
    mockFindUnique.mockResolvedValue({ mfaEnabled: true });
    mockRequest.cookies = {
      [COOKIE_NAMES.ACCESS_TOKEN]: mfaPendingAdminToken,
    };

    await adminAuth(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: {
        message: 'MFA verification required',
        code: 'MFA_VERIFICATION_REQUIRED',
      },
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should call next() if user record not found in DB (token still valid)', async () => {
    // User may have been deleted after the token was issued — allow through.
    mockFindUnique.mockResolvedValue(null);
    mockRequest.cookies = {
      [COOKIE_NAMES.ACCESS_TOKEN]: validAdminToken,
    };

    await adminAuth(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('should forward database errors to next() rather than returning 401', async () => {
    // Issue #5: a Prisma error must not be swallowed as a 401. It should be
    // forwarded to the global error handler via next(err).
    const dbError = new Error('Connection refused');
    mockFindUnique.mockRejectedValue(dbError);
    mockRequest.cookies = {
      [COOKIE_NAMES.ACCESS_TOKEN]: validAdminToken,
    };

    await adminAuth(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledWith(dbError);
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('should return 401 if no token provided', async () => {
    await adminAuth(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringMatching(/missing/i) })
    );
  });

  it('should return 403 if role is not ADMIN', async () => {
    mockRequest.cookies = {
      [COOKIE_NAMES.ACCESS_TOKEN]: validUserToken,
    };

    await adminAuth(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(403);
  });

  it('should return 401 if token is invalid', async () => {
    mockRequest.cookies = {
      [COOKIE_NAMES.ACCESS_TOKEN]: 'invalid-token',
    };

    await adminAuth(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
  });
});
