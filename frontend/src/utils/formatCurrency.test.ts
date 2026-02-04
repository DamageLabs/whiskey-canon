import { describe, it, expect } from 'vitest';
import { formatCurrency, formatCurrencyOrDash } from './formatCurrency';

describe('formatCurrency', () => {
  describe('positive numbers', () => {
    it('formats simple positive number', () => {
      expect(formatCurrency(100)).toBe('$100.00');
    });

    it('formats with comma separators for thousands', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
    });

    it('formats large numbers with multiple commas', () => {
      expect(formatCurrency(1234567.89)).toBe('$1,234,567.89');
    });

    it('formats to exactly two decimal places', () => {
      expect(formatCurrency(100.1)).toBe('$100.10');
      expect(formatCurrency(100.999)).toBe('$101.00');
    });
  });

  describe('negative numbers (accounting format)', () => {
    it('formats negative number with parentheses', () => {
      expect(formatCurrency(-100)).toBe('$(100.00)');
    });

    it('formats negative number with commas and parentheses', () => {
      expect(formatCurrency(-1234.56)).toBe('$(1,234.56)');
    });

    it('formats small negative number', () => {
      expect(formatCurrency(-0.50)).toBe('$(0.50)');
    });
  });

  describe('zero', () => {
    it('formats zero correctly', () => {
      expect(formatCurrency(0)).toBe('$0.00');
    });
  });

  describe('null and undefined', () => {
    it('returns N/A for null', () => {
      expect(formatCurrency(null)).toBe('N/A');
    });

    it('returns N/A for undefined', () => {
      expect(formatCurrency(undefined)).toBe('N/A');
    });
  });

  describe('string input handling', () => {
    it('handles numeric string', () => {
      expect(formatCurrency('1234.56')).toBe('$1,234.56');
    });

    it('handles negative numeric string', () => {
      expect(formatCurrency('-100')).toBe('$(100.00)');
    });

    it('returns N/A for non-numeric string', () => {
      expect(formatCurrency('not a number')).toBe('N/A');
    });

    it('returns N/A for empty string', () => {
      expect(formatCurrency('')).toBe('N/A');
    });
  });

  describe('edge cases', () => {
    it('handles NaN', () => {
      expect(formatCurrency(NaN)).toBe('N/A');
    });

    it('handles very small decimals', () => {
      expect(formatCurrency(0.001)).toBe('$0.00');
      expect(formatCurrency(0.005)).toBe('$0.01');
    });
  });
});

describe('formatCurrencyOrDash', () => {
  it('returns dash for null', () => {
    expect(formatCurrencyOrDash(null)).toBe('-');
  });

  it('returns dash for undefined', () => {
    expect(formatCurrencyOrDash(undefined)).toBe('-');
  });

  it('returns dash for zero', () => {
    expect(formatCurrencyOrDash(0)).toBe('-');
  });

  it('formats positive numbers normally', () => {
    expect(formatCurrencyOrDash(1234.56)).toBe('$1,234.56');
  });

  it('formats negative numbers with parentheses', () => {
    expect(formatCurrencyOrDash(-100)).toBe('$(100.00)');
  });
});
