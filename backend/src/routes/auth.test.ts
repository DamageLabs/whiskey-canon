import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp, createTestUser, createAuthenticatedAgent } from '../test/helpers';
import { Role } from '../types';
import type { Application } from 'express';

describe('Auth Routes', () => {
  let app: Application;

  beforeEach(() => {
    app = createTestApp();
  });

  describe('POST /api/auth/register', () => {
    it('creates user with valid data', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'newuser',
          email: 'new@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('User created successfully');
      expect(response.body.user.username).toBe('newuser');
      expect(response.body.user.email).toBe('new@example.com');
    });

    it('rejects duplicate username', async () => {
      await createTestUser('existinguser', 'existing@example.com', 'password123');

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'existinguser',
          email: 'new@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Username already exists');
    });

    it('rejects duplicate email', async () => {
      await createTestUser('existinguser', 'existing@example.com', 'password123');

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'newuser',
          email: 'existing@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email already exists');
    });

    it('validates username length (min 3)', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'ab',
          email: 'new@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].msg).toBe('Username must be at least 3 characters');
    });

    it('validates email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'newuser',
          email: 'invalid-email',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].msg).toBe('Invalid email');
    });

    it('validates password length (min 6)', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'newuser',
          email: 'new@example.com',
          password: '12345'
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].msg).toBe('Password must be at least 6 characters');
    });

    it('does not return password in response', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'newuser',
          email: 'new@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(201);
      expect(response.body.user.password).toBeUndefined();
    });

    it('creates user with optional firstName and lastName', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'newuser',
          email: 'new@example.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe'
        });

      expect(response.status).toBe(201);
      expect(response.body.user.first_name).toBe('John');
      expect(response.body.user.last_name).toBe('Doe');
    });
  });

  describe('POST /api/auth/login', () => {
    it('logs in with valid credentials', async () => {
      await createTestUser('testuser', 'test@example.com', 'password123');

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.user.username).toBe('testuser');
    });

    it('returns 401 for invalid username', async () => {
      await createTestUser('testuser', 'test@example.com', 'password123');

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'wronguser',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('returns 401 for invalid password', async () => {
      await createTestUser('testuser', 'test@example.com', 'password123');

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('sets session cookie on success', async () => {
      await createTestUser('testuser', 'test@example.com', 'password123');

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('does not return password in response', async () => {
      await createTestUser('testuser', 'test@example.com', 'password123');

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.user.password).toBeUndefined();
    });
  });

  describe('POST /api/auth/logout', () => {
    it('clears session and returns success message', async () => {
      // Create user and login manually to avoid agent timing issues
      await createTestUser('logoutuser', 'logout@test.com', 'password123');
      const agent = request.agent(app);
      await agent.post('/api/auth/login').send({ username: 'logoutuser', password: 'password123' });

      const response = await agent.post('/api/auth/logout');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Logout successful');
    });

    it('allows logout even without active session', async () => {
      const response = await request(app).post('/api/auth/logout');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Logout successful');
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns 401 without authentication', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication required');
    });

    it('returns current user when authenticated', async () => {
      const { agent, user } = await createAuthenticatedAgent(app);

      const response = await agent.get('/api/auth/me');

      expect(response.status).toBe(200);
      expect(response.body.user.username).toBe(user.username);
      expect(response.body.user.email).toBe(user.email);
    });

    it('does not return password', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const response = await agent.get('/api/auth/me');

      expect(response.status).toBe(200);
      expect(response.body.user.password).toBeUndefined();
    });
  });

  describe('PUT /api/auth/profile', () => {
    it('returns 401 without authentication', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .send({ email: 'new@example.com' });

      expect(response.status).toBe(401);
    });

    it('updates email', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const response = await agent
        .put('/api/auth/profile')
        .send({ email: 'newemail@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Profile updated successfully');
      expect(response.body.user.email).toBe('newemail@example.com');
    });

    it('updates firstName and lastName', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const response = await agent
        .put('/api/auth/profile')
        .send({
          firstName: 'John',
          lastName: 'Doe'
        });

      expect(response.status).toBe(200);
      expect(response.body.user.first_name).toBe('John');
      expect(response.body.user.last_name).toBe('Doe');
    });

    it('rejects duplicate email', async () => {
      await createTestUser('otheruser', 'other@example.com', 'password123');
      const { agent } = await createAuthenticatedAgent(app, 'testuser', 'test@example.com', 'password123');

      const response = await agent
        .put('/api/auth/profile')
        .send({ email: 'other@example.com' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email already in use');
    });

    it('updates password with correct current password', async () => {
      const { agent } = await createAuthenticatedAgent(app, 'testuser', 'test@example.com', 'password123');

      const response = await agent
        .put('/api/auth/profile')
        .send({
          currentPassword: 'password123',
          newPassword: 'newpassword456'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Profile updated successfully');

      // Verify new password works
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'newpassword456'
        });

      expect(loginResponse.status).toBe(200);
    });

    it('rejects password change with wrong current password', async () => {
      const { agent } = await createAuthenticatedAgent(app, 'testuser', 'test@example.com', 'password123');

      const response = await agent
        .put('/api/auth/profile')
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword456'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Current password is incorrect');
    });

    it('requires current password when changing password', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const response = await agent
        .put('/api/auth/profile')
        .send({ newPassword: 'newpassword456' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Current password is required to change password');
    });

    it('does not return password in response', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const response = await agent
        .put('/api/auth/profile')
        .send({ firstName: 'John' });

      expect(response.status).toBe(200);
      expect(response.body.user.password).toBeUndefined();
    });

    it('validates email format', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const response = await agent
        .put('/api/auth/profile')
        .send({ email: 'invalid-email' });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('validates new password length', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const response = await agent
        .put('/api/auth/profile')
        .send({
          currentPassword: 'password123',
          newPassword: '12345'
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
  });
});
