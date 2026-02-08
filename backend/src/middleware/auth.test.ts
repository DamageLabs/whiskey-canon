import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import session from 'express-session';
import request from 'supertest';
import { requireAuth, attachUser } from './auth';
import { createTestUser } from '../test/helpers';
import { Role } from '../types';

describe('Auth Middleware', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(
      session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: false
      })
    );
  });

  describe('requireAuth', () => {
    it('returns 401 without session', async () => {
      app.get('/protected', requireAuth, (req, res) => {
        res.json({ message: 'success' });
      });

      const response = await request(app).get('/protected');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication required');
    });

    it('passes with valid session', async () => {
      // Set up a route that manually sets session userId
      app.post('/set-session', (req, res) => {
        req.session.userId = 1;
        req.session.save(() => {
          res.json({ message: 'session set' });
        });
      });

      app.get('/protected', requireAuth, (req, res) => {
        res.json({ message: 'success' });
      });

      const agent = request.agent(app);

      // First set the session
      await agent.post('/set-session');

      // Then try to access protected route
      const response = await agent.get('/protected');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('success');
    });
  });

  describe('attachUser', () => {
    it('attaches user to request when session has userId', async () => {
      const user = await createTestUser('testuser', 'test@example.com', 'Wh1sk3yTest!!', Role.EDITOR);

      // Set up route that manually sets session and uses attachUser
      app.post('/set-session', (req, res) => {
        req.session.userId = user.id;
        req.session.save(() => {
          res.json({ message: 'session set' });
        });
      });

      app.get('/check-user', attachUser, (req: any, res) => {
        if (req.user) {
          res.json({
            hasUser: true,
            username: req.user.username,
            email: req.user.email
          });
        } else {
          res.json({ hasUser: false });
        }
      });

      const agent = request.agent(app);

      // First set the session
      await agent.post('/set-session');

      // Then check if user is attached
      const response = await agent.get('/check-user');

      expect(response.status).toBe(200);
      expect(response.body.hasUser).toBe(true);
      expect(response.body.username).toBe('testuser');
      expect(response.body.email).toBe('test@example.com');
    });

    it('handles missing user (invalid userId in session)', async () => {
      // Set up route that sets an invalid userId
      app.post('/set-session', (req, res) => {
        req.session.userId = 99999; // Non-existent user
        req.session.save(() => {
          res.json({ message: 'session set' });
        });
      });

      app.get('/check-user', attachUser, (req: any, res) => {
        res.json({ hasUser: !!req.user });
      });

      const agent = request.agent(app);

      // First set the session with invalid userId
      await agent.post('/set-session');

      // Then check if user is attached
      const response = await agent.get('/check-user');

      expect(response.status).toBe(200);
      expect(response.body.hasUser).toBe(false);
    });

    it('does nothing when no session userId', async () => {
      app.get('/check-user', attachUser, (req: any, res) => {
        res.json({ hasUser: !!req.user });
      });

      const response = await request(app).get('/check-user');

      expect(response.status).toBe(200);
      expect(response.body.hasUser).toBe(false);
    });
  });
});
