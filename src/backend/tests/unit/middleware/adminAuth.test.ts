import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../../../src/middleware/adminAuth';
import { auth } from '../../../src/lib/auth';

jest.mock('../../../src/lib/auth');

describe('Admin Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    nextFunction = jest.fn();
  });

  it('should call next() if token is valid and role is ADMIN', () => {
    mockRequest.headers = {
        authorization: 'Bearer valid-admin-token'
    };
    (auth.verifyToken as jest.Mock).mockReturnValue({ role: 'ADMIN' });

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
    mockRequest.headers = {
        authorization: 'Bearer user-token'
    };
    (auth.verifyToken as jest.Mock).mockReturnValue({ role: 'USER' });

    adminAuth(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(403);
  });

  it('should return 401 if token is invalid', () => {
    mockRequest.headers = {
        authorization: 'Bearer invalid-token'
    };
    (auth.verifyToken as jest.Mock).mockImplementation(() => { throw new Error('Invalid token'); });

    adminAuth(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
  });
});
