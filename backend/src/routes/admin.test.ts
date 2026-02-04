import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createTestApp, createTestUser, createAuthenticatedAgent, createTestWhiskey } from '../test/helpers';
import { Role } from '../types';
import type { Application } from 'express';
import { UserModel } from '../models/User';
import { WhiskeyModel } from '../models/Whiskey';

describe('Admin Routes', () => {
  let app: Application;

  beforeEach(() => {
    app = createTestApp();
  });

  describe('Authentication & Authorization', () => {
    it('returns 401 for unauthenticated requests', async () => {
      const response = await request(app).get('/api/admin/users');
      expect(response.status).toBe(401);
    });

    it('returns 403 for non-admin users', async () => {
      const { agent } = await createAuthenticatedAgent(app, 'editor', 'editor@test.com', 'password123', Role.EDITOR);

      const response = await agent.get('/api/admin/users');

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Insufficient permissions');
    });
  });

  describe('GET /api/admin/users', () => {
    it('returns all users for admin', async () => {
      const { agent } = await createAuthenticatedAgent(app, 'admin', 'admin@test.com', 'password123', Role.ADMIN);
      await createTestUser('user1', 'user1@test.com', 'password123');
      await createTestUser('user2', 'user2@test.com', 'password123');

      const response = await agent.get('/api/admin/users');

      expect(response.status).toBe(200);
      expect(response.body.users).toHaveLength(3); // admin + 2 users
    });

    it('does not return password hashes', async () => {
      const { agent } = await createAuthenticatedAgent(app, 'admin', 'admin@test.com', 'password123', Role.ADMIN);

      const response = await agent.get('/api/admin/users');

      expect(response.status).toBe(200);
      response.body.users.forEach((user: any) => {
        expect(user.password).toBeUndefined();
      });
    });

    it('returns user details', async () => {
      const { agent } = await createAuthenticatedAgent(app, 'admin', 'admin@test.com', 'password123', Role.ADMIN);

      const response = await agent.get('/api/admin/users');

      expect(response.status).toBe(200);
      const admin = response.body.users.find((u: any) => u.username === 'admin');
      expect(admin.email).toBe('admin@test.com');
      expect(admin.role).toBe(Role.ADMIN);
    });
  });

  describe('PUT /api/admin/users/:id/role', () => {
    it('updates user role', async () => {
      const { agent } = await createAuthenticatedAgent(app, 'admin', 'admin@test.com', 'password123', Role.ADMIN);
      const user = await createTestUser('editor', 'editor@test.com', 'password123', Role.EDITOR);

      const response = await agent
        .put(`/api/admin/users/${user.id}/role`)
        .send({ role: Role.ADMIN });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('User role updated successfully');
      expect(response.body.user.role).toBe(Role.ADMIN);
    });

    it('prevents admin from changing their own role', async () => {
      const { agent, user } = await createAuthenticatedAgent(app, 'admin', 'admin@test.com', 'password123', Role.ADMIN);

      const response = await agent
        .put(`/api/admin/users/${user.id}/role`)
        .send({ role: Role.EDITOR });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Cannot change your own role');
    });

    it('returns 404 for non-existent user', async () => {
      const { agent } = await createAuthenticatedAgent(app, 'admin', 'admin@test.com', 'password123', Role.ADMIN);

      const response = await agent
        .put('/api/admin/users/99999/role')
        .send({ role: Role.ADMIN });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('User not found');
    });

    it('validates role value', async () => {
      const { agent } = await createAuthenticatedAgent(app, 'admin', 'admin@test.com', 'password123', Role.ADMIN);
      const user = await createTestUser('editor', 'editor@test.com', 'password123');

      const response = await agent
        .put(`/api/admin/users/${user.id}/role`)
        .send({ role: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('does not return password in response', async () => {
      const { agent } = await createAuthenticatedAgent(app, 'admin', 'admin@test.com', 'password123', Role.ADMIN);
      const user = await createTestUser('editor', 'editor@test.com', 'password123');

      const response = await agent
        .put(`/api/admin/users/${user.id}/role`)
        .send({ role: Role.ADMIN });

      expect(response.status).toBe(200);
      expect(response.body.user.password).toBeUndefined();
    });
  });

  describe('PUT /api/admin/users/:id', () => {
    it('updates user profile', async () => {
      const { agent } = await createAuthenticatedAgent(app, 'admin', 'admin@test.com', 'password123', Role.ADMIN);
      const user = await createTestUser('target', 'target@test.com', 'password123');

      const response = await agent
        .put(`/api/admin/users/${user.id}`)
        .send({
          email: 'newemail@test.com',
          firstName: 'John',
          lastName: 'Doe'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('User profile updated successfully');
      expect(response.body.user.email).toBe('newemail@test.com');
      expect(response.body.user.first_name).toBe('John');
      expect(response.body.user.last_name).toBe('Doe');
    });

    it('rejects duplicate email', async () => {
      const { agent } = await createAuthenticatedAgent(app, 'admin', 'admin@test.com', 'password123', Role.ADMIN);
      await createTestUser('existing', 'existing@test.com', 'password123');
      const target = await createTestUser('target', 'target@test.com', 'password123');

      const response = await agent
        .put(`/api/admin/users/${target.id}`)
        .send({ email: 'existing@test.com' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email already in use');
    });

    it('rejects duplicate username', async () => {
      const { agent } = await createAuthenticatedAgent(app, 'admin', 'admin@test.com', 'password123', Role.ADMIN);
      await createTestUser('existing', 'existing@test.com', 'password123');
      const target = await createTestUser('target', 'target@test.com', 'password123');

      const response = await agent
        .put(`/api/admin/users/${target.id}`)
        .send({ username: 'existing' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Username already in use');
    });

    it('returns 404 for non-existent user', async () => {
      const { agent } = await createAuthenticatedAgent(app, 'admin', 'admin@test.com', 'password123', Role.ADMIN);

      const response = await agent
        .put('/api/admin/users/99999')
        .send({ email: 'new@test.com' });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('User not found');
    });

    it('validates email format', async () => {
      const { agent } = await createAuthenticatedAgent(app, 'admin', 'admin@test.com', 'password123', Role.ADMIN);
      const user = await createTestUser('target', 'target@test.com', 'password123');

      const response = await agent
        .put(`/api/admin/users/${user.id}`)
        .send({ email: 'invalid-email' });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('validates username length', async () => {
      const { agent } = await createAuthenticatedAgent(app, 'admin', 'admin@test.com', 'password123', Role.ADMIN);
      const user = await createTestUser('target', 'target@test.com', 'password123');

      const response = await agent
        .put(`/api/admin/users/${user.id}`)
        .send({ username: 'ab' });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('DELETE /api/admin/users/:id', () => {
    it('deletes user', async () => {
      const { agent } = await createAuthenticatedAgent(app, 'admin', 'admin@test.com', 'password123', Role.ADMIN);
      const user = await createTestUser('deleteme', 'delete@test.com', 'password123');

      const response = await agent.delete(`/api/admin/users/${user.id}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('User deleted successfully');
    });

    it('prevents admin from deleting themselves', async () => {
      const { agent, user } = await createAuthenticatedAgent(app, 'admin', 'admin@test.com', 'password123', Role.ADMIN);

      const response = await agent.delete(`/api/admin/users/${user.id}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Cannot delete your own account');
    });

    it('returns 404 for non-existent user', async () => {
      const { agent } = await createAuthenticatedAgent(app, 'admin', 'admin@test.com', 'password123', Role.ADMIN);

      const response = await agent.delete('/api/admin/users/99999');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('User not found');
    });

    it('cascades delete to user whiskeys', async () => {
      const { agent } = await createAuthenticatedAgent(app, 'admin', 'admin@test.com', 'password123', Role.ADMIN);
      const user = await createTestUser('withwhiskeys', 'whiskeys@test.com', 'password123');
      createTestWhiskey(user.id, { name: 'User Whiskey' });

      // Delete user
      await agent.delete(`/api/admin/users/${user.id}`);

      // Verify user's whiskeys are also deleted
      const { agent: adminAgent } = await createAuthenticatedAgent(app, 'admin2', 'admin2@test.com', 'password123', Role.ADMIN);
      const whiskeysResponse = await adminAgent.get('/api/admin/whiskeys');

      const userWhiskeys = whiskeysResponse.body.whiskeys.filter((w: any) => w.created_by === user.id);
      expect(userWhiskeys).toHaveLength(0);
    });
  });

  describe('GET /api/admin/whiskeys', () => {
    it('returns all whiskeys from all users', async () => {
      const { agent, user: admin } = await createAuthenticatedAgent(app, 'admin', 'admin@test.com', 'password123', Role.ADMIN);
      const user1 = await createTestUser('user1', 'user1@test.com', 'password123');
      const user2 = await createTestUser('user2', 'user2@test.com', 'password123');

      createTestWhiskey(admin.id, { name: 'Admin Whiskey' });
      createTestWhiskey(user1.id, { name: 'User1 Whiskey' });
      createTestWhiskey(user2.id, { name: 'User2 Whiskey' });

      const response = await agent.get('/api/admin/whiskeys');

      expect(response.status).toBe(200);
      expect(response.body.whiskeys).toHaveLength(3);
    });

    it('includes owner information', async () => {
      const { agent } = await createAuthenticatedAgent(app, 'admin', 'admin@test.com', 'password123', Role.ADMIN);
      const user = await createTestUser('owner', 'owner@test.com', 'password123');
      createTestWhiskey(user.id, { name: 'Owned Whiskey' });

      const response = await agent.get('/api/admin/whiskeys');

      expect(response.status).toBe(200);
      const whiskey = response.body.whiskeys.find((w: any) => w.name === 'Owned Whiskey');
      expect(whiskey.owner_username).toBe('owner');
      expect(whiskey.owner_email).toBe('owner@test.com');
    });

    it('returns 403 for non-admin users', async () => {
      const { agent } = await createAuthenticatedAgent(app, 'editor', 'editor@test.com', 'password123', Role.EDITOR);

      const response = await agent.get('/api/admin/whiskeys');

      expect(response.status).toBe(403);
    });
  });

  describe('Error Handling', () => {
    it('returns 500 when delete user throws an error', async () => {
      const { agent } = await createAuthenticatedAgent(app, 'admin', 'admin@test.com', 'password123', Role.ADMIN);
      const user = await createTestUser('todelete', 'todelete@test.com', 'password123');

      const spy = vi.spyOn(UserModel, 'delete').mockImplementation(() => {
        throw new Error('Database error');
      });

      const response = await agent.delete(`/api/admin/users/${user.id}`);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to delete user');

      spy.mockRestore();
    });

    it('returns 500 when get all whiskeys throws an error', async () => {
      const { agent } = await createAuthenticatedAgent(app, 'admin', 'admin@test.com', 'password123', Role.ADMIN);

      const spy = vi.spyOn(WhiskeyModel, 'findAllWithOwners').mockImplementation(() => {
        throw new Error('Database error');
      });

      const response = await agent.get('/api/admin/whiskeys');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to fetch whiskeys');

      spy.mockRestore();
    });
  });
});
