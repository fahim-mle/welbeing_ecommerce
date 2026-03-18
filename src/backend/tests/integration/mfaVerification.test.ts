import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/lib/prisma';
import { auth } from '../../src/lib/auth';
import { generateSync, NobleCryptoPlugin, ScureBase32Plugin } from 'otplib';
import { generateTotpSecret, hashBackupCode } from '../../src/lib/mfa';

describe('MFA Verification Login Flow', () => {
  const crypto = new NobleCryptoPlugin();
  const base32 = new ScureBase32Plugin();

  let testUser: { id: number; email: string; role: string };
  let mfaSecret: string;
  let validMfaToken: string;

  beforeAll(async () => {
    await prisma.mfaBackupCode.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.userIdentity.deleteMany();
    await prisma.user.deleteMany({ where: { email: 'mfaverify@example.com' } });

    mfaSecret = generateTotpSecret();

    testUser = await prisma.user.create({
      data: {
        email: 'mfaverify@example.com',
        firstName: 'MFA',
        lastName: 'Verify',
        role: 'USER',
        mfaEnabled: true,
        mfaSecret,
        mfaEnrolledAt: new Date(),
      },
    });

    // Seed backup codes — hash with bcrypt before storing.
    const [hashA, hashC, hashE] = await Promise.all([
      hashBackupCode('AAAABBBB'),
      hashBackupCode('CCCCDDDD'),
      hashBackupCode('EEEEFFFF'),
    ]);
    await prisma.mfaBackupCode.createMany({
      data: [
        { userId: testUser.id, codeHash: hashA },
        { userId: testUser.id, codeHash: hashC },
        { userId: testUser.id, codeHash: hashE },
      ],
    });

    validMfaToken = auth.generateToken(
      { userId: testUser.id, email: testUser.email, role: testUser.role, mfaPending: true },
      '5m',
    );
  });

  afterAll(async () => {
    await prisma.mfaBackupCode.deleteMany({ where: { userId: testUser.id } });
    await prisma.refreshToken.deleteMany({ where: { userId: testUser.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    await prisma.$disconnect();
  });

  // ─── POST /api/auth/mfa/verify ─────────────────────────────────────────────

  describe('POST /api/auth/mfa/verify', () => {
    it('should return 400 when mfaToken is missing', async () => {
      const res = await request(app)
        .post('/api/auth/mfa/verify')
        .send({ token: '123456' });

      expect(res.status).toBe(400);
    });

    it('should return 400 when TOTP token is missing', async () => {
      const res = await request(app)
        .post('/api/auth/mfa/verify')
        .send({ mfaToken: validMfaToken });

      expect(res.status).toBe(400);
    });

    it('should return 400 when TOTP token is not 6 digits', async () => {
      const res = await request(app)
        .post('/api/auth/mfa/verify')
        .send({ mfaToken: validMfaToken, token: '12345' });

      expect(res.status).toBe(400);
    });

    it('should return 401 for an expired or invalid mfaToken', async () => {
      const expiredToken = auth.generateToken(
        { userId: testUser.id, email: testUser.email, role: testUser.role, mfaPending: true },
        '0s',
      );

      // Wait a tick so the token is definitely expired
      await new Promise((r) => setTimeout(r, 50));

      const res = await request(app)
        .post('/api/auth/mfa/verify')
        .send({ mfaToken: expiredToken, token: '123456' });

      expect(res.status).toBe(401);
      expect(res.body.error.message).toBe('Invalid or expired MFA token');
    });

    it('should return 401 when a regular access token is used as mfaToken', async () => {
      // A normal access token lacks mfaPending:true
      const regularToken = auth.generateToken(
        { userId: testUser.id, email: testUser.email, role: testUser.role },
        '15m',
      );

      const res = await request(app)
        .post('/api/auth/mfa/verify')
        .send({ mfaToken: regularToken, token: '123456' });

      expect(res.status).toBe(401);
      expect(res.body.error.message).toBe('Invalid or expired MFA token');
    });

    it('should return 401 for a wrong TOTP code', async () => {
      const res = await request(app)
        .post('/api/auth/mfa/verify')
        .send({ mfaToken: validMfaToken, token: '000000' });

      expect(res.status).toBe(401);
      expect(res.body.error.message).toBe('Invalid TOTP code');
    });

    it('should return 200 with user data and set auth cookies for a valid TOTP code', async () => {
      const totpCode = generateSync({ secret: mfaSecret, crypto, base32 });

      const res = await request(app)
        .post('/api/auth/mfa/verify')
        .send({ mfaToken: validMfaToken, token: totpCode });

      expect(res.status).toBe(200);
      expect(res.body.user).toMatchObject({
        id: testUser.id,
        email: testUser.email,
        role: testUser.role,
      });

      const cookies = res.headers['set-cookie'] as unknown as string[];
      expect(cookies.some((c: string) => c.startsWith('access_token='))).toBe(true);
      expect(cookies.some((c: string) => c.startsWith('refresh_token='))).toBe(true);
    });

    it('should create a refresh token record in the database on success', async () => {
      const totpCode = generateSync({ secret: mfaSecret, crypto, base32 });

      await request(app)
        .post('/api/auth/mfa/verify')
        .send({ mfaToken: validMfaToken, token: totpCode });

      const tokens = await prisma.refreshToken.findMany({ where: { userId: testUser.id } });
      expect(tokens.length).toBeGreaterThan(0);
    });
  });

  // ─── POST /api/auth/mfa/verify-backup-code ────────────────────────────────

  describe('POST /api/auth/mfa/verify-backup-code', () => {
    it('should return 400 when mfaToken is missing', async () => {
      const res = await request(app)
        .post('/api/auth/mfa/verify-backup-code')
        .send({ code: 'AAAABBBB' });

      expect(res.status).toBe(400);
    });

    it('should return 400 when backup code is missing', async () => {
      const res = await request(app)
        .post('/api/auth/mfa/verify-backup-code')
        .send({ mfaToken: validMfaToken });

      expect(res.status).toBe(400);
    });

    it('should return 400 when backup code is not 8 uppercase alphanumeric chars', async () => {
      const res = await request(app)
        .post('/api/auth/mfa/verify-backup-code')
        .send({ mfaToken: validMfaToken, code: 'short' });

      expect(res.status).toBe(400);
    });

    it('should return 401 for an invalid mfaToken', async () => {
      const res = await request(app)
        .post('/api/auth/mfa/verify-backup-code')
        .send({ mfaToken: 'not.a.valid.jwt', code: 'AAAABBBB' });

      expect(res.status).toBe(401);
      expect(res.body.error.message).toBe('Invalid or expired MFA token');
    });

    it('should return 401 for a wrong backup code', async () => {
      const res = await request(app)
        .post('/api/auth/mfa/verify-backup-code')
        .send({ mfaToken: validMfaToken, code: 'ZZZZZZZZ' });

      expect(res.status).toBe(401);
      expect(res.body.error.message).toBe('Invalid or already used backup code');
    });

    it('should return 200 with user data and set auth cookies for a valid backup code', async () => {
      const res = await request(app)
        .post('/api/auth/mfa/verify-backup-code')
        .send({ mfaToken: validMfaToken, code: 'AAAABBBB' });

      expect(res.status).toBe(200);
      expect(res.body.user).toMatchObject({
        id: testUser.id,
        email: testUser.email,
        role: testUser.role,
      });

      const cookies = res.headers['set-cookie'] as unknown as string[];
      expect(cookies.some((c: string) => c.startsWith('access_token='))).toBe(true);
      expect(cookies.some((c: string) => c.startsWith('refresh_token='))).toBe(true);
    });

    it('should mark the backup code as used after successful verification', async () => {
      // Use a fresh code that hasn't been consumed yet
      const res = await request(app)
        .post('/api/auth/mfa/verify-backup-code')
        .send({ mfaToken: validMfaToken, code: 'CCCCDDDD' });

      expect(res.status).toBe(200);

      // We can't query by hash (bcrypt hashes are non-deterministic), so find
      // the consumed code by checking which unused code was marked used.
      const usedCode = await prisma.mfaBackupCode.findFirst({
        where: { userId: testUser.id, usedAt: { not: null } },
      });

      expect(usedCode?.usedAt).not.toBeNull();
      expect(usedCode?.usedAt).toBeInstanceOf(Date);
    });

    it('should reject a backup code that has already been used', async () => {
      // CCCCDDDD was consumed in the previous test; attempt reuse
      const res = await request(app)
        .post('/api/auth/mfa/verify-backup-code')
        .send({ mfaToken: validMfaToken, code: 'CCCCDDDD' });

      expect(res.status).toBe(401);
      expect(res.body.error.message).toBe('Invalid or already used backup code');
    });
  });
});
