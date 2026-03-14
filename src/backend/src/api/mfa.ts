import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { verifyEnrollmentSchema } from '../schemas/auth';
import {
  generateTotpSecret,
  generateQrCode,
  verifyTotpToken,
  generateBackupCodes,
  hashBackupCode,
} from '../lib/mfa';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

const router = Router();

// All MFA endpoints require an authenticated session.
router.use(authenticate);

// POST /api/auth/mfa/enroll
// Generates a fresh TOTP secret and QR code for the authenticated user.
// The secret is persisted immediately (mfaEnabled stays false) so that
// verify-enrollment can confirm the correct secret was scanned.
router.post('/enroll', async (req: AuthRequest, res: Response) => {
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

      // Activate MFA and store hashed backup codes atomically.
      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: { mfaEnabled: true, mfaEnrolledAt: new Date() },
        }),
        prisma.mfaBackupCode.createMany({
          data: plaintextCodes.map((code) => ({
            userId,
            code: hashBackupCode(code),
          })),
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
router.get('/status', async (req: AuthRequest, res: Response) => {
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

export default router;
