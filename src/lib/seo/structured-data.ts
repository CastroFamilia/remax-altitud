/**
 * JSON-LD structured data generator functions — Task 1 (Story 4.4)
 *
 * Stub file created for ATDD red-phase test compilation.
 * Implementations are filled in during the dev phase.
 *
 * All generators run server-side only (RSC / page context).
 */

import "server-only";

// Types will be imported from DB schema once source files exist.
// Using `unknown` here so tests compile during red phase.

export function generateListingJsonLd(property: unknown, locale: string): object {
  // TODO: Implement in Task 1 (Story 4.4)
  void property;
  void locale;
  throw new Error("generateListingJsonLd not yet implemented");
}

export function generateAgentJsonLd(agent: unknown, locale: string): object {
  // TODO: Implement in Task 1 (Story 4.4)
  void agent;
  void locale;
  throw new Error("generateAgentJsonLd not yet implemented");
}

export function generateBreadcrumbJsonLd(
  items: { position: number; name: string; href: string }[],
): object {
  // TODO: Implement in Task 1 (Story 4.4)
  void items;
  throw new Error("generateBreadcrumbJsonLd not yet implemented");
}

export function generatePlaceJsonLd(area: unknown, locale: string): object {
  // TODO: Implement in Task 1 (Story 4.4)
  void area;
  void locale;
  throw new Error("generatePlaceJsonLd not yet implemented");
}
