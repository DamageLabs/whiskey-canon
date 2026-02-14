import OpenAI from 'openai';
import { config } from '../utils/config';
import { LookupResult, SYSTEM_PROMPT, parseResponse } from './lookup-shared';

export type { LookupResult };

function getClient(): OpenAI {
  return new OpenAI({
    baseURL: `${config.ollamaBaseUrl}/v1`,
    apiKey: 'ollama',
  });
}

export async function lookupByName(name: string): Promise<LookupResult | null> {
  const client = getClient();

  const response = await client.chat.completions.create({
    model: config.ollamaTextModel,
    max_tokens: 1024,
    response_format: { type: 'json_object' },
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
  imageBuffer: Buffer,
  mimeType: string
): Promise<LookupResult | null> {
  const client = getClient();
  const base64 = imageBuffer.toString('base64');

  const response = await client.chat.completions.create({
    model: config.ollamaVisionModel,
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
