import Anthropic from '@anthropic-ai/sdk';
import { LookupResult, SYSTEM_PROMPT, parseResponse, compressImage } from './lookup-shared';

export type { LookupResult };

function getClient(apiKey: string): Anthropic {
  return new Anthropic({ apiKey });
}

export async function lookupByName(apiKey: string, name: string): Promise<LookupResult | null> {
  const client = getClient(apiKey);

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Identify this whiskey and return structured data: "${name}"`,
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') return null;

  return parseResponse(textBlock.text);
}

export async function lookupByImage(
  apiKey: string,
  imageBuffer: Buffer,
  mimeType: string
): Promise<LookupResult | null> {
  const client = getClient(apiKey);
  const compressed = await compressImage(imageBuffer, mimeType);
  const base64 = compressed.buffer.toString('base64');

  const message = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: compressed.mimeType as
                | 'image/jpeg'
                | 'image/png'
                | 'image/webp'
                | 'image/gif',
              data: base64,
            },
          },
          {
            type: 'text',
            text: 'Identify this whiskey bottle from the label and return structured data.',
          },
        ],
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') return null;

  return parseResponse(textBlock.text);
}
