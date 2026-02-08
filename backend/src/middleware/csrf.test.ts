import { describe, it, expect, vi } from 'vitest';
import express from 'express';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import request from 'supertest';

// Unmock since setup.ts mocks csrf globally — we need real behavior here
vi.unmock('../middleware/csrf');

import { csrfProtection, generateToken } from '../middleware/csrf';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use(
    session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: true,
      cookie: { secure: false },
    })
  );
  app.use(csrfProtection);

  app.get('/csrf-token', (req, res) => {
    const token = generateToken(req, res);
    req.session.csrfInit = true;
    res.json({ token });
  });

  app.get('/test', (_req, res) => {
    res.json({ ok: true });
  });

  app.post('/test', (_req, res) => {
    res.json({ ok: true });
  });

  app.put('/test', (_req, res) => {
    res.json({ ok: true });
  });

  app.delete('/test', (_req, res) => {
    res.json({ ok: true });
  });

  // Error handler for CSRF errors (matches csrf-csrf HttpError shape)
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err.status === 403 && err.code === 'EBADCSRFTOKEN') {
      return res.status(403).json({ error: 'Invalid CSRF token' });
    }
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

describe('CSRF Middleware', () => {
  it('allows GET requests without a token', async () => {
    const app = createApp();
    const res = await request(app).get('/test');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('rejects POST requests without a token', async () => {
    const app = createApp();
    const res = await request(app).post('/test').send({ data: 'test' });
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Invalid CSRF token');
  });

  it('rejects PUT requests without a token', async () => {
    const app = createApp();
    const res = await request(app).put('/test').send({ data: 'test' });
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Invalid CSRF token');
  });

  it('rejects DELETE requests without a token', async () => {
    const app = createApp();
    const res = await request(app).delete('/test');
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Invalid CSRF token');
  });

  it('rejects POST requests with an invalid token', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/test')
      .set('x-csrf-token', 'invalid-token')
      .send({ data: 'test' });
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Invalid CSRF token');
  });

  it('allows POST with a valid token from the token endpoint', async () => {
    const app = createApp();
    const agent = request.agent(app);

    // Get a CSRF token (this sets the cookie and returns the token)
    const tokenRes = await agent.get('/csrf-token');
    expect(tokenRes.status).toBe(200);
    expect(tokenRes.body.token).toBeDefined();

    const token = tokenRes.body.token;

    // POST with the valid token
    const res = await agent
      .post('/test')
      .set('x-csrf-token', token)
      .send({ data: 'test' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('token endpoint sets a non-httpOnly cookie', async () => {
    const app = createApp();
    const agent = request.agent(app);

    const res = await agent.get('/csrf-token');
    expect(res.status).toBe(200);

    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();

    const csrfCookie = (Array.isArray(cookies) ? cookies : [cookies]).find(
      (c: string) => c.startsWith('__csrf=')
    );
    expect(csrfCookie).toBeDefined();
    // Verify the cookie is NOT httpOnly (so frontend JS can read it)
    expect(csrfCookie).not.toMatch(/httponly/i);
  });
});
