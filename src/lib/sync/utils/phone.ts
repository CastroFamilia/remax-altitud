import "server-only";

/**
 * Normalize a Costa Rica phone number to E.164 (`+506XXXXXXXX`). Returns `null`
 * when the input is missing or cannot be confidently normalized.
 *
 * Accepts `"506 XXXXXXXX"` (canonical), `"50688887777"`, `"88887777"`, and
 * dashed variants. Rejects anything shorter than 8 digits or with an invalid
 * country-code + length combination.
 */
export function normalizeCostaRicaPhone(raw: string | null | undefined): string | null {
  const digits = (raw ?? "").replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("506")) return `+${digits}`;
  if (digits.length === 8) return `+506${digits}`;
  return null;
}
