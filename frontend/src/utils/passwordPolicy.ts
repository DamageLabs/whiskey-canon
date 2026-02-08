export const MIN_PASSWORD_LENGTH = 12;

interface PasswordStrengthResult {
  isValid: boolean;
  meetsLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasDigit: boolean;
  hasSpecial: boolean;
  characterTypesCount: number;
  meetsComplexity: boolean;
  strength: 'weak' | 'fair' | 'strong';
}

export function checkPasswordStrength(password: string): PasswordStrengthResult {
  const meetsLength = password.length >= MIN_PASSWORD_LENGTH;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const characterTypesCount = [hasUppercase, hasLowercase, hasDigit, hasSpecial].filter(Boolean).length;
  const meetsComplexity = characterTypesCount >= 3;
  const isValid = meetsLength && meetsComplexity;

  let strength: 'weak' | 'fair' | 'strong' = 'weak';
  if (isValid && characterTypesCount === 4) {
    strength = 'strong';
  } else if (isValid) {
    strength = 'fair';
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
    strength,
  };
}
