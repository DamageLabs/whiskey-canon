import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createTestApp, createTestUser, createAuthenticatedAgent } from '../test/helpers';
import { Role } from '../types';
import type { Application } from 'express';
import { testDb } from '../test/setup';
import * as emailUtils from '../utils/email';
import { validatePassword } from '../utils/password-policy';

// Mock email functions
vi.mock('../utils/email', () => ({
  sendVerificationEmail: vi.fn().mockResolvedValue(true),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(true),
}));

describe('Auth Routes', () => {
  let app: Application;

  beforeEach(() => {
    app = createTestApp();
  });

  describe('POST /api/auth/register', () => {
    it('creates user with valid data', async () => {
      const response = await request(app).post('/api/auth/register').send({
        username: 'newuser',
        email: 'new@example.com',
        password: 'Wh1sk3yTest!!',
      });

      expect(response.status).toBe(201);
      expect(response.body.message).toContain('User created successfully');
      expect(response.body.requiresVerification).toBe(true);
      expect(response.body.email).toBe('new@example.com');
    });

    it('rejects duplicate username', async () => {
      await createTestUser('existinguser', 'existing@example.com', 'Wh1sk3yTest!!');

      const response = await request(app).post('/api/auth/register').send({
        username: 'existinguser',
        email: 'new@example.com',
        password: 'Wh1sk3yTest!!',
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Username already exists');
    });

    it('rejects duplicate email', async () => {
      await createTestUser('existinguser', 'existing@example.com', 'Wh1sk3yTest!!');

      const response = await request(app).post('/api/auth/register').send({
        username: 'newuser',
        email: 'existing@example.com',
        password: 'Wh1sk3yTest!!',
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email already exists');
    });

    it('validates username length (min 3)', async () => {
      const response = await request(app).post('/api/auth/register').send({
        username: 'ab',
        email: 'new@example.com',
        password: 'Wh1sk3yTest!!',
      });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].msg).toBe('Username must be at least 3 characters');
    });

    it('validates email format', async () => {
      const response = await request(app).post('/api/auth/register').send({
        username: 'newuser',
        email: 'invalid-email',
        password: 'Wh1sk3yTest!!',
      });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].msg).toBe('Invalid email');
    });

    it('validates password complexity', async () => {
      const response = await request(app).post('/api/auth/register').send({
        username: 'newuser',
        email: 'new@example.com',
        password: '12345',
      });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].msg).toContain('Password must be at least 12 characters');
    });

    it('rejects password missing complexity requirements', async () => {
      const response = await request(app).post('/api/auth/register').send({
        username: 'newuser',
        email: 'new@example.com',
        password: 'alllowercase!!',
      });

      expect(response.status).toBe(400);
    });

    it('rejects a breached password', async () => {
      vi.mocked(validatePassword).mockRejectedValueOnce(
        new Error(
          'This password has been found in a data breach. Please choose a different password'
        )
      );

      const response = await request(app).post('/api/auth/register').send({
        username: 'newuser',
        email: 'new@example.com',
        password: 'Wh1sk3yTest!!',
      });

      expect(response.status).toBe(400);
      expect(response.body.errors[0].msg).toContain('data breach');
    });

    it('does not return user details for security (requires verification)', async () => {
      const response = await request(app).post('/api/auth/register').send({
        username: 'newuser',
        email: 'new@example.com',
        password: 'Wh1sk3yTest!!',
      });

      expect(response.status).toBe(201);
      expect(response.body.user).toBeUndefined();
      expect(response.body.requiresVerification).toBe(true);
    });

    it('creates user with optional firstName and lastName', async () => {
      const response = await request(app).post('/api/auth/register').send({
        username: 'newuser',
        email: 'new@example.com',
        password: 'Wh1sk3yTest!!',
        firstName: 'John',
        lastName: 'Doe',
      });

      expect(response.status).toBe(201);
      expect(response.body.requiresVerification).toBe(true);
      expect(response.body.email).toBe('new@example.com');
    });
  });

  describe('POST /api/auth/login', () => {
    it('logs in with valid credentials', async () => {
      await createTestUser('testuser', 'test@example.com', 'Wh1sk3yTest!!');

      const response = await request(app).post('/api/auth/login').send({
        username: 'testuser',
        password: 'Wh1sk3yTest!!',
      });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.user.username).toBe('testuser');
    });

    it('returns 401 for invalid username', async () => {
      await createTestUser('testuser', 'test@example.com', 'Wh1sk3yTest!!');

      const response = await request(app).post('/api/auth/login').send({
        username: 'wronguser',
        password: 'Wh1sk3yTest!!',
      });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('returns 401 for invalid password', async () => {
      await createTestUser('testuser', 'test@example.com', 'Wh1sk3yTest!!');

      const response = await request(app).post('/api/auth/login').send({
        username: 'testuser',
        password: 'wrongpassword',
      });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('sets session cookie on success', async () => {
      await createTestUser('testuser', 'test@example.com', 'Wh1sk3yTest!!');

      const response = await request(app).post('/api/auth/login').send({
        username: 'testuser',
        password: 'Wh1sk3yTest!!',
      });

      expect(response.status).toBe(200);
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('does not return password in response', async () => {
      await createTestUser('testuser', 'test@example.com', 'Wh1sk3yTest!!');

      const response = await request(app).post('/api/auth/login').send({
        username: 'testuser',
        password: 'Wh1sk3yTest!!',
      });

      expect(response.status).toBe(200);
      expect(response.body.user.password).toBeUndefined();
    });
  });

  describe('POST /api/auth/logout', () => {
    it('clears session and returns success message', async () => {
      // Create user and login manually to avoid agent timing issues
      await createTestUser('logoutuser', 'logout@test.com', 'Wh1sk3yTest!!');
      const agent = request.agent(app);
      await agent
        .post('/api/auth/login')
        .send({ username: 'logoutuser', password: 'Wh1sk3yTest!!' });

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

      const response = await agent.put('/api/auth/profile').send({ email: 'newemail@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Profile updated successfully');
      expect(response.body.user.email).toBe('newemail@example.com');
    });

    it('updates firstName and lastName', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const response = await agent.put('/api/auth/profile').send({
        firstName: 'John',
        lastName: 'Doe',
      });

      expect(response.status).toBe(200);
      expect(response.body.user.first_name).toBe('John');
      expect(response.body.user.last_name).toBe('Doe');
    });

    it('rejects duplicate email', async () => {
      await createTestUser('otheruser', 'other@example.com', 'Wh1sk3yTest!!');
      const { agent } = await createAuthenticatedAgent(
        app,
        'testuser',
        'test@example.com',
        'Wh1sk3yTest!!'
      );

      const response = await agent.put('/api/auth/profile').send({ email: 'other@example.com' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email already in use');
    });

    it('updates password with correct current password', async () => {
      const { agent } = await createAuthenticatedAgent(
        app,
        'testuser',
        'test@example.com',
        'Wh1sk3yTest!!'
      );

      const response = await agent.put('/api/auth/profile').send({
        currentPassword: 'Wh1sk3yTest!!',
        newPassword: 'N3wPassTest!!',
      });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Profile updated successfully');

      // Verify new password works
      const loginResponse = await request(app).post('/api/auth/login').send({
        username: 'testuser',
        password: 'N3wPassTest!!',
      });

      expect(loginResponse.status).toBe(200);
    });

    it('rejects password change with wrong current password', async () => {
      const { agent } = await createAuthenticatedAgent(
        app,
        'testuser',
        'test@example.com',
        'Wh1sk3yTest!!'
      );

      const response = await agent.put('/api/auth/profile').send({
        currentPassword: 'wrongpassword',
        newPassword: 'N3wPassTest!!',
      });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Current password is incorrect');
    });

    it('requires current password when changing password', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const response = await agent.put('/api/auth/profile').send({ newPassword: 'N3wPassTest!!' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Current password is required to change password');
    });

    it('does not return password in response', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const response = await agent.put('/api/auth/profile').send({ firstName: 'John' });

      expect(response.status).toBe(200);
      expect(response.body.user.password).toBeUndefined();
    });

    it('validates email format', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const response = await agent.put('/api/auth/profile').send({ email: 'invalid-email' });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('validates new password complexity', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const response = await agent.put('/api/auth/profile').send({
        currentPassword: 'Wh1sk3yTest!!',
        newPassword: '12345',
      });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('POST /api/auth/profile/photo', () => {
    it('returns 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .post('/api/auth/profile/photo')
        .attach('photo', Buffer.from('fake image'), 'test.jpg');

      expect(response.status).toBe(401);
    });

    it('uploads a valid image file', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      // Create a minimal valid JPEG buffer (smallest valid JPEG)
      const jpegBuffer = Buffer.from([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00,
        0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06,
        0x05, 0x08, 0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b,
        0x0c, 0x19, 0x12, 0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20,
        0x24, 0x2e, 0x27, 0x20, 0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29, 0x2c, 0x30, 0x31,
        0x34, 0x34, 0x34, 0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32, 0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff,
        0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00,
        0x1f, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b,
        0xff, 0xc4, 0x00, 0xb5, 0x10, 0x00, 0x02, 0x01, 0x03, 0x03, 0x02, 0x04, 0x03, 0x05, 0x05,
        0x04, 0x04, 0x00, 0x00, 0x01, 0x7d, 0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21,
        0x31, 0x41, 0x06, 0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xa1, 0x08,
        0x23, 0x42, 0xb1, 0xc1, 0x15, 0x52, 0xd1, 0xf0, 0x24, 0x33, 0x62, 0x72, 0x82, 0x09, 0x0a,
        0x16, 0x17, 0x18, 0x19, 0x1a, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2a, 0x34, 0x35, 0x36, 0x37,
        0x38, 0x39, 0x3a, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4a, 0x53, 0x54, 0x55, 0x56,
        0x57, 0x58, 0x59, 0x5a, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6a, 0x73, 0x74, 0x75,
        0x76, 0x77, 0x78, 0x79, 0x7a, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89, 0x8a, 0x92, 0x93,
        0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9a, 0xa2, 0xa3, 0xa4, 0xa5, 0xa6, 0xa7, 0xa8, 0xa9,
        0xaa, 0xb2, 0xb3, 0xb4, 0xb5, 0xb6, 0xb7, 0xb8, 0xb9, 0xba, 0xc2, 0xc3, 0xc4, 0xc5, 0xc6,
        0xc7, 0xc8, 0xc9, 0xca, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda, 0xe1, 0xe2,
        0xe3, 0xe4, 0xe5, 0xe6, 0xe7, 0xe8, 0xe9, 0xea, 0xf1, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7,
        0xf8, 0xf9, 0xfa, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, 0xfb, 0xd5,
        0xdb, 0x20, 0xa8, 0xa8, 0xa8, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0xff, 0xd9,
      ]);

      const response = await agent
        .post('/api/auth/profile/photo')
        .attach('photo', jpegBuffer, { filename: 'test.jpg', contentType: 'image/jpeg' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Profile photo updated successfully');
      expect(response.body.user.profile_photo).toContain('/uploads/profiles/');
    });

    it('rejects invalid file types', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const response = await agent
        .post('/api/auth/profile/photo')
        .attach('photo', Buffer.from('not an image'), {
          filename: 'test.txt',
          contentType: 'text/plain',
        });

      // Multer throws error which is caught by error handler
      expect(response.status).toBe(500);
      expect(response.body.error).toContain('Invalid file type');
    });

    it('returns 400 when no file is uploaded', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const response = await agent.post('/api/auth/profile/photo').send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('No file uploaded');
    });
  });

  describe('DELETE /api/auth/profile/photo', () => {
    it('returns 401 for unauthenticated requests', async () => {
      const response = await request(app).delete('/api/auth/profile/photo');
      expect(response.status).toBe(401);
    });

    it('returns 400 when user has no profile photo', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const response = await agent.delete('/api/auth/profile/photo');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('No profile photo to delete');
    });

    it('deletes existing profile photo', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      // First upload a photo
      const jpegBuffer = Buffer.from([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00,
        0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06,
        0x05, 0x08, 0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b,
        0x0c, 0x19, 0x12, 0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20,
        0x24, 0x2e, 0x27, 0x20, 0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29, 0x2c, 0x30, 0x31,
        0x34, 0x34, 0x34, 0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32, 0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff,
        0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00,
        0x1f, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b,
        0xff, 0xc4, 0x00, 0xb5, 0x10, 0x00, 0x02, 0x01, 0x03, 0x03, 0x02, 0x04, 0x03, 0x05, 0x05,
        0x04, 0x04, 0x00, 0x00, 0x01, 0x7d, 0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21,
        0x31, 0x41, 0x06, 0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xa1, 0x08,
        0x23, 0x42, 0xb1, 0xc1, 0x15, 0x52, 0xd1, 0xf0, 0x24, 0x33, 0x62, 0x72, 0x82, 0x09, 0x0a,
        0x16, 0x17, 0x18, 0x19, 0x1a, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2a, 0x34, 0x35, 0x36, 0x37,
        0x38, 0x39, 0x3a, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4a, 0x53, 0x54, 0x55, 0x56,
        0x57, 0x58, 0x59, 0x5a, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6a, 0x73, 0x74, 0x75,
        0x76, 0x77, 0x78, 0x79, 0x7a, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89, 0x8a, 0x92, 0x93,
        0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9a, 0xa2, 0xa3, 0xa4, 0xa5, 0xa6, 0xa7, 0xa8, 0xa9,
        0xaa, 0xb2, 0xb3, 0xb4, 0xb5, 0xb6, 0xb7, 0xb8, 0xb9, 0xba, 0xc2, 0xc3, 0xc4, 0xc5, 0xc6,
        0xc7, 0xc8, 0xc9, 0xca, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda, 0xe1, 0xe2,
        0xe3, 0xe4, 0xe5, 0xe6, 0xe7, 0xe8, 0xe9, 0xea, 0xf1, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7,
        0xf8, 0xf9, 0xfa, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, 0xfb, 0xd5,
        0xdb, 0x20, 0xa8, 0xa8, 0xa8, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0xff, 0xd9,
      ]);

      await agent
        .post('/api/auth/profile/photo')
        .attach('photo', jpegBuffer, { filename: 'test.jpg', contentType: 'image/jpeg' });

      // Then delete it
      const response = await agent.delete('/api/auth/profile/photo');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Profile photo deleted successfully');
      expect(response.body.user.profile_photo).toBeFalsy();
    });
  });

  describe('POST /api/auth/verify-email', () => {
    it('verifies email with valid code', async () => {
      // Create unverified user with verification code
      const user = await createTestUser('unverified', 'unverified@test.com', 'Wh1sk3yTest!!');
      const code = 'TESTCODE';
      testDb
        .prepare(
          `
        UPDATE users
        SET email_verified = 0,
            verification_code = ?,
            verification_code_expires_at = datetime('now', '+1 hour'),
            verification_code_attempts = 0
        WHERE id = ?
      `
        )
        .run(code, user.id);

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ email: 'unverified@test.com', code });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Email verified successfully');
    });

    it('returns 404 for non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ email: 'nonexistent@test.com', code: 'TESTCODE' });

      expect(response.status).toBe(404);
    });

    it('returns 400 for already verified email', async () => {
      await createTestUser('verified', 'verified@test.com', 'Wh1sk3yTest!!');

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ email: 'verified@test.com', code: 'TESTCODE' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email is already verified');
    });

    it('returns 429 after too many attempts', async () => {
      const user = await createTestUser('toomany', 'toomany@test.com', 'Wh1sk3yTest!!');
      testDb
        .prepare(
          `
        UPDATE users
        SET email_verified = 0,
            verification_code = 'CODE1234',
            verification_code_expires_at = datetime('now', '+1 hour'),
            verification_code_attempts = 5
        WHERE id = ?
      `
        )
        .run(user.id);

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ email: 'toomany@test.com', code: 'WRONGCOD' });

      expect(response.status).toBe(429);
    });

    it('returns 400 for expired code', async () => {
      const user = await createTestUser('expired', 'expired@test.com', 'Wh1sk3yTest!!');
      const expiredDate = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
      testDb
        .prepare(
          `
        UPDATE users
        SET email_verified = 0,
            verification_code = 'CODE1234',
            verification_code_expires_at = ?,
            verification_code_attempts = 0
        WHERE id = ?
      `
        )
        .run(expiredDate, user.id);

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ email: 'expired@test.com', code: 'CODE1234' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('expired');
    });

    it('returns 400 for invalid code', async () => {
      const user = await createTestUser('wrongcode', 'wrongcode@test.com', 'Wh1sk3yTest!!');
      testDb
        .prepare(
          `
        UPDATE users
        SET email_verified = 0,
            verification_code = 'REALCODE',
            verification_code_expires_at = datetime('now', '+1 hour'),
            verification_code_attempts = 0
        WHERE id = ?
      `
        )
        .run(user.id);

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ email: 'wrongcode@test.com', code: 'WRONGCOD' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid verification code');
    });
  });

  describe('POST /api/auth/resend-verification', () => {
    it('resends verification code for unverified user', async () => {
      const user = await createTestUser('resend', 'resend@test.com', 'Wh1sk3yTest!!');
      testDb.prepare('UPDATE users SET email_verified = 0 WHERE id = ?').run(user.id);

      const response = await request(app)
        .post('/api/auth/resend-verification')
        .send({ email: 'resend@test.com' });

      expect(response.status).toBe(200);
    });

    it('returns success for non-existent user (security)', async () => {
      const response = await request(app)
        .post('/api/auth/resend-verification')
        .send({ email: 'nonexistent@test.com' });

      expect(response.status).toBe(200);
    });

    it('returns 400 for already verified email', async () => {
      await createTestUser('alreadyverified', 'alreadyverified@test.com', 'Wh1sk3yTest!!');

      const response = await request(app)
        .post('/api/auth/resend-verification')
        .send({ email: 'alreadyverified@test.com' });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('sends password reset email for existing user', async () => {
      await createTestUser('forgot', 'forgot@test.com', 'Wh1sk3yTest!!');

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'forgot@test.com' });

      expect(response.status).toBe(200);
    });

    it('returns success for non-existent user (security)', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@test.com' });

      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('resets password with valid token', async () => {
      const user = await createTestUser('reset', 'reset@test.com', 'Wh1sk3yTest!!');
      const token = 'valid-reset-token';
      testDb
        .prepare(
          `
        UPDATE users
        SET password_reset_token = ?,
            password_reset_expires_at = datetime('now', '+1 hour')
        WHERE id = ?
      `
        )
        .run(token, user.id);

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token, password: 'N3wPassReset!!' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Password has been reset successfully');
    });

    it('returns 400 for invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'invalid-token', password: 'N3wPassReset!!' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid or expired reset token');
    });

    it('returns 400 for expired token', async () => {
      const user = await createTestUser('expiredreset', 'expiredreset@test.com', 'Wh1sk3yTest!!');
      const token = 'expired-token';
      const expiredDate = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
      testDb
        .prepare(
          `
        UPDATE users
        SET password_reset_token = ?,
            password_reset_expires_at = ?
        WHERE id = ?
      `
        )
        .run(token, expiredDate, user.id);

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token, password: 'N3wPassReset!!' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('expired');
    });
  });

  describe('POST /api/auth/login error handling', () => {
    it('returns 403 for unverified email', async () => {
      const user = await createTestUser(
        'unverifiedlogin',
        'unverifiedlogin@test.com',
        'Wh1sk3yTest!!'
      );
      testDb.prepare('UPDATE users SET email_verified = 0 WHERE id = ?').run(user.id);

      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'unverifiedlogin', password: 'Wh1sk3yTest!!' });

      expect(response.status).toBe(403);
      expect(response.body.requiresVerification).toBe(true);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('logs out authenticated user', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const response = await agent.post('/api/auth/logout');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Logout successful');
    });
  });

  describe('PATCH /api/auth/settings/visibility', () => {
    it('returns 401 without authentication', async () => {
      const response = await request(app)
        .patch('/api/auth/settings/visibility')
        .send({ isPublic: true });

      expect(response.status).toBe(401);
    });

    it('makes profile public', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const response = await agent.patch('/api/auth/settings/visibility').send({ isPublic: true });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Profile is now public');
      expect(response.body.user.is_profile_public).toBe(1);
    });

    it('makes profile private', async () => {
      const { agent, user } = await createAuthenticatedAgent(app);

      // First make it public
      await agent.patch('/api/auth/settings/visibility').send({ isPublic: true });

      // Then make it private
      const response = await agent.patch('/api/auth/settings/visibility').send({ isPublic: false });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Profile is now private');
      expect(response.body.user.is_profile_public).toBe(0);
    });

    it('returns 400 when isPublic is not a boolean', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const response = await agent.patch('/api/auth/settings/visibility').send({ isPublic: 'yes' });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].msg).toBe('isPublic must be a boolean');
    });

    it('returns 400 when isPublic is missing', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const response = await agent.patch('/api/auth/settings/visibility').send({});

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].msg).toBe('isPublic must be a boolean');
    });

    it('does not return password in response', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const response = await agent.patch('/api/auth/settings/visibility').send({ isPublic: true });

      expect(response.status).toBe(200);
      expect(response.body.user.password).toBeUndefined();
    });

    it('persists visibility setting', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      // Make public
      await agent.patch('/api/auth/settings/visibility').send({ isPublic: true });

      // Check current user
      const meResponse = await agent.get('/api/auth/me');

      expect(meResponse.status).toBe(200);
      expect(meResponse.body.user.is_profile_public).toBe(1);
    });
  });
});
