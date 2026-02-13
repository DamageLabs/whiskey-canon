import { describe, it, expect } from 'vitest';
import { encrypt, decrypt } from './encryption';

describe('Encryption', () => {
  it('encrypts and decrypts a string', () => {
    const plaintext = 'sk-ant-api03-test-key-12345';
    const encrypted = encrypt(plaintext);
    expect(encrypted).not.toBe(plaintext);
    expect(encrypted).toContain(':'); // iv:tag:ciphertext format

    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it('produces different ciphertext for the same input', () => {
    const plaintext = 'sk-ant-api03-test-key-12345';
    const encrypted1 = encrypt(plaintext);
    const encrypted2 = encrypt(plaintext);
    expect(encrypted1).not.toBe(encrypted2); // Different IVs
  });

  it('both decrypt to the same value', () => {
    const plaintext = 'sk-ant-api03-test-key-12345';
    const encrypted1 = encrypt(plaintext);
    const encrypted2 = encrypt(plaintext);
    expect(decrypt(encrypted1)).toBe(plaintext);
    expect(decrypt(encrypted2)).toBe(plaintext);
  });

  it('throws on tampered ciphertext', () => {
    const encrypted = encrypt('test');
    const parts = encrypted.split(':');
    parts[2] = 'AAAA'; // Tamper with ciphertext
    expect(() => decrypt(parts.join(':'))).toThrow();
  });

  it('throws on invalid format', () => {
    expect(() => decrypt('not-valid')).toThrow('Invalid encrypted format');
  });
});
