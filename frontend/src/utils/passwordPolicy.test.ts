import { describe, it, expect } from 'vitest';
import { checkPasswordStrength, MIN_PASSWORD_LENGTH } from './passwordPolicy';

describe('passwordPolicy', () => {
  describe('MIN_PASSWORD_LENGTH', () => {
    it('is 12', () => {
      expect(MIN_PASSWORD_LENGTH).toBe(12);
    });
  });

  describe('checkPasswordStrength', () => {
    it('returns weak for short password', () => {
      const result = checkPasswordStrength('Abc1!');
      expect(result.isValid).toBe(false);
      expect(result.meetsLength).toBe(false);
      expect(result.strength).toBe('weak');
    });

    it('returns weak when length met but complexity not met (only 2 types)', () => {
      const result = checkPasswordStrength('abcdefghijklm');
      expect(result.meetsLength).toBe(true);
      expect(result.meetsComplexity).toBe(false);
      expect(result.isValid).toBe(false);
      expect(result.strength).toBe('weak');
    });

    it('returns fair when valid with 3 character types', () => {
      const result = checkPasswordStrength('Abcdefgh1234');
      expect(result.isValid).toBe(true);
      expect(result.hasUppercase).toBe(true);
      expect(result.hasLowercase).toBe(true);
      expect(result.hasDigit).toBe(true);
      expect(result.hasSpecial).toBe(false);
      expect(result.characterTypesCount).toBe(3);
      expect(result.meetsComplexity).toBe(true);
      expect(result.strength).toBe('fair');
    });

    it('returns strong when valid with all 4 character types', () => {
      const result = checkPasswordStrength('Abcdefgh123!');
      expect(result.isValid).toBe(true);
      expect(result.hasUppercase).toBe(true);
      expect(result.hasLowercase).toBe(true);
      expect(result.hasDigit).toBe(true);
      expect(result.hasSpecial).toBe(true);
      expect(result.characterTypesCount).toBe(4);
      expect(result.strength).toBe('strong');
    });

    it('detects uppercase only', () => {
      const result = checkPasswordStrength('ABCDEFGHIJKL');
      expect(result.hasUppercase).toBe(true);
      expect(result.hasLowercase).toBe(false);
      expect(result.hasDigit).toBe(false);
      expect(result.hasSpecial).toBe(false);
      expect(result.characterTypesCount).toBe(1);
    });

    it('detects lowercase only', () => {
      const result = checkPasswordStrength('abcdefghijkl');
      expect(result.hasUppercase).toBe(false);
      expect(result.hasLowercase).toBe(true);
      expect(result.characterTypesCount).toBe(1);
    });

    it('detects digits only', () => {
      const result = checkPasswordStrength('123456789012');
      expect(result.hasDigit).toBe(true);
      expect(result.hasUppercase).toBe(false);
      expect(result.hasLowercase).toBe(false);
      expect(result.hasSpecial).toBe(false);
      expect(result.characterTypesCount).toBe(1);
    });

    it('detects special characters only', () => {
      const result = checkPasswordStrength('!@#$%^&*()[]');
      expect(result.hasSpecial).toBe(true);
      expect(result.hasUppercase).toBe(false);
      expect(result.hasLowercase).toBe(false);
      expect(result.hasDigit).toBe(false);
      expect(result.characterTypesCount).toBe(1);
    });

    it('fails at exactly 11 characters', () => {
      const result = checkPasswordStrength('Abcdefgh12!');
      expect(result.meetsLength).toBe(false);
      expect(result.isValid).toBe(false);
    });

    it('passes at exactly 12 characters', () => {
      const result = checkPasswordStrength('Abcdefgh123!');
      expect(result.meetsLength).toBe(true);
      expect(result.isValid).toBe(true);
    });

    it('handles empty string', () => {
      const result = checkPasswordStrength('');
      expect(result.isValid).toBe(false);
      expect(result.meetsLength).toBe(false);
      expect(result.characterTypesCount).toBe(0);
      expect(result.strength).toBe('weak');
    });

    it('requires at least 3 of 4 types for complexity', () => {
      // 2 types: upper + lower — not enough
      const result = checkPasswordStrength('ABCDefghijkl');
      expect(result.characterTypesCount).toBe(2);
      expect(result.meetsComplexity).toBe(false);
      expect(result.isValid).toBe(false);
    });
  });
});
