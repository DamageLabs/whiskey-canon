import { describe, it, expect, vi, beforeEach } from 'vitest';
import { lookupByName, lookupByImage } from './whiskey-lookup';

// Hoist mock references so they're available in vi.mock factories
const { mockCreate, mockLoggerError } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockLoggerError: vi.fn(),
}));

// Mock the Anthropic SDK
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class MockAnthropic {
      messages = { create: mockCreate };
    },
  };
});

// Mock logger
vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: mockLoggerError,
    warn: vi.fn(),
    debug: vi.fn(),
    child: vi.fn().mockReturnThis(),
  },
}));

describe('whiskey-lookup service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('lookupByName', () => {
    it('returns parsed data for a recognized whiskey', async () => {
      mockCreate.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
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
        ],
      });

      const result = await lookupByName('test-api-key', 'Buffalo Trace');

      expect(result).not.toBeNull();
      expect(result!.name).toBe('Buffalo Trace Kentucky Straight Bourbon');
      expect(result!.type).toBe('bourbon');
      expect(result!.distillery).toBe('Buffalo Trace Distillery');
      expect(result!.abv).toBe(45);

      // Verify SDK was called with correct model and prompt
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: 'Identify this whiskey and return structured data: "Buffalo Trace"',
            },
          ],
        })
      );
    });

    it('returns null for unrecognized whiskey', async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify({ error: 'unrecognized' }) }],
      });

      const result = await lookupByName('test-api-key', 'Totally Fake Whiskey');
      expect(result).toBeNull();
    });

    it('returns null when response has no text block', async () => {
      mockCreate.mockResolvedValue({
        content: [],
      });

      const result = await lookupByName('test-api-key', 'Buffalo Trace');
      expect(result).toBeNull();
    });

    it('handles markdown-fenced JSON response', async () => {
      mockCreate.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: '```json\n{"name": "Angel\'s Envy", "type": "bourbon", "distillery": "Angel\'s Envy Distillery"}\n```',
          },
        ],
      });

      const result = await lookupByName('test-api-key', "Angel's Envy");
      expect(result).not.toBeNull();
      expect(result!.name).toBe("Angel's Envy");
      expect(result!.type).toBe('bourbon');
    });

    it('returns null for unparseable response', async () => {
      mockLoggerError.mockClear();

      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'This is not JSON at all' }],
      });

      const result = await lookupByName('test-api-key', 'Test');
      expect(result).toBeNull();
      expect(mockLoggerError).toHaveBeenCalledWith(
        expect.objectContaining({
          err: expect.any(Error),
          responsePreview: expect.any(String),
        }),
        'Failed to parse lookup response'
      );
    });
  });

  describe('lookupByImage', () => {
    it('returns parsed data for a recognized label', async () => {
      mockCreate.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              name: 'Lagavulin 16 Year Old',
              type: 'scotch',
              distillery: 'Lagavulin',
              region: 'Islay',
              country: 'Scotland',
              age: 16,
              abv: 43,
            }),
          },
        ],
      });

      const imageBuffer = Buffer.from('fake-image-data');
      const result = await lookupByImage('test-api-key', imageBuffer, 'image/jpeg');

      expect(result).not.toBeNull();
      expect(result!.name).toBe('Lagavulin 16 Year Old');
      expect(result!.type).toBe('scotch');
      expect(result!.age).toBe(16);

      // Verify SDK was called with image content block and correct model
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: 'image/jpeg',
                    data: imageBuffer.toString('base64'),
                  },
                },
                {
                  type: 'text',
                  text: 'Identify this whiskey bottle from the label and return structured data.',
                },
              ],
            },
          ],
        })
      );
    });

    it('returns null for unrecognized image', async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify({ error: 'unrecognized' }) }],
      });

      const result = await lookupByImage('test-api-key', Buffer.from('img'), 'image/png');
      expect(result).toBeNull();
    });

    it('returns null when response has no text block', async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: 'tool_use', id: 'x', name: 'y', input: {} }],
      });

      const result = await lookupByImage('test-api-key', Buffer.from('img'), 'image/webp');
      expect(result).toBeNull();
    });
  });
});
