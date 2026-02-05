/**
 * Format a number as accounting currency
 * - Comma separators for thousands
 * - Parentheses for negative values
 * - Aligned currency symbol
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return '-';
  }

  const absValue = Math.abs(value);
  const formatted = absValue.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (value < 0) {
    return `$(${formatted})`;
  }

  return `$${formatted}`;
}

/**
 * Format a number as accounting currency, returns null placeholder if no value
 */
export function formatCurrencyOrDash(value: number | null | undefined): string {
  if (value === null || value === undefined || value === 0) {
    return '-';
  }
  return formatCurrency(value);
}
