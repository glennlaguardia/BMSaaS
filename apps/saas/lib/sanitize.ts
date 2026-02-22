/**
 * Input sanitization utilities for PostgREST / Supabase query safety.
 *
 * Supabase's `.or()` method builds PostgREST filter strings. If user input
 * is interpolated directly, an attacker can inject additional filter clauses
 * (e.g. `%,id.eq.anything`). These helpers strip dangerous characters.
 */

/**
 * Sanitize a search string before interpolating it into a Supabase `.or()` / `.ilike()` filter.
 *
 * Strips characters that have special meaning in PostgREST filter syntax:
 * commas (clause separator), dots (operator separator), parentheses (grouping),
 * backticks, and quotes. Also trims and limits length.
 */
export function sanitizeSearchInput(input: string, maxLength = 100): string {
  return input
    .replace(/[,.()"'`\\]/g, '')  // Remove PostgREST-special characters
    .trim()
    .slice(0, maxLength);
}

/**
 * Validate that a value is one of the allowed enum values.
 * Returns the value if valid, or the fallback otherwise.
 */
export function validateEnum<T extends string>(
  value: string | null | undefined,
  allowed: readonly T[],
  fallback: T
): T {
  if (value && (allowed as readonly string[]).includes(value)) {
    return value as T;
  }
  return fallback;
}
