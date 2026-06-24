import request from 'supertest';
import sharp from 'sharp';
import app from '../../src/app';
import { prisma } from '../../src/lib/prisma';
import { auth } from '../../src/lib/auth';

describe('Admin Upload API', () => {
  let adminToken: string;
  let userToken: string;
  let tinyPng: Buffer;

  beforeAll(async () => {
    tinyPng = await sharp({
      create: {
        width: 1,
        height: 1,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    }).png().toBuffer();

    await prisma.user.deleteMany({ where: { email: { in: ['upload-admin@test.com', 'upload-user@test.com'] } } });

    const admin = await prisma.user.create({
      data: { email: 'upload-admin@test.com', firstName: 'Upload', lastName: 'Admin', role: 'ADMIN' },
    });
    const user = await prisma.user.create({
      data: { email: 'upload-user@test.com', firstName: 'Upload', lastName: 'User', role: 'USER' },
    });

    adminToken = auth.generateToken({ userId: admin.id, email: admin.email, role: admin.role });
    userToken = auth.generateToken({ userId: user.id, email: user.email, role: user.role });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('allows admins to upload a product image', async () => {
    const res = await request(app)
      .post('/api/admin/uploads/images')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('image', tinyPng, { filename: 'pixel.png', contentType: 'image/png' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      key: expect.stringMatching(/^products\/[a-f0-9]{16}-large\.webp$/),
      url: expect.stringMatching(/^\/uploads\/products\/[a-f0-9]{16}-large\.webp$/),
      mimetype: 'image/webp',
    });
    expect(res.body.size).toBeGreaterThan(0);
  });

  it('rejects non-admin uploads', async () => {
    const res = await request(app)
      .post('/api/admin/uploads/images')
      .set('Authorization', `Bearer ${userToken}`)
      .attach('image', tinyPng, { filename: 'pixel.png', contentType: 'image/png' });

    expect(res.status).toBe(403);
  });
});
