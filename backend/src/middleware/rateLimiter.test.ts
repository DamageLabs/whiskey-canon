import { describe, it, expect, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import rateLimit from 'express-rate-limit';

// Unmock since setup.ts mocks rateLimiter globally — we need real behavior here
vi.unmock('../middleware/rateLimiter');

function createLimiterApp(limiter: express.RequestHandler) {
  const app = express();
  app.use(express.json());
  app.post('/test', limiter, (_req, res) => {
    res.json({ ok: true });
  });
  return app;
}

// Create fresh limiter instances per test to avoid shared state
function createAuthLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please try again later.' },
  });
}

function createPasswordResetLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 3,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please try again later.' },
  });
}

function createContactLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please try again later.' },
  });
}

describe('Rate Limiter Middleware', () => {
  describe('authLimiter', () => {
    it('allows requests under the limit', async () => {
      const app = createLimiterApp(createAuthLimiter());

      const res = await request(app).post('/test').send({});
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    it('returns 429 after 10 requests', async () => {
      const app = createLimiterApp(createAuthLimiter());

      for (let i = 0; i < 10; i++) {
        const res = await request(app).post('/test').send({});
        expect(res.status).toBe(200);
      }

      const res = await request(app).post('/test').send({});
      expect(res.status).toBe(429);
      expect(res.body.error).toBe('Too many requests. Please try again later.');
    });

    it('includes standard rate limit headers', async () => {
      const app = createLimiterApp(createAuthLimiter());

      const res = await request(app).post('/test').send({});
      expect(res.headers['ratelimit-limit']).toBeDefined();
      expect(res.headers['ratelimit-remaining']).toBeDefined();
    });
  });

  describe('passwordResetLimiter', () => {
    it('allows requests under the limit', async () => {
      const app = createLimiterApp(createPasswordResetLimiter());

      const res = await request(app).post('/test').send({});
      expect(res.status).toBe(200);
    });

    it('returns 429 after 3 requests', async () => {
      const app = createLimiterApp(createPasswordResetLimiter());

      for (let i = 0; i < 3; i++) {
        const res = await request(app).post('/test').send({});
        expect(res.status).toBe(200);
      }

      const res = await request(app).post('/test').send({});
      expect(res.status).toBe(429);
      expect(res.body.error).toBe('Too many requests. Please try again later.');
    });
  });

  describe('contactLimiter', () => {
    it('allows requests under the limit', async () => {
      const app = createLimiterApp(createContactLimiter());

      const res = await request(app).post('/test').send({});
      expect(res.status).toBe(200);
    });

    it('returns 429 after 5 requests', async () => {
      const app = createLimiterApp(createContactLimiter());

      for (let i = 0; i < 5; i++) {
        const res = await request(app).post('/test').send({});
        expect(res.status).toBe(200);
      }

      const res = await request(app).post('/test').send({});
      expect(res.status).toBe(429);
      expect(res.body.error).toBe('Too many requests. Please try again later.');
    });
  });
});
