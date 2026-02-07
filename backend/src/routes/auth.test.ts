import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createTestApp, createTestUser, createAuthenticatedAgent } from '../test/helpers';
import { Role } from '../types';
import type { Application } from 'express';
import { testDb } from '../test/setup';
import * as emailUtils from '../utils/email';

// Mock email functions
vi.mock('../utils/email', () => ({
  sendVerificationEmail: vi.fn().mockResolvedValue(true),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(true)
}));


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
      expect(response.body.message).toContain('User created successfully');
      expect(response.body.requiresVerification).toBe(true);
      expect(response.body.email).toBe('new@example.com');
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

    it('does not return user details for security (requires verification)', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'newuser',
          email: 'new@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(201);
      expect(response.body.user).toBeUndefined();
      expect(response.body.requiresVerification).toBe(true);
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
      expect(response.body.requiresVerification).toBe(true);
      expect(response.body.email).toBe('new@example.com');
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
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
        0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
        0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
        0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
        0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
        0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
        0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
        0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00,
        0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
        0x09, 0x0A, 0x0B, 0xFF, 0xC4, 0x00, 0xB5, 0x10, 0x00, 0x02, 0x01, 0x03,
        0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04, 0x00, 0x00, 0x01, 0x7D,
        0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06,
        0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xA1, 0x08,
        0x23, 0x42, 0xB1, 0xC1, 0x15, 0x52, 0xD1, 0xF0, 0x24, 0x33, 0x62, 0x72,
        0x82, 0x09, 0x0A, 0x16, 0x17, 0x18, 0x19, 0x1A, 0x25, 0x26, 0x27, 0x28,
        0x29, 0x2A, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3A, 0x43, 0x44, 0x45,
        0x46, 0x47, 0x48, 0x49, 0x4A, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59,
        0x5A, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6A, 0x73, 0x74, 0x75,
        0x76, 0x77, 0x78, 0x79, 0x7A, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89,
        0x8A, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9A, 0xA2, 0xA3,
        0xA4, 0xA5, 0xA6, 0xA7, 0xA8, 0xA9, 0xAA, 0xB2, 0xB3, 0xB4, 0xB5, 0xB6,
        0xB7, 0xB8, 0xB9, 0xBA, 0xC2, 0xC3, 0xC4, 0xC5, 0xC6, 0xC7, 0xC8, 0xC9,
        0xCA, 0xD2, 0xD3, 0xD4, 0xD5, 0xD6, 0xD7, 0xD8, 0xD9, 0xDA, 0xE1, 0xE2,
        0xE3, 0xE4, 0xE5, 0xE6, 0xE7, 0xE8, 0xE9, 0xEA, 0xF1, 0xF2, 0xF3, 0xF4,
        0xF5, 0xF6, 0xF7, 0xF8, 0xF9, 0xFA, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01,
        0x00, 0x00, 0x3F, 0x00, 0xFB, 0xD5, 0xDB, 0x20, 0xA8, 0xA8, 0xA8, 0x02,
        0x8A, 0x28, 0xA0, 0x02, 0x8A, 0x28, 0xA0, 0xFF, 0xD9
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
        .attach('photo', Buffer.from('not an image'), { filename: 'test.txt', contentType: 'text/plain' });

      // Multer throws error which is caught by error handler
      expect(response.status).toBe(500);
      expect(response.body.error).toContain('Invalid file type');
    });

    it('returns 400 when no file is uploaded', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const response = await agent
        .post('/api/auth/profile/photo')
        .send({});

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
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
        0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
        0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
        0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
        0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
        0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
        0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
        0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00,
        0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
        0x09, 0x0A, 0x0B, 0xFF, 0xC4, 0x00, 0xB5, 0x10, 0x00, 0x02, 0x01, 0x03,
        0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04, 0x00, 0x00, 0x01, 0x7D,
        0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06,
        0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xA1, 0x08,
        0x23, 0x42, 0xB1, 0xC1, 0x15, 0x52, 0xD1, 0xF0, 0x24, 0x33, 0x62, 0x72,
        0x82, 0x09, 0x0A, 0x16, 0x17, 0x18, 0x19, 0x1A, 0x25, 0x26, 0x27, 0x28,
        0x29, 0x2A, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3A, 0x43, 0x44, 0x45,
        0x46, 0x47, 0x48, 0x49, 0x4A, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59,
        0x5A, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6A, 0x73, 0x74, 0x75,
        0x76, 0x77, 0x78, 0x79, 0x7A, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89,
        0x8A, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9A, 0xA2, 0xA3,
        0xA4, 0xA5, 0xA6, 0xA7, 0xA8, 0xA9, 0xAA, 0xB2, 0xB3, 0xB4, 0xB5, 0xB6,
        0xB7, 0xB8, 0xB9, 0xBA, 0xC2, 0xC3, 0xC4, 0xC5, 0xC6, 0xC7, 0xC8, 0xC9,
        0xCA, 0xD2, 0xD3, 0xD4, 0xD5, 0xD6, 0xD7, 0xD8, 0xD9, 0xDA, 0xE1, 0xE2,
        0xE3, 0xE4, 0xE5, 0xE6, 0xE7, 0xE8, 0xE9, 0xEA, 0xF1, 0xF2, 0xF3, 0xF4,
        0xF5, 0xF6, 0xF7, 0xF8, 0xF9, 0xFA, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01,
        0x00, 0x00, 0x3F, 0x00, 0xFB, 0xD5, 0xDB, 0x20, 0xA8, 0xA8, 0xA8, 0x02,
        0x8A, 0x28, 0xA0, 0x02, 0x8A, 0x28, 0xA0, 0xFF, 0xD9
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
      const user = await createTestUser('unverified', 'unverified@test.com', 'password123');
      const code = 'TESTCODE';
      testDb.prepare(`
        UPDATE users
        SET email_verified = 0,
            verification_code = ?,
            verification_code_expires_at = datetime('now', '+1 hour'),
            verification_code_attempts = 0
        WHERE id = ?
      `).run(code, user.id);

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
      await createTestUser('verified', 'verified@test.com', 'password123');

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ email: 'verified@test.com', code: 'TESTCODE' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email is already verified');
    });

    it('returns 429 after too many attempts', async () => {
      const user = await createTestUser('toomany', 'toomany@test.com', 'password123');
      testDb.prepare(`
        UPDATE users
        SET email_verified = 0,
            verification_code = 'CODE1234',
            verification_code_expires_at = datetime('now', '+1 hour'),
            verification_code_attempts = 5
        WHERE id = ?
      `).run(user.id);

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ email: 'toomany@test.com', code: 'WRONGCOD' });

      expect(response.status).toBe(429);
    });

    it('returns 400 for expired code', async () => {
      const user = await createTestUser('expired', 'expired@test.com', 'password123');
      const expiredDate = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
      testDb.prepare(`
        UPDATE users
        SET email_verified = 0,
            verification_code = 'CODE1234',
            verification_code_expires_at = ?,
            verification_code_attempts = 0
        WHERE id = ?
      `).run(expiredDate, user.id);

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ email: 'expired@test.com', code: 'CODE1234' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('expired');
    });

    it('returns 400 for invalid code', async () => {
      const user = await createTestUser('wrongcode', 'wrongcode@test.com', 'password123');
      testDb.prepare(`
        UPDATE users
        SET email_verified = 0,
            verification_code = 'REALCODE',
            verification_code_expires_at = datetime('now', '+1 hour'),
            verification_code_attempts = 0
        WHERE id = ?
      `).run(user.id);

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ email: 'wrongcode@test.com', code: 'WRONGCOD' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid verification code');
    });
  });

  describe('POST /api/auth/resend-verification', () => {
    it('resends verification code for unverified user', async () => {
      const user = await createTestUser('resend', 'resend@test.com', 'password123');
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
      await createTestUser('alreadyverified', 'alreadyverified@test.com', 'password123');

      const response = await request(app)
        .post('/api/auth/resend-verification')
        .send({ email: 'alreadyverified@test.com' });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('sends password reset email for existing user', async () => {
      await createTestUser('forgot', 'forgot@test.com', 'password123');

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
      const user = await createTestUser('reset', 'reset@test.com', 'password123');
      const token = 'valid-reset-token';
      testDb.prepare(`
        UPDATE users
        SET password_reset_token = ?,
            password_reset_expires_at = datetime('now', '+1 hour')
        WHERE id = ?
      `).run(token, user.id);

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token, password: 'newpassword123' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Password has been reset successfully');
    });

    it('returns 400 for invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'invalid-token', password: 'newpassword123' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid or expired reset token');
    });

    it('returns 400 for expired token', async () => {
      const user = await createTestUser('expiredreset', 'expiredreset@test.com', 'password123');
      const token = 'expired-token';
      const expiredDate = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
      testDb.prepare(`
        UPDATE users
        SET password_reset_token = ?,
            password_reset_expires_at = ?
        WHERE id = ?
      `).run(token, expiredDate, user.id);

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token, password: 'newpassword123' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('expired');
    });
  });

  describe('POST /api/auth/login error handling', () => {
    it('returns 403 for unverified email', async () => {
      const user = await createTestUser('unverifiedlogin', 'unverifiedlogin@test.com', 'password123');
      testDb.prepare('UPDATE users SET email_verified = 0 WHERE id = ?').run(user.id);

      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'unverifiedlogin', password: 'password123' });

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

      const response = await agent
        .patch('/api/auth/settings/visibility')
        .send({ isPublic: true });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Profile is now public');
      expect(response.body.user.is_profile_public).toBe(1);
    });

    it('makes profile private', async () => {
      const { agent, user } = await createAuthenticatedAgent(app);

      // First make it public
      await agent
        .patch('/api/auth/settings/visibility')
        .send({ isPublic: true });

      // Then make it private
      const response = await agent
        .patch('/api/auth/settings/visibility')
        .send({ isPublic: false });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Profile is now private');
      expect(response.body.user.is_profile_public).toBe(0);
    });

    it('returns 400 when isPublic is not a boolean', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const response = await agent
        .patch('/api/auth/settings/visibility')
        .send({ isPublic: 'yes' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('isPublic must be a boolean');
    });

    it('returns 400 when isPublic is missing', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const response = await agent
        .patch('/api/auth/settings/visibility')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('isPublic must be a boolean');
    });

    it('does not return password in response', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const response = await agent
        .patch('/api/auth/settings/visibility')
        .send({ isPublic: true });

      expect(response.status).toBe(200);
      expect(response.body.user.password).toBeUndefined();
    });

    it('persists visibility setting', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      // Make public
      await agent
        .patch('/api/auth/settings/visibility')
        .send({ isPublic: true });

      // Check current user
      const meResponse = await agent.get('/api/auth/me');

      expect(meResponse.status).toBe(200);
      expect(meResponse.body.user.is_profile_public).toBe(1);
    });
  });
});
