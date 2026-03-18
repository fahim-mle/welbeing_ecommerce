import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/lib/prisma';
import { auth } from '../../src/lib/auth';
import { generate, NobleCryptoPlugin, ScureBase32Plugin } from 'otplib';
import { hashBackupCode } from '../../src/lib/mfa';

// Helper to avoid rate limiting
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('MFA Enrollment Flow', () => {
  let testUser: any;
  let accessToken: string;
  const crypto = new NobleCryptoPlugin();
  const base32 = new ScureBase32Plugin();

  beforeAll(async () => {
    // Clean up MFA-related tables first
    await prisma.mfaBackupCode.deleteMany();
    await prisma.userIdentity.deleteMany();
    await prisma.user.deleteMany();

    // Create a test user
    testUser = await prisma.user.create({
      data: {
        email: 'mfatest@example.com',
        firstName: 'MFA',
        lastName: 'Test',
        role: 'USER',
      },
    });

    // Generate access token
    accessToken = auth.generateToken({
      userId: testUser.id,
      email: testUser.email,
      role: testUser.role,
    });
  });

  afterAll(async () => {
    // Clean up test user and MFA data
    await prisma.mfaBackupCode.deleteMany({ where: { userId: testUser.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    await prisma.$disconnect();
  });

  describe('POST /api/auth/mfa/enroll', () => {
    it('should return 401 if not authenticated', async () => {
      const res = await request(app).post('/api/auth/mfa/enroll');

      expect(res.status).toBe(401);
    });

    it('should return 200 with secret and qrCode for authenticated user', async () => {
      const res = await request(app)
        .post('/api/auth/mfa/enroll')
        .set('Cookie', [`access_token=${accessToken}`]);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('secret');
      expect(res.body).toHaveProperty('qrCode');
    });

    it('should return a non-empty secret string', async () => {
      const res = await request(app)
        .post('/api/auth/mfa/enroll')
        .set('Cookie', [`access_token=${accessToken}`]);

      expect(res.status).toBe(200);
      expect(typeof res.body.secret).toBe('string');
      expect(res.body.secret.length).toBeGreaterThan(0);
    });

    it('should return a QR code starting with data:image/png;base64,', async () => {
      const res = await request(app)
        .post('/api/auth/mfa/enroll')
        .set('Cookie', [`access_token=${accessToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.qrCode).toMatch(/^data:image\/png;base64,/);
    });

    it('should store mfaSecret in database but keep mfaEnabled=false', async () => {
      const res = await request(app)
        .post('/api/auth/mfa/enroll')
        .set('Cookie', [`access_token=${accessToken}`]);

      expect(res.status).toBe(200);

      const user = await prisma.user.findUnique({
        where: { id: testUser.id },
        select: { mfaSecret: true, mfaEnabled: true },
      });

      expect(user?.mfaSecret).toBe(res.body.secret);
      expect(user?.mfaEnabled).toBe(false);
    });

    it('should return 400 if MFA already enabled', async () => {
      // Enable MFA for the test user
      await prisma.user.update({
        where: { id: testUser.id },
        data: { mfaEnabled: true, mfaEnrolledAt: new Date() },
      });

      const res = await request(app)
        .post('/api/auth/mfa/enroll')
        .set('Cookie', [`access_token=${accessToken}`]);

      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe('MFA already enabled');

      // Reset for next tests
      await prisma.user.update({
        where: { id: testUser.id },
        data: { mfaEnabled: false, mfaEnrolledAt: null },
      });
    });
  });

  describe('POST /api/auth/mfa/verify-enrollment', () => {
    beforeEach(async () => {
      // Ensure user has no MFA enabled and clear backup codes
      await prisma.mfaBackupCode.deleteMany({ where: { userId: testUser.id } });
      await prisma.user.update({
        where: { id: testUser.id },
        data: { mfaEnabled: false, mfaSecret: null, mfaEnrolledAt: null },
      });
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .post('/api/auth/mfa/verify-enrollment')
        .send({ token: '123456' });

      expect(res.status).toBe(401);
    });

    it('should return 400 if no enrollment in progress (no mfaSecret)', async () => {
      // Clear the mfaSecret
      await prisma.user.update({
        where: { id: testUser.id },
        data: { mfaSecret: null },
      });

      const res = await request(app)
        .post('/api/auth/mfa/verify-enrollment')
        .set('Cookie', [`access_token=${accessToken}`])
        .send({ token: '123456' });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe('Invalid enrollment state');
    });

    it('should return 400 if MFA already enabled', async () => {
      // Enable MFA
      await prisma.user.update({
        where: { id: testUser.id },
        data: { mfaEnabled: true, mfaEnrolledAt: new Date() },
      });

      const res = await request(app)
        .post('/api/auth/mfa/verify-enrollment')
        .set('Cookie', [`access_token=${accessToken}`])
        .send({ token: '123456' });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe('Invalid enrollment state');
    });

    it('should return 401 for invalid TOTP token', async () => {
      // Initiate enrollment first
      const enrollRes = await request(app)
        .post('/api/auth/mfa/enroll')
        .set('Cookie', [`access_token=${accessToken}`]);

      const res = await request(app)
        .post('/api/auth/mfa/verify-enrollment')
        .set('Cookie', [`access_token=${accessToken}`])
        .send({ token: '000000' });

      expect(res.status).toBe(401);
      expect(res.body.error.message).toBe('Invalid TOTP code');
    });

    it('should return 200 with backupCodes for valid TOTP token', async () => {
      // Initiate enrollment first
      const enrollRes = await request(app)
        .post('/api/auth/mfa/enroll')
        .set('Cookie', [`access_token=${accessToken}`]);

      const validToken = generate({
        secret: enrollRes.body.secret,
        crypto,
        base32,
      });

      const res = await request(app)
        .post('/api/auth/mfa/verify-enrollment')
        .set('Cookie', [`access_token=${accessToken}`])
        .send({ token: validToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('backupCodes');
      expect(Array.isArray(res.body.backupCodes)).toBe(true);
    });

    it('should set mfaEnabled=true and mfaEnrolledAt in database', async () => {
      // Initiate enrollment first
      const enrollRes = await request(app)
        .post('/api/auth/mfa/enroll')
        .set('Cookie', [`access_token=${accessToken}`]);

      const validToken = generate({
        secret: enrollRes.body.secret,
        crypto,
        base32,
      });

      const res = await request(app)
        .post('/api/auth/mfa/verify-enrollment')
        .set('Cookie', [`access_token=${accessToken}`])
        .send({ token: validToken });

      expect(res.status).toBe(200);

      const user = await prisma.user.findUnique({
        where: { id: testUser.id },
        select: { mfaEnabled: true, mfaEnrolledAt: true },
      });

      expect(user?.mfaEnabled).toBe(true);
      expect(user?.mfaEnrolledAt).toBeInstanceOf(Date);
    });

    it('should create 10 backup codes in database (hashed)', async () => {
      // Initiate enrollment first
      const enrollRes = await request(app)
        .post('/api/auth/mfa/enroll')
        .set('Cookie', [`access_token=${accessToken}`]);

      const validToken = generate({
        secret: enrollRes.body.secret,
        crypto,
        base32,
      });

      const res = await request(app)
        .post('/api/auth/mfa/verify-enrollment')
        .set('Cookie', [`access_token=${accessToken}`])
        .send({ token: validToken });

      expect(res.status).toBe(200);

      const backupCodes = await prisma.mfaBackupCode.findMany({
        where: { userId: testUser.id },
      });

      expect(backupCodes.length).toBe(10);

      // Verify that codes are hashed (bcrypt hashes start with $2b$ and are ~60 chars)
      backupCodes.forEach((code: { codeHash: string }) => {
        expect(code.codeHash).toMatch(/^\$2[aby]\$/);
        expect(code.codeHash.length).toBeGreaterThanOrEqual(59);
      });
    });

    it('should return unique backup codes', async () => {
      // Initiate enrollment first
      const enrollRes = await request(app)
        .post('/api/auth/mfa/enroll')
        .set('Cookie', [`access_token=${accessToken}`]);

      const validToken = generate({
        secret: enrollRes.body.secret,
        crypto,
        base32,
      });

      const res = await request(app)
        .post('/api/auth/mfa/verify-enrollment')
        .set('Cookie', [`access_token=${accessToken}`])
        .send({ token: validToken });

      expect(res.status).toBe(200);

      const backupCodes = res.body.backupCodes;
      const uniqueCodes = new Set(backupCodes);

      expect(uniqueCodes.size).toBe(backupCodes.length);
      expect(backupCodes.length).toBe(10);
    });
  });

  describe('GET /api/auth/mfa/status', () => {
    beforeEach(async () => {
      // Reset user MFA state
      await prisma.user.update({
        where: { id: testUser.id },
        data: { mfaEnabled: false, mfaSecret: null, mfaEnrolledAt: null },
      });
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app).get('/api/auth/mfa/status');

      expect(res.status).toBe(401);
    });

    it('should return mfaEnabled=false before enrollment', async () => {
      const res = await request(app)
        .get('/api/auth/mfa/status')
        .set('Cookie', [`access_token=${accessToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.mfaEnabled).toBe(false);
      expect(res.body.mfaEnrolledAt).toBeNull();
    });

    it('should return mfaEnabled=true after enrollment', async () => {
      // Enroll and verify MFA
      const enrollRes = await request(app)
        .post('/api/auth/mfa/enroll')
        .set('Cookie', [`access_token=${accessToken}`]);

      const validToken = generate({
        secret: enrollRes.body.secret,
        crypto,
        base32,
      });

      await request(app)
        .post('/api/auth/mfa/verify-enrollment')
        .set('Cookie', [`access_token=${accessToken}`])
        .send({ token: validToken });

      const res = await request(app)
        .get('/api/auth/mfa/status')
        .set('Cookie', [`access_token=${accessToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.mfaEnabled).toBe(true);
      expect(res.body.mfaEnrolledAt).toBeTruthy();
      expect(typeof res.body.mfaEnrolledAt).toBe('string');
    });
  });
});
