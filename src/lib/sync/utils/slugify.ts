import "server-only";

/**
 * URL-safe slug generator using NFD decomposition + Unicode property escapes.
 * Implements the algorithm specified in Story 2.3 Task 9 / Slug Generation section.
 * No external dependencies — pure Node built-ins.
 */

/**
 * Converts a text string into a URL-safe slug.
 * Algorithm: lowercase → NFD decompose → strip combining marks → replace
 * non-alphanumeric with hyphens → collapse runs → trim leading/trailing hyphens.
 *
 * @param text  - Source string (e.g. property title)
 * @param suffix - Optional suffix appended with a hyphen (e.g. apiId for conflict resolution)
 * @returns URL-safe slug, or empty string if input produces no alphanumeric chars
 */
export function slugify(text: string, suffix?: string): string {
  const base = text
    .toLowerCase()
    .normalize("NFD") // decompose accented chars (á → a + combining mark)
    .replace(/\p{M}/gu, "") // strip all combining marks (Unicode property escape)
    .replace(/[^a-z0-9]+/g, "-") // replace non-alphanumeric runs with single hyphen
    .replace(/^-+|-+$/g, ""); // trim leading and trailing hyphens

  return suffix ? `${base}-${suffix}` : base;
}
