import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireMfaVerified } from '../middleware/mfaAuth';
import { adminAuth } from '../middleware/adminAuth';
import { validateBody } from '../middleware/validation';
import {
  verifyEnrollmentSchema,
  verifyMfaLoginSchema,
  verifyBackupCodeSchema,
  resetMfaSchema,
} from '../schemas/auth';
import {
  generateTotpSecret,
  generateQrCode,
  verifyTotpToken,
  generateBackupCodes,
  hashBackupCode,
  verifyBackupCode,
} from '../lib/mfa';
import { auth, TokenPayload } from '../lib/auth';
import { createAccessToken, setAuthCookies } from './auth';
import { userService } from '../services/userService';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

const router = Router();

/**
 * Decode and validate a short-lived MFA pending token.
 * Returns the payload only when the token is valid and carries `mfaPending: true`.
 * Any other token (expired, tampered, or a regular access token) returns null.
 */
const verifyMfaToken = (mfaToken: string): TokenPayload | null => {
  try {
    const decoded = auth.verifyToken(mfaToken);
    if (!decoded.mfaPending) {
      return null;
    }
    return decoded;
  } catch {
    // Covers expired, invalid signature, malformed JWT, etc.
    return null;
  }
};

// ─── Unauthenticated MFA login endpoints ────────────────────────────────────
// These two endpoints intentionally sit BEFORE the router.use(authenticate)
// call below. They accept a short-lived mfaToken (issued by POST /api/auth/login)
// instead of a full session cookie.

// POST /api/auth/mfa/verify
// Completes the MFA login flow using a TOTP code.
router.post(
  '/verify',
  validateBody(verifyMfaLoginSchema),
  async (req: Request, res: Response) => {
    const { mfaToken, token } = req.body as { mfaToken: string; token: string };

    const payload = verifyMfaToken(mfaToken);
    if (!payload) {
      return res.status(401).json({ message: 'Invalid or expired MFA token' });
    }

    const { userId } = payload;

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, role: true, mfaSecret: true, mfaEnabled: true },
      });

      // Guard: user must exist and have MFA fully enrolled.
      if (!user || !user.mfaEnabled || !user.mfaSecret) {
        return res.status(401).json({ message: 'Invalid or expired MFA token' });
      }

      const isValid = verifyTotpToken(token, user.mfaSecret);
      if (!isValid) {
        logger.warn('MFA TOTP verification failed', { userId });
        return res.status(401).json({ message: 'Invalid TOTP code' });
      }

      // Link any guest orders placed before login — deferred until MFA is
      // fully verified so we never associate orders with an unverified identity.
      await userService.linkGuestOrders(user.email, user.id);

      const accessToken = createAccessToken({ id: user.id, email: user.email, role: user.role });
      const refreshToken = await userService.createRefreshToken(user.id);

      setAuthCookies(res, accessToken, refreshToken.token);

      logger.info('MFA TOTP login successful', { userId });
      return res.status(200).json({ user: { id: user.id, email: user.email, role: user.role } });
    } catch (error) {
      logger.error('MFA TOTP verification error', { userId, error });
      return res.status(500).json({ message: 'MFA verification failed' });
    }
  },
);

// POST /api/auth/mfa/verify-backup-code
// Completes the MFA login flow using a one-time backup code.
router.post(
  '/verify-backup-code',
  validateBody(verifyBackupCodeSchema),
  async (req: Request, res: Response) => {
    const { mfaToken, code } = req.body as { mfaToken: string; code: string };

    const payload = verifyMfaToken(mfaToken);
    if (!payload) {
      return res.status(401).json({ message: 'Invalid or expired MFA token' });
    }

    const { userId } = payload;

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, role: true, mfaEnabled: true },
      });

      if (!user || !user.mfaEnabled) {
        return res.status(401).json({ message: 'Invalid or expired MFA token' });
      }

      // Fetch only unused backup codes to limit the comparison set.
      const backupCodes = await prisma.mfaBackupCode.findMany({
        where: { userId, usedAt: null },
      });

      // Linear scan: compare the submitted code against each stored hash.
      // The set is small (≤10) so this is acceptable. bcrypt.compare is
      // constant-time, preventing timing attacks. We await each comparison
      // sequentially to avoid leaking timing information via Promise.race.
      let matched: (typeof backupCodes)[number] | undefined;
      for (const bc of backupCodes) {
        if (await verifyBackupCode(code, bc.codeHash)) {
          matched = bc;
          break;
        }
      }

      if (!matched) {
        logger.warn('MFA backup code verification failed', { userId });
        return res.status(401).json({ message: 'Invalid backup code' });
      }

      // Consume the code atomically so it cannot be reused.
      await prisma.mfaBackupCode.update({
        where: { id: matched.id },
        data: { usedAt: new Date() },
      });

      // Link any guest orders placed before login — deferred until MFA is
      // fully verified so we never associate orders with an unverified identity.
      await userService.linkGuestOrders(user.email, user.id);

      const accessToken = createAccessToken({ id: user.id, email: user.email, role: user.role });
      const refreshToken = await userService.createRefreshToken(user.id);

      setAuthCookies(res, accessToken, refreshToken.token);

      logger.info('MFA backup code login successful', { userId, backupCodeId: matched.id });
      return res.status(200).json({ user: { id: user.id, email: user.email, role: user.role } });
    } catch (error) {
      logger.error('MFA backup code verification error', { userId, error });
      return res.status(500).json({ message: 'MFA verification failed' });
    }
  },
);

// ─── Admin MFA management endpoints ──────────────────────────────────────────
// These endpoints use adminAuth directly so they are independent of the
// router-level authenticate middleware applied below.

