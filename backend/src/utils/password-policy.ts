import crypto from 'crypto';

const MIN_PASSWORD_LENGTH = 12;
const MIN_CHARACTER_TYPES = 3;

interface ComplexityResult {
  isValid: boolean;
  meetsLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasDigit: boolean;
  hasSpecial: boolean;
  characterTypesCount: number;
  meetsComplexity: boolean;
  errors: string[];
}

export function checkPasswordComplexity(password: string): ComplexityResult {
  const meetsLength = password.length >= MIN_PASSWORD_LENGTH;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const characterTypesCount = [hasUppercase, hasLowercase, hasDigit, hasSpecial].filter(Boolean).length;
  const meetsComplexity = characterTypesCount >= MIN_CHARACTER_TYPES;
  const isValid = meetsLength && meetsComplexity;

  const errors: string[] = [];
  if (!meetsLength) {
    errors.push(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }
  if (!meetsComplexity) {
    errors.push('Password must contain at least 3 of: uppercase, lowercase, digit, special character');
  }

  return {
    isValid,
    meetsLength,
    hasUppercase,
    hasLowercase,
    hasDigit,
    hasSpecial,
    characterTypesCount,
    meetsComplexity,
    errors,
  };
}

export async function isPasswordBreached(password: string): Promise<boolean> {
  try {
    const sha1 = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
    const prefix = sha1.slice(0, 5);
    const suffix = sha1.slice(5);

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return false; // Fail open
    }

    const text = await response.text();
    const lines = text.split('\n');

    for (const line of lines) {
      const [hashSuffix] = line.split(':');
      if (hashSuffix.trim() === suffix) {
        return true;
      }
    }

    return false;
  } catch {
    return false; // Fail open on network errors
  }
}

export async function validatePassword(password: string): Promise<void> {
  const complexity = checkPasswordComplexity(password);
  if (!complexity.isValid) {
    throw new Error(complexity.errors.join('. '));
  }

  const breached = await isPasswordBreached(password);
  if (breached) {
    throw new Error('This password has been found in a data breach. Please choose a different password');
  }
}
