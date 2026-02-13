import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createTestApp, createAuthenticatedAgent } from '../test/helpers';
import { UserModel } from '../models/User';
import type { Application } from 'express';

// Shared mock for the messages.create method
const mockCreate = vi.fn().mockResolvedValue({
  content: [{ type: 'text', text: 'Hi' }],
});

// Mock the Anthropic SDK to prevent real API calls during key validation
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class MockAnthropic {
      messages = { create: mockCreate };
    },
  };
});

describe('API Key Routes', () => {
  let app: Application;

  beforeEach(() => {
    app = createTestApp();
    mockCreate.mockReset().mockResolvedValue({
      content: [{ type: 'text', text: 'Hi' }],
    });
  });

  describe('GET /api/auth/api-key', () => {
    it('returns 401 without auth', async () => {
      const response = await request(app).get('/api/auth/api-key');
      expect(response.status).toBe(401);
    });

    it('returns hasKey: false when no key stored', async () => {
      const { agent } = await createAuthenticatedAgent(app);
      const response = await agent.get('/api/auth/api-key');
      expect(response.status).toBe(200);
      expect(response.body.hasKey).toBe(false);
      expect(response.body.lastFour).toBeNull();
    });

    it('returns hasKey: true with last four chars when key exists', async () => {
      const { agent, user } = await createAuthenticatedAgent(app);
      UserModel.saveApiKey(user.id, 'sk-ant-api03-test1234');
      const response = await agent.get('/api/auth/api-key');
      expect(response.status).toBe(200);
      expect(response.body.hasKey).toBe(true);
      expect(response.body.lastFour).toBe('1234');
    });
  });

  describe('PUT /api/auth/api-key', () => {
    it('returns 401 without auth', async () => {
      const response = await request(app).put('/api/auth/api-key').send({ apiKey: 'sk-ant-test' });
      expect(response.status).toBe(401);
    });

    it('saves a valid API key', async () => {
      const { agent, user } = await createAuthenticatedAgent(app);
      const response = await agent
        .put('/api/auth/api-key')
        .send({ apiKey: 'sk-ant-api03-validkey5678' });
      expect(response.status).toBe(200);
      expect(response.body.message).toContain('saved');
      expect(response.body.lastFour).toBe('5678');

      // Verify it's stored and retrievable
      const storedKey = UserModel.getApiKey(user.id);
      expect(storedKey).toBe('sk-ant-api03-validkey5678');
    });

    it('returns 400 for too-short key', async () => {
      const { agent } = await createAuthenticatedAgent(app);
      const response = await agent.put('/api/auth/api-key').send({ apiKey: 'short' });
      expect(response.status).toBe(400);
    });

    it('returns 400 when Anthropic rejects the key as invalid', async () => {
      // Simulate a 401 authentication error
      mockCreate.mockRejectedValueOnce({
        status: 401,
        error: { type: 'authentication_error' },
      });

      const { agent } = await createAuthenticatedAgent(app);
      const response = await agent
        .put('/api/auth/api-key')
        .send({ apiKey: 'sk-ant-api03-invalid-key-here' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid API key');
    });

    it('still saves key when Anthropic returns a non-auth error', async () => {
      // Simulate a rate limit error (not auth)
      mockCreate.mockRejectedValueOnce({
        status: 429,
        error: { type: 'rate_limit_error' },
      });

      const { agent, user } = await createAuthenticatedAgent(app);
      const response = await agent
        .put('/api/auth/api-key')
        .send({ apiKey: 'sk-ant-api03-ratelimited-key' });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('saved');

      // Verify it's actually stored
      expect(UserModel.getApiKey(user.id)).toBe('sk-ant-api03-ratelimited-key');
    });
  });

  describe('DELETE /api/auth/api-key', () => {
    it('returns 401 without auth', async () => {
      const response = await request(app).delete('/api/auth/api-key');
      expect(response.status).toBe(401);
    });

    it('deletes an existing API key', async () => {
      const { agent, user } = await createAuthenticatedAgent(app);
      UserModel.saveApiKey(user.id, 'sk-ant-api03-test1234');

      const response = await agent.delete('/api/auth/api-key');
      expect(response.status).toBe(200);
      expect(response.body.message).toContain('deleted');

      // Verify it's gone
      expect(UserModel.hasApiKey(user.id)).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('includes has_api_key but not the key itself', async () => {
      const { agent, user } = await createAuthenticatedAgent(app);
      UserModel.saveApiKey(user.id, 'sk-ant-api03-secret');

      const response = await agent.get('/api/auth/me');
      expect(response.status).toBe(200);
      expect(response.body.user.has_api_key).toBe(true);
      expect(response.body.user.anthropic_api_key).toBeUndefined();
      expect(response.body.user.password).toBeUndefined();
    });
  });
});