/**
 * POST /api/auth/mfa/reset
 * Resets a target user's MFA configuration entirely.
 * Restricted to ADMIN role — intended for emergency account recovery.
 */
router.post(
  '/reset',
  adminAuth,
  validateBody(resetMfaSchema),
  async (req: Request, res: Response) => {
    const { userId } = req.body as { userId: number };
    const adminUser = (req as AuthRequest).user!;

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true },
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Delete backup codes and clear MFA fields atomically.
      await prisma.$transaction([
        prisma.mfaBackupCode.deleteMany({ where: { userId } }),
        prisma.user.update({
          where: { id: userId },
          data: {
            mfaEnabled: false,
            mfaSecret: null,
            mfaEnrolledAt: null,
          },
        }),
      ]);

      // Audit log: record both the acting admin and the affected user.
      logger.warn('MFA reset by admin', {
        targetUserId: userId,
        targetEmail: user.email,
        adminUserId: adminUser.userId,
        adminEmail: adminUser.email,
      });

      return res.status(200).json({ success: true, message: 'MFA reset successful' });
    } catch (error) {
      logger.error('MFA reset failed', { userId, error });
      return res.status(500).json({ message: 'MFA reset failed' });
    }
  },
);

// ─── Authenticated MFA management endpoints ──────────────────────────────────
// All routes below this line require a valid session cookie.
router.use(authenticate);

// POST /api/auth/mfa/enroll
// Generates a fresh TOTP secret and QR code for the authenticated user.
// The secret is persisted immediately (mfaEnabled stays false) so that
// verify-enrollment can confirm the correct secret was scanned.
router.post('/enroll', requireMfaVerified, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, mfaEnabled: true },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.mfaEnabled) {
      return res.status(400).json({ message: 'MFA already enabled' });
    }

    const secret = generateTotpSecret();

    // Persist the secret before returning it so verify-enrollment can use it.
    // mfaEnabled remains false until the user proves they can generate a valid code.
    await prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: secret },
    });

    const qrCode = await generateQrCode(user.email, secret);

    logger.info('MFA enrollment initiated', { userId });
    return res.status(200).json({ secret, qrCode });
  } catch (error) {
    logger.error('MFA enroll failed', { userId, error });
    return res.status(500).json({ message: 'MFA enrollment failed' });
  }
});

// POST /api/auth/mfa/verify-enrollment
// Confirms the TOTP code from the authenticator app, activates MFA, and
// returns one-time plaintext backup codes (hashed copies stored in DB).
router.post(
  '/verify-enrollment',
  requireMfaVerified,
  validateBody(verifyEnrollmentSchema),
  async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { token } = req.body as { token: string };

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, mfaSecret: true, mfaEnabled: true },
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Enrollment is only valid when a secret exists but MFA is not yet active.
      if (!user.mfaSecret || user.mfaEnabled) {
        return res.status(400).json({ message: 'Invalid enrollment state' });
      }

      const isValid = verifyTotpToken(token, user.mfaSecret);
      if (!isValid) {
        return res.status(401).json({ message: 'Invalid TOTP code' });
      }

      const plaintextCodes = generateBackupCodes(10);

      // Hash all codes before the transaction — bcrypt is async.
      const hashedCodes = await Promise.all(plaintextCodes.map((c) => hashBackupCode(c)));

      // Activate MFA and store hashed backup codes atomically.
      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: { mfaEnabled: true, mfaEnrolledAt: new Date() },
        }),
        prisma.mfaBackupCode.createMany({
          data: hashedCodes.map((codeHash) => ({ userId, codeHash })),
        }),
      ]);

      logger.info('MFA enrollment verified and activated', { userId });
      // Backup codes are returned once in plaintext — the user must save them now.
      return res.status(200).json({ success: true, backupCodes: plaintextCodes });
    } catch (error) {
      logger.error('MFA verify-enrollment failed', { userId, error });
      return res.status(500).json({ message: 'MFA verification failed' });
    }
  },
);

// GET /api/auth/mfa/status
// Returns the current MFA enrollment state for the authenticated user.
router.get('/status', requireMfaVerified, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { mfaEnabled: true, mfaEnrolledAt: true },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
      mfaEnabled: user.mfaEnabled,
      mfaEnrolledAt: user.mfaEnrolledAt?.toISOString() ?? null,
    });
  } catch (error) {
    logger.error('MFA status check failed', { userId, error });
    return res.status(500).json({ message: 'MFA status check failed' });
  }
});

/**
 * POST /api/auth/mfa/regenerate-backup-codes
 * Replaces all existing backup codes with a fresh set of 10.
 * The plaintext codes are returned once — the user must save them immediately.
 * Requires MFA to already be enabled; otherwise there is nothing to protect.
 */
router.post('/regenerate-backup-codes', requireMfaVerified, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { mfaEnabled: true },
    });

    if (!user?.mfaEnabled) {
      return res.status(400).json({ message: 'MFA not enabled' });
    }

    const plaintextCodes = generateBackupCodes(10);

    // Hash all codes before the transaction — bcrypt is async.
    const hashedCodes = await Promise.all(plaintextCodes.map((c) => hashBackupCode(c)));

    // Delete old codes and insert new ones atomically so there is never a
    // window where the user has no valid backup codes.
    await prisma.$transaction([
      prisma.mfaBackupCode.deleteMany({ where: { userId } }),
      prisma.mfaBackupCode.createMany({
        data: hashedCodes.map((codeHash) => ({ userId, codeHash })),
      }),
    ]);

    logger.info('MFA backup codes regenerated', { userId });
    return res.status(200).json({ backupCodes: plaintextCodes });
  } catch (error) {
    logger.error('MFA backup code regeneration failed', { userId, error });
    return res.status(500).json({ message: 'Backup code regeneration failed' });
  }
});

export default router;
