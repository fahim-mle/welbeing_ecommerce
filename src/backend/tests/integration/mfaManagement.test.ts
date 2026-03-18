import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/lib/prisma';
import { auth } from '../../src/lib/auth';
import { hashBackupCode } from '../../src/lib/mfa';

describe('MFA Management Endpoints', () => {
  let regularUser: { id: number; email: string; role: string };
  let adminUser: { id: number; email: string; role: string };
  let targetUser: { id: number; email: string; role: string };

  let userToken: string;
  let adminToken: string;

  beforeAll(async () => {
    await prisma.mfaBackupCode.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.userIdentity.deleteMany();
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            'mfamgmt-user@example.com',
            'mfamgmt-admin@example.com',
            'mfamgmt-target@example.com',
          ],
        },
      },
    });

    regularUser = await prisma.user.create({
      data: {
        email: 'mfamgmt-user@example.com',
        firstName: 'Regular',
        lastName: 'User',
        role: 'USER',
        mfaEnabled: true,
        mfaSecret: 'TESTSECRET',
        mfaEnrolledAt: new Date(),
      },
    });

    adminUser = await prisma.user.create({
      data: {
        email: 'mfamgmt-admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
      },
    });

    targetUser = await prisma.user.create({
      data: {
        email: 'mfamgmt-target@example.com',
        firstName: 'Target',
        lastName: 'User',
        role: 'USER',
        mfaEnabled: true,
        mfaSecret: 'TARGETSECRET',
        mfaEnrolledAt: new Date(),
      },
    });

    // Seed 10 backup codes for the regular user — bcrypt is async.
    const regularHashes = await Promise.all(
      Array.from({ length: 10 }, (_, i) => hashBackupCode(`SEED000${i}`))
    );
    await prisma.mfaBackupCode.createMany({
      data: regularHashes.map((codeHash) => ({ userId: regularUser.id, codeHash })),
    });

    // Seed backup codes for the target user
    const targetHashes = await Promise.all(
      Array.from({ length: 5 }, (_, i) => hashBackupCode(`TARG000${i}`))
    );
    await prisma.mfaBackupCode.createMany({
      data: targetHashes.map((codeHash) => ({ userId: targetUser.id, codeHash })),
    });

    userToken = auth.generateToken({
      userId: regularUser.id,
      email: regularUser.email,
      role: regularUser.role,
    });

    adminToken = auth.generateToken({
      userId: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
    });
  });

  afterAll(async () => {
    await prisma.mfaBackupCode.deleteMany({
      where: { userId: { in: [regularUser.id, adminUser.id, targetUser.id] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [regularUser.id, adminUser.id, targetUser.id] } },
    });
    await prisma.$disconnect();
  });

  // ─── POST /api/auth/mfa/regenerate-backup-codes ───────────────────────────

  describe('POST /api/auth/mfa/regenerate-backup-codes', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).post('/api/auth/mfa/regenerate-backup-codes');

      expect(res.status).toBe(401);
    });

    it('should return 400 when MFA is not enabled for the user', async () => {
      // Temporarily disable MFA on the regular user
      await prisma.user.update({
        where: { id: regularUser.id },
        data: { mfaEnabled: false },
      });

      const res = await request(app)
        .post('/api/auth/mfa/regenerate-backup-codes')
        .set('Cookie', [`access_token=${userToken}`]);

      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe('MFA not enabled');

      // Restore
      await prisma.user.update({
        where: { id: regularUser.id },
        data: { mfaEnabled: true },
      });
    });

    it('should return 200 with 10 new backup codes', async () => {
      const res = await request(app)
        .post('/api/auth/mfa/regenerate-backup-codes')
        .set('Cookie', [`access_token=${userToken}`]);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('backupCodes');
      expect(Array.isArray(res.body.backupCodes)).toBe(true);
      expect(res.body.backupCodes).toHaveLength(10);
    });

    it('should return codes matching the expected format (uppercase alphanumeric, up to 8 chars)', async () => {
      const res = await request(app)
        .post('/api/auth/mfa/regenerate-backup-codes')
        .set('Cookie', [`access_token=${userToken}`]);

      expect(res.status).toBe(200);
      // generateBackupCodes strips non-alphanumeric chars from base64 output,
      // so codes may be 1–8 chars. All chars must be uppercase alphanumeric.
      res.body.backupCodes.forEach((code: string) => {
        expect(code).toMatch(/^[A-Z0-9]{1,8}$/);
      });
    });

    it('should return unique codes', async () => {
      const res = await request(app)
        .post('/api/auth/mfa/regenerate-backup-codes')
        .set('Cookie', [`access_token=${userToken}`]);

      expect(res.status).toBe(200);
      const unique = new Set(res.body.backupCodes);
      expect(unique.size).toBe(10);
    });

    it('should replace old backup codes in the database', async () => {
      const before = await prisma.mfaBackupCode.findMany({
        where: { userId: regularUser.id },
      });
      const beforeIds = before.map((c) => c.id);

      const res = await request(app)
        .post('/api/auth/mfa/regenerate-backup-codes')
        .set('Cookie', [`access_token=${userToken}`]);

      expect(res.status).toBe(200);

      const after = await prisma.mfaBackupCode.findMany({
        where: { userId: regularUser.id },
      });

      // All new records — none of the old IDs should survive
      const afterIds = after.map((c) => c.id);
      const overlap = afterIds.filter((id) => beforeIds.includes(id));
      expect(overlap).toHaveLength(0);
      expect(after).toHaveLength(10);
    });

    it('should store new codes as bcrypt hashes (starting with $2b$)', async () => {
      await request(app)
        .post('/api/auth/mfa/regenerate-backup-codes')
        .set('Cookie', [`access_token=${userToken}`]);

      const stored = await prisma.mfaBackupCode.findMany({
        where: { userId: regularUser.id },
      });

      // bcrypt hashes always start with $2b$ (or $2a$) and are 60 chars long.
      stored.forEach((row) => {
        expect(row.codeHash).toMatch(/^\$2[ab]\$\d{2}\$.{53}$/);
      });
    });
  });

  // ─── POST /api/auth/mfa/reset ─────────────────────────────────────────────

  describe('POST /api/auth/mfa/reset', () => {
    // Restore target user MFA state before each test
    beforeEach(async () => {
      await prisma.mfaBackupCode.deleteMany({ where: { userId: targetUser.id } });
      await prisma.user.update({
        where: { id: targetUser.id },
        data: {
          mfaEnabled: true,
          mfaSecret: 'TARGETSECRET',
          mfaEnrolledAt: new Date(),
        },
      });
      const hashes = await Promise.all(
        Array.from({ length: 5 }, (_, i) => hashBackupCode(`TARG000${i}`))
      );
      await prisma.mfaBackupCode.createMany({
        data: hashes.map((codeHash) => ({ userId: targetUser.id, codeHash })),
      });
    });

    it('should return 401 when no token is provided', async () => {
      const res = await request(app)
        .post('/api/auth/mfa/reset')
        .send({ userId: targetUser.id });

      expect(res.status).toBe(401);
    });

    it('should return 403 when a non-admin user calls the endpoint', async () => {
      const res = await request(app)
        .post('/api/auth/mfa/reset')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ userId: targetUser.id });

      expect(res.status).toBe(403);
    });

    it('should return 400 when userId is missing from the body', async () => {
      const res = await request(app)
        .post('/api/auth/mfa/reset')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('should return 400 when userId is not a positive integer', async () => {
      const res = await request(app)
        .post('/api/auth/mfa/reset')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: -1 });

      expect(res.status).toBe(400);
    });

    it('should return 404 when the target user does not exist', async () => {
      const res = await request(app)
        .post('/api/auth/mfa/reset')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: 999999 });

      expect(res.status).toBe(404);
      expect(res.body.error.message).toBe('User not found');
    });

    it('should return 200 with success message for a valid admin request', async () => {
      const res = await request(app)
        .post('/api/auth/mfa/reset')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: targetUser.id });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('MFA reset successful');
    });

    it('should set mfaEnabled=false and clear mfaSecret and mfaEnrolledAt', async () => {
      await request(app)
        .post('/api/auth/mfa/reset')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: targetUser.id });

      const user = await prisma.user.findUnique({
        where: { id: targetUser.id },
        select: { mfaEnabled: true, mfaSecret: true, mfaEnrolledAt: true },
      });

      expect(user?.mfaEnabled).toBe(false);
      expect(user?.mfaSecret).toBeNull();
      expect(user?.mfaEnrolledAt).toBeNull();
    });

    it('should delete all backup codes for the target user', async () => {
      await request(app)
        .post('/api/auth/mfa/reset')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: targetUser.id });

      const codes = await prisma.mfaBackupCode.findMany({
        where: { userId: targetUser.id },
      });

      expect(codes).toHaveLength(0);
    });
  });
});
