export interface LookupResult {
  name?: string;
  type?: string;
  distillery?: string;
  region?: string;
  country?: string;
  age?: number;
  abv?: number;
  proof?: number;
  size?: string;
  mash_bill?: string;
  cask_type?: string;
  cask_finish?: string;
  color?: string;
  nose_notes?: string;
  palate_notes?: string;
  finish_notes?: string;
  tasting_notes?: string;
  food_pairings?: string;
  description?: string;
  limited_edition?: boolean;
  chill_filtered?: boolean;
  natural_color?: boolean;
}

export const SYSTEM_PROMPT = `You are a whiskey knowledge database. Given a whiskey identification (name or label photo), return structured data as a JSON object.

Return ONLY valid JSON (no markdown fencing, no explanation). Use null for any field you are not confident about. Never fabricate prices, awards, batch numbers, or barrel numbers.

The JSON object must use these exact field names and types:
- "name": string — full product name
- "type": string — one of: "bourbon", "scotch", "irish", "japanese", "rye", "tennessee", "canadian", "other"
- "distillery": string — distillery or producer name
- "region": string — production region (e.g., "Kentucky", "Speyside", "Islay")
- "country": string — country of origin
- "age": number — age statement in years, or null if NAS
- "abv": number — alcohol by volume as a percentage (e.g., 45.0)
- "proof": number — proof (e.g., 90.0)
- "size": string — bottle size (e.g., "750ml", "1L")
- "mash_bill": string — grain recipe if known
- "cask_type": string — primary cask type (e.g., "New charred oak", "Ex-bourbon")
- "cask_finish": string — secondary cask finish if any
- "color": string — whiskey color description
- "nose_notes": string — aroma/nose tasting notes
- "palate_notes": string — palate/taste tasting notes
- "finish_notes": string — finish tasting notes
- "tasting_notes": string — general tasting notes summary
- "food_pairings": string — recommended food pairings
- "description": string — brief description of the whiskey
- "limited_edition": boolean — whether this is a limited edition release
- "chill_filtered": boolean — whether chill filtered, or null if unknown
- "natural_color": boolean — whether natural color (no coloring added), or null if unknown

If you cannot identify the whiskey at all, return: {"error": "unrecognized"}`;

export function parseResponse(text: string): LookupResult | null {
  try {
    // Strip markdown fencing if the model wrapped the response
    let cleaned = text.trim();
    const fenceMatch = cleaned.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?\s*```$/);
    if (fenceMatch) {
      cleaned = fenceMatch[1].trim();
    }
    const parsed = JSON.parse(cleaned);
    if (parsed.error === 'unrecognized') {
      return null;
    }
    return parsed as LookupResult;
  } catch (e) {
    console.error('Failed to parse lookup response:', text.substring(0, 200), e);
    return null;
  }
}
