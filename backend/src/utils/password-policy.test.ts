vi.unmock('./password-policy');

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkPasswordComplexity, isPasswordBreached, validatePassword } from './password-policy';

describe('checkPasswordComplexity', () => {
  it('rejects short passwords', () => {
    const result = checkPasswordComplexity('Short1!');
    expect(result.isValid).toBe(false);
    expect(result.meetsLength).toBe(false);
    expect(result.errors).toContain('Password must be at least 12 characters');
  });

  it('rejects passwords with fewer than 3 character types', () => {
    const result = checkPasswordComplexity('alllowercase!!');
    expect(result.isValid).toBe(false);
    expect(result.meetsComplexity).toBe(false);
    expect(result.characterTypesCount).toBe(2);
    expect(result.errors).toContain('Password must contain at least 3 of: uppercase, lowercase, digit, special character');
  });

  it('accepts passwords with 3 of 4 character types', () => {
    const result = checkPasswordComplexity('Abcdefghijk1');
    expect(result.isValid).toBe(true);
    expect(result.characterTypesCount).toBe(3);
    expect(result.errors).toHaveLength(0);
  });

  it('accepts passwords with 4 of 4 character types', () => {
    const result = checkPasswordComplexity('Wh1sk3yTest!!');
    expect(result.isValid).toBe(true);
    expect(result.characterTypesCount).toBe(4);
    expect(result.errors).toHaveLength(0);
  });

  it('correctly identifies uppercase', () => {
    expect(checkPasswordComplexity('AAAAAAAAAAAA').hasUppercase).toBe(true);
    expect(checkPasswordComplexity('aaaaaaaaaaaa').hasUppercase).toBe(false);
  });

  it('correctly identifies lowercase', () => {
    expect(checkPasswordComplexity('aaaaaaaaaaaa').hasLowercase).toBe(true);
    expect(checkPasswordComplexity('AAAAAAAAAAAA').hasLowercase).toBe(false);
  });

  it('correctly identifies digits', () => {
    expect(checkPasswordComplexity('111111111111').hasDigit).toBe(true);
    expect(checkPasswordComplexity('aaaaaaaaaaaa').hasDigit).toBe(false);
  });

  it('correctly identifies special characters', () => {
    expect(checkPasswordComplexity('!!!!!!!!!!!!').hasSpecial).toBe(true);
    expect(checkPasswordComplexity('aaaaaaaaaaaa').hasSpecial).toBe(false);
  });

  it('returns both errors when password is short and lacks complexity', () => {
    const result = checkPasswordComplexity('abc');
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(2);
  });
});

describe('isPasswordBreached', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns false (fail open) when API is unreachable', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));
    const result = await isPasswordBreached('SomePassword123!');
    expect(result).toBe(false);
  });

  it('returns true when hash suffix is found in response', async () => {
    // SHA-1 of "password" is 5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8
    // Prefix: 5BAA6, Suffix: 1E4C9B93F3F0682250B6CF8331B7EE68FD8
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: async () => '1E4C9B93F3F0682250B6CF8331B7EE68FD8:3861493\nOTHERHASH:123',
    } as Response);

    const result = await isPasswordBreached('password');
    expect(result).toBe(true);
  });

  it('returns false when hash suffix is not found', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: async () => 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA0:1\nBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB0:2',
    } as Response);

    const result = await isPasswordBreached('Wh1sk3yTest!!');
    expect(result).toBe(false);
  });

  it('returns false when API returns non-ok status', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);

    const result = await isPasswordBreached('SomePassword123!');
    expect(result).toBe(false);
  });
});

describe('validatePassword', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('throws on short password', async () => {
    await expect(validatePassword('Short1!')).rejects.toThrow('at least 12 characters');
  });

  it('throws on low complexity password', async () => {
    await expect(validatePassword('alllowercase!!')).rejects.toThrow('at least 3 of');
  });

  it('throws on breached password', async () => {
    // SHA-1 of "Wh1sk3yTest!!" prefix
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: async () => {
        // Compute actual suffix for Wh1sk3yTest!!
        const crypto = await import('crypto');
        const sha1 = crypto.createHash('sha1').update('Wh1sk3yTest!!').digest('hex').toUpperCase();
        const suffix = sha1.slice(5);
        return `${suffix}:100\nOTHERHASH:1`;
      },
    } as Response);

    await expect(validatePassword('Wh1sk3yTest!!')).rejects.toThrow('data breach');
  });

  it('resolves for valid non-breached password', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: async () => 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA0:1',
    } as Response);

    await expect(validatePassword('Wh1sk3yTest!!')).resolves.toBeUndefined();
  });
});
