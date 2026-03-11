import request from 'supertest';
import app from '../../src/app';

describe('CORS Integration', () => {
  describe('Preflight OPTIONS request', () => {
    it('should return Access-Control-Allow-Origin header matching the origin', async () => {
      const origin = 'http://localhost:5173';
      const res = await request(app)
        .options('/api/health')
        .set('Origin', origin)
        .set('Access-Control-Request-Method', 'GET');

      expect(res.status).toBe(204);
      expect(res.headers['access-control-allow-origin']).toBe(origin);
    });

    it('should return Access-Control-Allow-Credentials: true on preflight', async () => {
      const res = await request(app)
        .options('/api/health')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'GET');

      expect(res.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should return allowed methods in preflight response', async () => {
      const res = await request(app)
        .options('/api/health')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'GET');

      expect(res.headers['access-control-allow-methods']).toBeDefined();
      expect(res.headers['access-control-allow-methods']).toContain('GET');
      expect(res.headers['access-control-allow-methods']).toContain('POST');
    });
  });

  describe('Normal GET request', () => {
    it('should return 200 with { status: ok } on /api/health', async () => {
      const res = await request(app).get('/api/health');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body).toHaveProperty('timestamp');
    });

    it('should include Access-Control-Allow-Credentials: true header on normal GET', async () => {
      const res = await request(app)
        .get('/api/health')
        .set('Origin', 'http://localhost:5173');

      expect(res.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should include Access-Control-Allow-Origin header on normal GET', async () => {
      const origin = 'http://localhost:5173';
      const res = await request(app)
        .get('/api/health')
        .set('Origin', origin);

      expect(res.headers['access-control-allow-origin']).toBe(origin);
    });
  });
});
