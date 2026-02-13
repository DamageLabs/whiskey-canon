import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createTestApp, createAuthenticatedAgent } from '../test/helpers';
import type { Application } from 'express';

// Mock the whiskey-lookup service
vi.mock('../services/whiskey-lookup', () => ({
  lookupByName: vi.fn(),
  lookupByImage: vi.fn(),
}));

import { lookupByName, lookupByImage } from '../services/whiskey-lookup';

const mockLookupByName = vi.mocked(lookupByName);
const mockLookupByImage = vi.mocked(lookupByImage);

describe('Lookup Routes', () => {
  let app: Application;

  beforeEach(() => {
    app = createTestApp();
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('returns 401 without auth', async () => {
      const response = await request(app)
        .post('/api/whiskeys/lookup')
        .send({ name: 'Buffalo Trace' });
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/whiskeys/lookup (text)', () => {
    it('returns 400 when no API key configured', async () => {
      const { agent } = await createAuthenticatedAgent(app);
      // anthropicApiKey is null in test config by default
      const response = await agent
        .post('/api/whiskeys/lookup')
        .send({ name: 'Buffalo Trace' });
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('No API key configured');
    });

    it('returns 400 when neither name nor image provided', async () => {
      // Override config to have an API key
      const configMock = await import('../utils/config');
      Object.defineProperty(configMock.config, 'anthropicApiKey', {
        value: 'test-key',
        writable: true,
        configurable: true,
      });

      const { agent } = await createAuthenticatedAgent(app);
      const response = await agent
        .post('/api/whiskeys/lookup')
        .send({});
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('name');

      // Reset
      Object.defineProperty(configMock.config, 'anthropicApiKey', {
        value: null,
        writable: true,
        configurable: true,
      });
    });

    it('returns structured data for text lookup', async () => {
      const configMock = await import('../utils/config');
      Object.defineProperty(configMock.config, 'anthropicApiKey', {
        value: 'test-key',
        writable: true,
        configurable: true,
      });

      mockLookupByName.mockResolvedValue({
        name: 'Buffalo Trace Kentucky Straight Bourbon',
        type: 'bourbon',
        distillery: 'Buffalo Trace Distillery',
        region: 'Kentucky',
        country: 'USA',
        abv: 45,
        proof: 90,
        size: '750ml',
        description: 'A well-balanced bourbon with notes of vanilla and caramel.',
      });

      const { agent } = await createAuthenticatedAgent(app);
      const response = await agent
        .post('/api/whiskeys/lookup')
        .send({ name: 'Buffalo Trace' });

      expect(response.status).toBe(200);
      expect(response.body.found).toBe(true);
      expect(response.body.data.name).toBe('Buffalo Trace Kentucky Straight Bourbon');
      expect(response.body.data.type).toBe('bourbon');
      expect(response.body.data.distillery).toBe('Buffalo Trace Distillery');
      expect(mockLookupByName).toHaveBeenCalledWith('test-key', 'Buffalo Trace');

      Object.defineProperty(configMock.config, 'anthropicApiKey', {
        value: null,
        writable: true,
        configurable: true,
      });
    });

    it('returns found: false for unrecognized whiskey', async () => {
      const configMock = await import('../utils/config');
      Object.defineProperty(configMock.config, 'anthropicApiKey', {
        value: 'test-key',
        writable: true,
        configurable: true,
      });

      mockLookupByName.mockResolvedValue(null);

      const { agent } = await createAuthenticatedAgent(app);
      const response = await agent
        .post('/api/whiskeys/lookup')
        .send({ name: 'Totally Fake Whiskey XYZ' });

      expect(response.status).toBe(200);
      expect(response.body.found).toBe(false);
      expect(response.body.data).toBeUndefined();

      Object.defineProperty(configMock.config, 'anthropicApiKey', {
        value: null,
        writable: true,
        configurable: true,
      });
    });

    it('handles API errors gracefully', async () => {
      const configMock = await import('../utils/config');
      Object.defineProperty(configMock.config, 'anthropicApiKey', {
        value: 'test-key',
        writable: true,
        configurable: true,
      });

      mockLookupByName.mockRejectedValue(new Error('API rate limit exceeded'));

      const { agent } = await createAuthenticatedAgent(app);
      const response = await agent
        .post('/api/whiskeys/lookup')
        .send({ name: 'Buffalo Trace' });

      expect(response.status).toBe(500);
      expect(response.body.error).toContain('Lookup failed');

      Object.defineProperty(configMock.config, 'anthropicApiKey', {
        value: null,
        writable: true,
        configurable: true,
      });
    });
  });

  describe('POST /api/whiskeys/lookup (image)', () => {
    it('returns structured data for image lookup', async () => {
      const configMock = await import('../utils/config');
      Object.defineProperty(configMock.config, 'anthropicApiKey', {
        value: 'test-key',
        writable: true,
        configurable: true,
      });

      mockLookupByImage.mockResolvedValue({
        name: 'Lagavulin 16 Year Old',
        type: 'scotch',
        distillery: 'Lagavulin',
        region: 'Islay',
        country: 'Scotland',
        age: 16,
        abv: 43,
      });

      const { agent } = await createAuthenticatedAgent(app);
      // Create a minimal valid JPEG buffer (JPEG magic bytes)
      const jpegBuffer = Buffer.from([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46,
        0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
        0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
      ]);

      const response = await agent
        .post('/api/whiskeys/lookup')
        .attach('image', jpegBuffer, { filename: 'label.jpg', contentType: 'image/jpeg' });

      expect(response.status).toBe(200);
      expect(response.body.found).toBe(true);
      expect(response.body.data.name).toBe('Lagavulin 16 Year Old');
      expect(response.body.data.type).toBe('scotch');
      expect(mockLookupByImage).toHaveBeenCalled();

      Object.defineProperty(configMock.config, 'anthropicApiKey', {
        value: null,
        writable: true,
        configurable: true,
      });
    });

    it('returns found: false when image is unrecognizable', async () => {
      const configMock = await import('../utils/config');
      Object.defineProperty(configMock.config, 'anthropicApiKey', {
        value: 'test-key',
        writable: true,
        configurable: true,
      });

      mockLookupByImage.mockResolvedValue(null);

      const { agent } = await createAuthenticatedAgent(app);
      const jpegBuffer = Buffer.from([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46,
        0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
        0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
      ]);

      const response = await agent
        .post('/api/whiskeys/lookup')
        .attach('image', jpegBuffer, { filename: 'blurry.jpg', contentType: 'image/jpeg' });

      expect(response.status).toBe(200);
      expect(response.body.found).toBe(false);

      Object.defineProperty(configMock.config, 'anthropicApiKey', {
        value: null,
        writable: true,
        configurable: true,
      });
    });
  });
});
