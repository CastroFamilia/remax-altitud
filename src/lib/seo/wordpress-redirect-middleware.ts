/**
 * WordPress legacy URL pattern detection helpers — Task 4 (Story 4.4)
 *
 * Stub file created for ATDD red-phase test compilation.
 * Implementations are filled in during the dev phase.
 *
 * Called from middleware.ts for WordPress legacy URL patterns.
 * These are pure functions — no DB access, no server-only constraint.
 */

/**
 * Detects WordPress property/listing URL patterns.
 * Returns the ID/slug segment, or null if the URL is not a WP property URL.
 *
 * Matches: /property/:id, /listing/:id, /propiedad/:id
 * Does NOT match: /en/property/:slug (new platform URLs)
 *
 * TODO: Implement in Task 4 (Story 4.4)
 */
export function isWordPressPropertyUrl(pathname: string): string | null {
  // TODO: Implement — match /property/:id, /listing/:id, /propiedad/:id
  void pathname;
  return null;
}

/**
 * Detects WordPress agent URL patterns.
 * Returns the name/id segment, or null if the URL is not a WP agent URL.
 *
 * Matches: /agent/:name, /agente/:name
 * Does NOT match: /en/agents/:slug (new platform URLs)
 *
 * TODO: Implement in Task 4 (Story 4.4)
 */
export function isWordPressAgentUrl(pathname: string): string | null {
  // TODO: Implement — match /agent/:name, /agente/:name
  void pathname;
  return null;
}
