import OpenAI from 'openai';
import { LookupResult, SYSTEM_PROMPT, parseResponse } from './lookup-shared';

export type { LookupResult };

function getClient(apiKey: string): OpenAI {
  return new OpenAI({ apiKey });
}

export async function lookupByName(apiKey: string, name: string): Promise<LookupResult | null> {
  const client = getClient(apiKey);

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 1024,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Identify this whiskey and return structured data: "${name}"` },
    ],
  });

  const text = response.choices[0]?.message?.content;
  if (!text) return null;

  return parseResponse(text);
}

export async function lookupByImage(
  apiKey: string,
  imageBuffer: Buffer,
  mimeType: string
): Promise<LookupResult | null> {
  const client = getClient(apiKey);
  const base64 = imageBuffer.toString('base64');

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 1024,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Identify this whiskey bottle from the label and return structured data.',
          },
          {
            type: 'image_url',
            image_url: { url: `data:${mimeType};base64,${base64}` },
          },
        ],
      },
    ],
  });

  const text = response.choices[0]?.message?.content;
  if (!text) return null;

  return parseResponse(text);
}
