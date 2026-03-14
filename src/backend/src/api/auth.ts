import { Router, Request, Response } from 'express';
import { userService } from '../services/userService';
import { auth } from '../lib/auth';
import { logger } from '../lib/logger';
import { validateBody } from '../middleware/validation';
import { prisma } from '../lib/prisma';
import {
  loginSchema,
  oauthSchema,
  registerSchema,
  resetPasswordRequestSchema,
  resetPasswordSchema,
  verifyEmailRequestSchema,
} from '../schemas/auth';
import { emailService } from '../lib/email';
import { accessTokenCookie, baseCookieOptions, refreshTokenCookie, COOKIE_NAMES } from '../lib/cookie';

const router = Router();

const maskEmail = (value: unknown) => {
  if (typeof value !== 'string') {
    return 'unknown';
  }

  const [localPart, domain] = value.split('@');
  if (!localPart || !domain) {
    return 'unknown';
  }

  if (localPart.length <= 2) {
    return `${localPart[0] ?? '*'}***@${domain}`;
  }

  return `${localPart.slice(0, 2)}***@${domain}`;
};

const createAccessToken = (user: { id: number; email: string; role: string }) => {
  return auth.generateToken({ userId: user.id, email: user.email, role: user.role }, '15m');
};

/** Write both auth cookies onto the response. */
const setAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
  res.cookie(COOKIE_NAMES.ACCESS_TOKEN, accessToken, accessTokenCookie());
  res.cookie(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, refreshTokenCookie());
};

/** Clear both auth cookies (used on logout and invalid-token paths). */
const clearAuthCookies = (res: Response) => {
  res.clearCookie(COOKIE_NAMES.ACCESS_TOKEN, baseCookieOptions());
  res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, baseCookieOptions());
};

// POST /api/auth/register
router.post('/register', validateBody(registerSchema), async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    const existingUser = await userService.findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const passwordHash = await auth.hashPassword(password);
    const { user } = await userService.createUserWithIdentity(
      email,
      firstName || 'User',
      lastName || 'User',
      'EMAIL',
      email,
      passwordHash
    );

    await userService.linkGuestOrders(user.email, user.id);

    const accessToken = createAccessToken({ id: user.id, email: user.email, role: user.role });
    const refreshToken = await userService.createRefreshToken(user.id);
    const verification = await userService.createEmailVerificationToken(user.id);
    await emailService.sendVerificationEmail(user.email, verification.token);

    setAuthCookies(res, accessToken, refreshToken.token);
    res.status(201).json({
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (error) {
    const requestId = (req as Request & { requestId?: string }).requestId;
    logger.error('Registration failed', { requestId, error, email: maskEmail(req.body?.email) });
    res.status(500).json({ message: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', validateBody(loginSchema), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const identity = await userService.findIdentity('EMAIL', email);

    if (!identity || !identity.passwordHash) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValid = await auth.comparePassword(password, identity.passwordHash);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = identity.user;
    await userService.linkGuestOrders(user.email, user.id);

    // Check if user has MFA enabled
    const userWithMfa = await prisma.user.findUnique({
      where: { id: user.id },
      select: { mfaEnabled: true },
    });

    if (userWithMfa?.mfaEnabled) {
      // Generate temporary MFA token (5 min expiry) - no cookies set yet
      const mfaToken = auth.generateToken(
        { userId: user.id, email: user.email, role: user.role, mfaPending: true },
        '5m'
      );
      
      return res.status(200).json({
        mfaRequired: true,
        mfaToken,
      });
    }

    // Normal flow for non-MFA users
    const accessToken = createAccessToken({ id: user.id, email: user.email, role: user.role });
    const refreshToken = await userService.createRefreshToken(user.id);

    setAuthCookies(res, accessToken, refreshToken.token);
    res.json({
      user: { id: user.id, email: user.email, role: user.role, isVerified: identity.isVerified },
    });
  } catch (error) {
    const requestId = (req as Request & { requestId?: string }).requestId;
    logger.error('Login failed', { requestId, error, email: maskEmail(req.body?.email) });
    res.status(500).json({ message: 'Login failed' });
  }
});

// POST /api/auth/refresh-token
// Reads the refresh token from the httpOnly cookie — no body required.
router.post('/refresh-token', async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN];
    if (!refreshToken) {
      return res.status(401).json({ message: 'Missing refresh token' });
    }

    const rotated = await userService.rotateRefreshToken(refreshToken);
    if (!rotated) {
      clearAuthCookies(res);
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const user = await userService.findUserById(rotated.userId);
    if (!user) {
      clearAuthCookies(res);
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const accessToken = createAccessToken({ id: user.id, email: user.email, role: user.role });
    setAuthCookies(res, accessToken, rotated.token);
    res.json({ user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    const requestId = (req as Request & { requestId?: string }).requestId;
    logger.error('Refresh token failed', { requestId, error });
    res.status(500).json({ message: 'Refresh token failed' });
  }
});

// POST /api/auth/logout
// Reads the refresh token from the httpOnly cookie to revoke it server-side.
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN];
    if (refreshToken) {
      await userService.revokeRefreshToken(refreshToken);
    }
    clearAuthCookies(res);
    res.json({ success: true });
  } catch (error) {
    const requestId = (req as Request & { requestId?: string }).requestId;
    logger.error('Logout failed', { requestId, error });
    // Clear cookies even on error so the client is not left in a broken state.
    clearAuthCookies(res);
    res.status(500).json({ message: 'Logout failed' });
  }
});

