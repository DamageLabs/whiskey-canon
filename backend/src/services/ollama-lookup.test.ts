import { describe, it, expect, vi, beforeEach } from 'vitest';
import { lookupByName, lookupByImage } from './ollama-lookup';

// Mock the OpenAI SDK (used via baseURL override for Ollama)
const mockCreate = vi.fn();
vi.mock('openai', () => {
  return {
    default: class MockOpenAI {
      chat = { completions: { create: mockCreate } };
      constructor(opts: any) {
        // Verify baseURL is set for Ollama
        if (opts.baseURL) {
          (MockOpenAI as any).lastBaseURL = opts.baseURL;
        }
      }
      static lastBaseURL: string;
    },
  };
});

describe('ollama-lookup service', () => {
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
              }),
            },
          },
        ],
      });

      const result = await lookupByName('Buffalo Trace');

      expect(result).not.toBeNull();
      expect(result!.name).toBe('Buffalo Trace Kentucky Straight Bourbon');
      expect(result!.type).toBe('bourbon');
      expect(result!.distillery).toBe('Buffalo Trace Distillery');
      expect(result!.abv).toBe(45);

      // Verify SDK was called with the configured text model and json response format
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'llama3.1:8b',
          max_tokens: 1024,
          response_format: { type: 'json_object' },
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

      const result = await lookupByName('Totally Fake Whiskey');
      expect(result).toBeNull();
    });

    it('returns null when response has no content', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: null } }],
      });

      const result = await lookupByName('Buffalo Trace');
      expect(result).toBeNull();
    });

    it('returns null when choices array is empty', async () => {
      mockCreate.mockResolvedValue({
        choices: [],
      });

      const result = await lookupByName('Buffalo Trace');
      expect(result).toBeNull();
    });

    it('does not require an API key parameter', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({ name: 'Test', type: 'bourbon' }),
            },
          },
        ],
      });

      // lookupByName takes only a name, no API key
      const result = await lookupByName('Test Whiskey');
      expect(result).not.toBeNull();
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
      const result = await lookupByImage(imageBuffer, 'image/jpeg');

      expect(result).not.toBeNull();
      expect(result!.name).toBe('Lagavulin 16 Year Old');
      expect(result!.type).toBe('scotch');
      expect(result!.age).toBe(16);

      // Verify SDK was called with vision model and image_url content
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'minicpm-v',
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

      const result = await lookupByImage(Buffer.from('img'), 'image/png');
      expect(result).toBeNull();
    });

    it('returns null when response has no content', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: null } }],
      });

      const result = await lookupByImage(Buffer.from('img'), 'image/webp');
      expect(result).toBeNull();
    });

    it('does not require an API key parameter', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({ name: 'Test', type: 'scotch' }),
            },
          },
        ],
      });

      // lookupByImage takes only buffer and mimeType, no API key
      const result = await lookupByImage(Buffer.from('img'), 'image/jpeg');
      expect(result).not.toBeNull();
    });
  });
});
