import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createTestApp, createAuthenticatedAgent } from '../test/helpers';
import { UserModel } from '../models/User';
import type { Application } from 'express';

// Shared mock for the Anthropic messages.create method
const mockAnthropicCreate = vi.fn().mockResolvedValue({
  content: [{ type: 'text', text: 'Hi' }],
});

// Shared mock for the OpenAI chat.completions.create method
const mockOpenaiCreate = vi.fn().mockResolvedValue({
  choices: [{ message: { content: 'Hi' } }],
});

// Mock the Anthropic SDK to prevent real API calls during key validation
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class MockAnthropic {
      messages = { create: mockAnthropicCreate };
    },
  };
});

// Mock the OpenAI SDK to prevent real API calls during key validation
vi.mock('openai', () => {
  return {
    default: class MockOpenAI {
      chat = { completions: { create: mockOpenaiCreate } };
    },
  };
});

describe('API Key Routes', () => {
  let app: Application;

  beforeEach(() => {
    app = createTestApp();
    mockAnthropicCreate.mockReset().mockResolvedValue({
      content: [{ type: 'text', text: 'Hi' }],
    });
    mockOpenaiCreate.mockReset().mockResolvedValue({
      choices: [{ message: { content: 'Hi' } }],
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
      mockAnthropicCreate.mockRejectedValueOnce({
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
      mockAnthropicCreate.mockRejectedValueOnce({
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
    it('includes has_api_key, has_openai_key, and ai_provider', async () => {
      const { agent, user } = await createAuthenticatedAgent(app);
      UserModel.saveApiKey(user.id, 'sk-ant-api03-secret', 'anthropic');
      UserModel.saveApiKey(user.id, 'sk-openai-test-key', 'openai');

      const response = await agent.get('/api/auth/me');
      expect(response.status).toBe(200);
      expect(response.body.user.has_api_key).toBe(true);
      expect(response.body.user.has_openai_key).toBe(true);
      expect(response.body.user.ai_provider).toBe('anthropic');
      expect(response.body.user.anthropic_api_key).toBeUndefined();
      expect(response.body.user.openai_api_key).toBeUndefined();
      expect(response.body.user.password).toBeUndefined();
    });
  });

  describe('Provider parameter on GET /api/auth/api-key', () => {
    it('returns OpenAI key status when provider=openai', async () => {
      const { agent, user } = await createAuthenticatedAgent(app);
      UserModel.saveApiKey(user.id, 'sk-openai-test-1234', 'openai');

      const response = await agent.get('/api/auth/api-key?provider=openai');
      expect(response.status).toBe(200);
      expect(response.body.hasKey).toBe(true);
      expect(response.body.lastFour).toBe('1234');
    });

    it('returns Anthropic key status by default', async () => {
      const { agent, user } = await createAuthenticatedAgent(app);
      UserModel.saveApiKey(user.id, 'sk-ant-api03-test5678', 'anthropic');

      const response = await agent.get('/api/auth/api-key');
      expect(response.status).toBe(200);
      expect(response.body.hasKey).toBe(true);
      expect(response.body.lastFour).toBe('5678');
    });
  });

  describe('Provider parameter on PUT /api/auth/api-key', () => {
    it('saves an OpenAI key when provider=openai', async () => {
      const { agent, user } = await createAuthenticatedAgent(app);
      const response = await agent
        .put('/api/auth/api-key')
        .send({ apiKey: 'sk-openai-validkey9999', provider: 'openai' });
      expect(response.status).toBe(200);
      expect(response.body.lastFour).toBe('9999');

      // Verify it's stored for the openai provider
      const storedKey = UserModel.getApiKey(user.id, 'openai');
      expect(storedKey).toBe('sk-openai-validkey9999');
    });

    it('returns 400 when OpenAI rejects the key', async () => {
      mockOpenaiCreate.mockRejectedValueOnce({
        status: 401,
        error: { type: 'authentication_error' },
      });

      const { agent } = await createAuthenticatedAgent(app);
      const response = await agent
        .put('/api/auth/api-key')
        .send({ apiKey: 'sk-openai-invalid-key', provider: 'openai' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid API key');
    });
  });

  describe('Provider parameter on DELETE /api/auth/api-key', () => {
    it('deletes OpenAI key when provider=openai', async () => {
      const { agent, user } = await createAuthenticatedAgent(app);
      UserModel.saveApiKey(user.id, 'sk-openai-todelete', 'openai');

      const response = await agent.delete('/api/auth/api-key?provider=openai');
      expect(response.status).toBe(200);
      expect(response.body.message).toContain('deleted');

      expect(UserModel.hasApiKey(user.id, 'openai')).toBe(false);
    });
  });

  describe('PUT /api/auth/ai-provider', () => {
    it('sets AI provider to openai', async () => {
      const { agent, user } = await createAuthenticatedAgent(app);
      const response = await agent.put('/api/auth/ai-provider').send({ provider: 'openai' });

      expect(response.status).toBe(200);
      expect(response.body.provider).toBe('openai');
      expect(UserModel.getAiProvider(user.id)).toBe('openai');
    });

    it('sets AI provider to anthropic', async () => {
      const { agent, user } = await createAuthenticatedAgent(app);
      UserModel.setAiProvider(user.id, 'openai');

      const response = await agent.put('/api/auth/ai-provider').send({ provider: 'anthropic' });

      expect(response.status).toBe(200);
      expect(response.body.provider).toBe('anthropic');
      expect(UserModel.getAiProvider(user.id)).toBe('anthropic');
    });

    it('returns 400 for invalid provider', async () => {
      const { agent } = await createAuthenticatedAgent(app);
      const response = await agent.put('/api/auth/ai-provider').send({ provider: 'invalid' });

      expect(response.status).toBe(400);
    });

    it('returns 401 without auth', async () => {
      const response = await request(app)
        .put('/api/auth/ai-provider')
        .send({ provider: 'openai' });

      expect(response.status).toBe(401);
    });
  });
});
