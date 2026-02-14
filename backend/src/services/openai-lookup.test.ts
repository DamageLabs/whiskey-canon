import { describe, it, expect, vi, beforeEach } from 'vitest';
import { lookupByName, lookupByImage } from './openai-lookup';

// Mock the OpenAI SDK
const mockCreate = vi.fn();
vi.mock('openai', () => {
  return {
    default: class MockOpenAI {
      chat = { completions: { create: mockCreate } };
    },
  };
});

describe('openai-lookup service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('lookupByName', () => {
    it('returns parsed data for a recognized whiskey', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                name: 'Buffalo Trace Kentucky Straight Bourbon',
                type: 'bourbon',
                distillery: 'Buffalo Trace Distillery',
                region: 'Kentucky',
                country: 'USA',
                abv: 45,
                proof: 90,
                size: '750ml',
                description: 'A balanced bourbon.',
              }),
            },
          },
        ],
      });

      const result = await lookupByName('test-api-key', 'Buffalo Trace');

      expect(result).not.toBeNull();
      expect(result!.name).toBe('Buffalo Trace Kentucky Straight Bourbon');
      expect(result!.type).toBe('bourbon');
      expect(result!.distillery).toBe('Buffalo Trace Distillery');
      expect(result!.abv).toBe(45);

      // Verify SDK was called with correct model
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4o-mini',
          max_tokens: 1024,
        })
      );
    });

    it('returns null for unrecognized whiskey', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({ error: 'unrecognized' }),
            },
          },
        ],
      });

      const result = await lookupByName('test-api-key', 'Totally Fake Whiskey');
      expect(result).toBeNull();
    });

    it('returns null when response has no content', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: null } }],
      });

      const result = await lookupByName('test-api-key', 'Buffalo Trace');
      expect(result).toBeNull();
    });

    it('returns null when choices array is empty', async () => {
      mockCreate.mockResolvedValue({
        choices: [],
      });

      const result = await lookupByName('test-api-key', 'Buffalo Trace');
      expect(result).toBeNull();
    });

    it('handles markdown-fenced JSON response', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content:
                '```json\n{"name": "Angel\'s Envy", "type": "bourbon", "distillery": "Angel\'s Envy Distillery"}\n```',
            },
          },
        ],
      });

      const result = await lookupByName('test-api-key', "Angel's Envy");
      expect(result).not.toBeNull();
      expect(result!.name).toBe("Angel's Envy");
      expect(result!.type).toBe('bourbon');
    });
  });

  describe('lookupByImage', () => {
    it('returns parsed data for a recognized label', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                name: 'Lagavulin 16 Year Old',
                type: 'scotch',
                distillery: 'Lagavulin',
                region: 'Islay',
                country: 'Scotland',
                age: 16,
                abv: 43,
              }),
            },
          },
        ],
      });

      const imageBuffer = Buffer.from('fake-image-data');
      const result = await lookupByImage('test-api-key', imageBuffer, 'image/jpeg');

      expect(result).not.toBeNull();
      expect(result!.name).toBe('Lagavulin 16 Year Old');
      expect(result!.type).toBe('scotch');
      expect(result!.age).toBe(16);

      // Verify SDK was called with vision model and image_url content
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4o',
          max_tokens: 1024,
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: expect.arrayContaining([expect.objectContaining({ type: 'image_url' })]),
            }),
          ]),
        })
      );
    });

    it('returns null for unrecognized image', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({ error: 'unrecognized' }),
            },
          },
        ],
      });

      const result = await lookupByImage('test-api-key', Buffer.from('img'), 'image/png');
      expect(result).toBeNull();
    });

    it('returns null when response has no content', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: null } }],
      });

      const result = await lookupByImage('test-api-key', Buffer.from('img'), 'image/webp');
      expect(result).toBeNull();
    });
  });
});
