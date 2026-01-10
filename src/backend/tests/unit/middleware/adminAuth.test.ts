import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../../../src/middleware/adminAuth';

describe('Admin Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction = jest.fn();

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

  it('should call next() if correct x-admin-secret is provided', () => {
    mockRequest.headers = {
      'x-admin-secret': 'super-secret-admin-key', // Default value in code
    };

    adminAuth(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('should return 403 if no secret is provided', () => {
    adminAuth(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Forbidden: Invalid Admin Credentials' });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should return 403 if incorrect secret is provided', () => {
    mockRequest.headers = {
      'x-admin-secret': 'wrong-secret',
    };

    adminAuth(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Forbidden: Invalid Admin Credentials' });
    expect(nextFunction).not.toHaveBeenCalled();
  });
});
