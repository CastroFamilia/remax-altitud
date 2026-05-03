/**
 * WordPress legacy URL pattern detection helpers — Task 4 (Story 4.4)
 *
 * Called from middleware.ts for WordPress legacy URL patterns.
 * These are pure functions — no DB access, no server-only constraint.
 *
 * Phase 1 strategy: Dynamic property/agent redirect URLs (/property/:id)
 * redirect to /en/search?q=:id (302 temporary) until the WordPress URL audit
 * is complete and a mapping table is built. See story for rationale.
 *
 * CRITICAL: DO NOT add DB imports to middleware.ts — middleware runs on the
 * Edge runtime. Any DB lookup must go through an API route if needed.
 */

/**
 * Detects WordPress property/listing URL patterns.
 * Returns the ID/slug segment, or null if the URL is not a WP property URL.
 *
 * Matches: /property/:id, /listing/:id, /propiedad/:id (exactly one path segment)
 * Does NOT match: /en/property/:slug (new platform URLs starting with locale)
 * Does NOT match: /property/123/extra (too many segments)
 */
export function isWordPressPropertyUrl(pathname: string): string | null {
  // Match /property/123 or /listing/123 or /propiedad/123 (legacy WP patterns)
  // Exactly one segment after the prefix — no locale prefix, no extra segments
  const match = pathname.match(/^\/(property|listing|propiedad)\/([^/]+)\/?$/);
  return match ? match[2] : null; // Returns the ID/slug segment
}

/**
 * Detects WordPress agent URL patterns.
 * Returns the name/id segment, or null if the URL is not a WP agent URL.
 *
 * Matches: /agent/:name, /agente/:name (exactly one path segment)
 * Does NOT match: /en/agents/:slug (new platform URLs starting with locale)
 * Does NOT match: /agents (index page — no segment after prefix)
 */
export function isWordPressAgentUrl(pathname: string): string | null {
  // Match /agent/name or /agente/name (legacy WP patterns)
  // Exactly one segment after the prefix — no locale prefix, no extra segments
  const match = pathname.match(/^\/(agent|agente)\/([^/]+)\/?$/);
  return match ? match[2] : null; // Returns the name/id segment
}
