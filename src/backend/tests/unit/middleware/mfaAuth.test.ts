import { Response, NextFunction } from 'express';
import { requireMfaVerified } from '../../../src/middleware/mfaAuth';
import { AuthRequest } from '../../../src/middleware/auth';

const makeReq = (user?: Partial<AuthRequest['user']>): AuthRequest =>
  ({ user } as AuthRequest);

const makeRes = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
};

describe('requireMfaVerified middleware', () => {
  let next: NextFunction;

  beforeEach(() => {
    next = jest.fn();
  });

  it('calls next() when user has no mfaPending flag (fully authenticated)', () => {
    const req = makeReq({ userId: 1, email: 'a@b.com', role: 'USER' });
    const res = makeRes();

    requireMfaVerified(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('calls next() when mfaPending is explicitly false', () => {
    const req = makeReq({ userId: 1, email: 'a@b.com', role: 'USER', mfaPending: false });
    const res = makeRes();

    requireMfaVerified(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 403 with MFA_VERIFICATION_REQUIRED when mfaPending is true', () => {
    const req = makeReq({ userId: 2, email: 'b@c.com', role: 'USER', mfaPending: true });
    const res = makeRes();

    requireMfaVerified(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        message: 'MFA verification required to access this resource',
        code: 'MFA_VERIFICATION_REQUIRED',
      },
    });
  });

  it('calls next() when req.user is undefined (unauthenticated — let authenticate handle it)', () => {
    // requireMfaVerified only blocks mfaPending tokens; missing user is the
    // responsibility of the authenticate middleware that runs before it.
    const req = makeReq(undefined);
    const res = makeRes();

    requireMfaVerified(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
