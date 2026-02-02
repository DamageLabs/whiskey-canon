import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import session from 'express-session';
import request from 'supertest';
import { requirePermission, requireRole } from './rbac';
import { attachUser } from './auth';
import { createTestUser } from '../test/helpers';
import { Role, Permission } from '../types';

describe('RBAC Middleware', () => {
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
    app.use(attachUser);
  });

  describe('requirePermission', () => {
    it('returns 401 when user is not authenticated', async () => {
      app.get('/protected', requirePermission(Permission.READ_WHISKEY), (req, res) => {
        res.json({ message: 'success' });
      });

      const response = await request(app).get('/protected');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication required');
    });

    it('allows access when user has required permission (EDITOR with READ_WHISKEY)', async () => {
      const user = await createTestUser('editor', 'editor@test.com', 'password123', Role.EDITOR);

      app.post('/set-session', (req, res) => {
        req.session.userId = user.id;
        req.session.save(() => res.json({ ok: true }));
      });

      app.get('/protected', requirePermission(Permission.READ_WHISKEY), (req, res) => {
        res.json({ message: 'success' });
      });

      const agent = request.agent(app);
      await agent.post('/set-session');

      const response = await agent.get('/protected');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('success');
    });

    it('allows access when user has required permission (ADMIN with MANAGE_USERS)', async () => {
      const user = await createTestUser('admin', 'admin@test.com', 'password123', Role.ADMIN);

      app.post('/set-session', (req, res) => {
        req.session.userId = user.id;
        req.session.save(() => res.json({ ok: true }));
      });

      app.get('/admin', requirePermission(Permission.MANAGE_USERS), (req, res) => {
        res.json({ message: 'admin access' });
      });

      const agent = request.agent(app);
      await agent.post('/set-session');

      const response = await agent.get('/admin');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('admin access');
    });

    it('denies access when user lacks required permission (EDITOR with MANAGE_USERS)', async () => {
      const user = await createTestUser('editor', 'editor@test.com', 'password123', Role.EDITOR);

      app.post('/set-session', (req, res) => {
        req.session.userId = user.id;
        req.session.save(() => res.json({ ok: true }));
      });

      app.get('/admin', requirePermission(Permission.MANAGE_USERS), (req, res) => {
        res.json({ message: 'admin access' });
      });

      const agent = request.agent(app);
      await agent.post('/set-session');

      const response = await agent.get('/admin');

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Insufficient permissions');
      expect(response.body.required).toBe(Permission.MANAGE_USERS);
      expect(response.body.role).toBe(Role.EDITOR);
    });

    it('denies access when user lacks required permission (EDITOR with DELETE_WHISKEY)', async () => {
      const user = await createTestUser('editor', 'editor@test.com', 'password123', Role.EDITOR);

      app.post('/set-session', (req, res) => {
        req.session.userId = user.id;
        req.session.save(() => res.json({ ok: true }));
      });

      app.delete('/whiskey/:id', requirePermission(Permission.DELETE_WHISKEY), (req, res) => {
        res.json({ message: 'deleted' });
      });

      const agent = request.agent(app);
      await agent.post('/set-session');

      const response = await agent.delete('/whiskey/1');

      expect(response.status).toBe(403);
      expect(response.body.required).toBe(Permission.DELETE_WHISKEY);
    });

    it('allows ADMIN access to all whiskey permissions', async () => {
      const user = await createTestUser('admin', 'admin@test.com', 'password123', Role.ADMIN);

      app.post('/set-session', (req, res) => {
        req.session.userId = user.id;
        req.session.save(() => res.json({ ok: true }));
      });

      app.post('/create', requirePermission(Permission.CREATE_WHISKEY), (req, res) => res.json({ action: 'create' }));
      app.get('/read', requirePermission(Permission.READ_WHISKEY), (req, res) => res.json({ action: 'read' }));
      app.put('/update', requirePermission(Permission.UPDATE_WHISKEY), (req, res) => res.json({ action: 'update' }));
      app.delete('/delete', requirePermission(Permission.DELETE_WHISKEY), (req, res) => res.json({ action: 'delete' }));

      const agent = request.agent(app);
      await agent.post('/set-session');

      const createRes = await agent.post('/create');
      const readRes = await agent.get('/read');
      const updateRes = await agent.put('/update');
      const deleteRes = await agent.delete('/delete');

      expect(createRes.status).toBe(200);
      expect(readRes.status).toBe(200);
      expect(updateRes.status).toBe(200);
      expect(deleteRes.status).toBe(200);
    });
  });

  describe('requireRole', () => {
    it('returns 401 when user is not authenticated', async () => {
      app.get('/admin', requireRole(Role.ADMIN), (req, res) => {
        res.json({ message: 'success' });
      });

      const response = await request(app).get('/admin');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication required');
    });

    it('allows access when user has required role', async () => {
      const user = await createTestUser('admin', 'admin@test.com', 'password123', Role.ADMIN);

      app.post('/set-session', (req, res) => {
        req.session.userId = user.id;
        req.session.save(() => res.json({ ok: true }));
      });

      app.get('/admin', requireRole(Role.ADMIN), (req, res) => {
        res.json({ message: 'admin only' });
      });

      const agent = request.agent(app);
      await agent.post('/set-session');

      const response = await agent.get('/admin');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('admin only');
    });

    it('denies access when user has different role', async () => {
      const user = await createTestUser('editor', 'editor@test.com', 'password123', Role.EDITOR);

      app.post('/set-session', (req, res) => {
        req.session.userId = user.id;
        req.session.save(() => res.json({ ok: true }));
      });

      app.get('/admin', requireRole(Role.ADMIN), (req, res) => {
        res.json({ message: 'admin only' });
      });

      const agent = request.agent(app);
      await agent.post('/set-session');

      const response = await agent.get('/admin');

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Insufficient role');
      expect(response.body.required).toContain(Role.ADMIN);
      expect(response.body.current).toBe(Role.EDITOR);
    });

    it('allows access when user has one of multiple allowed roles', async () => {
      const editor = await createTestUser('editor', 'editor@test.com', 'password123', Role.EDITOR);

      app.post('/set-session', (req, res) => {
        req.session.userId = editor.id;
        req.session.save(() => res.json({ ok: true }));
      });

      // Allow both ADMIN and EDITOR
      app.get('/content', requireRole(Role.ADMIN, Role.EDITOR), (req, res) => {
        res.json({ message: 'content access' });
      });

      const agent = request.agent(app);
      await agent.post('/set-session');

      const response = await agent.get('/content');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('content access');
    });

    it('denies access when user role not in allowed list', async () => {
      const editor = await createTestUser('editor', 'editor@test.com', 'password123', Role.EDITOR);

      app.post('/set-session', (req, res) => {
        req.session.userId = editor.id;
        req.session.save(() => res.json({ ok: true }));
      });

      // Only allow ADMIN
      app.get('/admin-only', requireRole(Role.ADMIN), (req, res) => {
        res.json({ message: 'admin only' });
      });

      const agent = request.agent(app);
      await agent.post('/set-session');

      const response = await agent.get('/admin-only');

      expect(response.status).toBe(403);
    });
  });
});
