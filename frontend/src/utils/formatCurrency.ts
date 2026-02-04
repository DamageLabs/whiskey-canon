/**
 * Formats a number as currency in accounting format:
 * - Comma separators for thousands
 * - Parentheses for negative numbers (accounting style)
 * - Aligned currency symbol ($)
 * - Two decimal places
 */
export function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined) {
    return 'N/A';
  }

  // Handle string values from API
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  // Handle NaN or invalid numbers
  if (isNaN(numValue)) {
    return 'N/A';
  }

  const isNegative = numValue < 0;
  const absValue = Math.abs(numValue);

  // Format with commas and 2 decimal places
  const formatted = absValue.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // Return with parentheses for negatives (accounting format)
  if (isNegative) {
    return `$(${formatted})`;
  }

  return `$${formatted}`;
}

/**
 * Formats a number as currency, returning a dash for null/undefined/zero values
 */
export function formatCurrencyOrDash(value: number | null | undefined): string {
  if (value === null || value === undefined || value === 0) {
    return '-';
  }
  return formatCurrency(value);
}