// POST /api/auth/verify-email
router.post('/verify-email', validateBody(verifyEmailRequestSchema), async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await userService.findUserByEmail(email);
    if (user) {
      const verification = await userService.createEmailVerificationToken(user.id);
      await emailService.sendVerificationEmail(user.email, verification.token);
    }

    res.json({ success: true });
  } catch (error) {
    const requestId = (req as Request & { requestId?: string }).requestId;
    logger.error('Verify email request failed', { requestId, error });
    res.status(500).json({ message: 'Verify email request failed' });
  }
});

// GET /api/auth/verify-email/:token
router.get('/verify-email/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const userId = await userService.verifyEmailToken(token);
    if (!userId) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    res.json({ success: true });
  } catch (error) {
    const requestId = (req as Request & { requestId?: string }).requestId;
    logger.error('Verify email failed', { requestId, error });
    res.status(500).json({ message: 'Verify email failed' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', validateBody(resetPasswordRequestSchema), async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const reset = await userService.createPasswordResetToken(email);
    if (reset) {
      await emailService.sendPasswordResetEmail(reset.user.email, reset.token);
    }

    res.json({ success: true });
  } catch (error) {
    const requestId = (req as Request & { requestId?: string }).requestId;
    logger.error('Password reset request failed', { requestId, error });
    res.status(500).json({ message: 'Password reset request failed' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', validateBody(resetPasswordSchema), async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;
    const userId = await userService.resetPassword(token, password);
    if (!userId) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    res.json({ success: true });
  } catch (error) {
    const requestId = (req as Request & { requestId?: string }).requestId;
    logger.error('Reset password failed', { requestId, error });
    res.status(500).json({ message: 'Reset password failed' });
  }
});

// POST /api/auth/oauth/:provider
router.post('/oauth/:provider', validateBody(oauthSchema), async (req: Request, res: Response) => {
  try {
    const provider = req.params.provider.toUpperCase();
    if (!['GOOGLE', 'GITHUB'].includes(provider)) {
      return res.status(400).json({ message: 'Unsupported provider' });
    }

    const { providerToken, email, firstName, lastName } = req.body;
    const providerId = providerToken;

    const existingIdentity = await userService.findIdentity(provider, providerId);
    let user = existingIdentity?.user ?? null;

    if (!existingIdentity) {
      const existingUser = await userService.findUserByEmail(email);
      if (existingUser) {
        user = existingUser;
        await userService.createIdentity(user.id, provider, providerId, undefined, {
          isVerified: true,
          verifiedAt: new Date(),
        });
      } else {
        const created = await userService.createUserWithIdentity(
          email,
          firstName || 'User',
          lastName || 'User',
          provider,
          providerId,
          undefined
        );
        user = created.user;
        await userService.markIdentityVerified(user.id, provider);
      }
    }

    if (!user) {
      return res.status(500).json({ message: 'Unable to process social login' });
    }

    const accessToken = createAccessToken({ id: user.id, email: user.email, role: user.role });
    const refreshToken = await userService.createRefreshToken(user.id);

    setAuthCookies(res, accessToken, refreshToken.token);
    res.json({
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (error) {
    const requestId = (req as Request & { requestId?: string }).requestId;
    logger.error('Social login failed', { requestId, error });
    res.status(500).json({ message: 'Social login failed' });
  }
});

// GET /api/auth/me
// Cookie-based session bootstrap: verifies the access_token cookie and returns
// the current user. Called on page load so the frontend can restore auth state
// without touching localStorage.
router.get('/me', async (req: Request, res: Response) => {
  try {
    const accessToken = req.cookies?.[COOKIE_NAMES.ACCESS_TOKEN];
    if (!accessToken) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const decoded = auth.verifyToken(accessToken);
    const user = await userService.findUserById(decoded.userId);
    if (!user) {
      clearAuthCookies(res);
      return res.status(401).json({ message: 'User not found' });
    }

    res.json({
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch {
    clearAuthCookies(res);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
});

export default router;
