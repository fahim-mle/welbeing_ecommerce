import request from 'supertest';
import app from '../../src/app';

describe('Products API', () => {
  // Setup logic could go here, or rely on seeded data.
  // For integration tests, usually better to reset DB or use a test DB.
  // For this scope, we test against the running dev DB logic or mock prisma.
  // Given we are in backend integration folder, let's assume we can hit the endpoints.
  // NOTE: This might fail if DB is not running or empty, but we seeded it.

  it('GET /api/products should return list of products', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/categories should return categories', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
