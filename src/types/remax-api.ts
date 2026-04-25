/**
 * Canonical type exports for RE/MAX CCA API consumers. Downstream stories
 * import from `@/types/remax-api`; do not import Zod-derived types from
 * `@/lib/sync/schemas/*` directly.
 */

export type { RawProperty, RawPropertyAmenities } from "@/lib/sync/schemas/property";
export type { RawAgent } from "@/lib/sync/schemas/agent";
export type { RemaxConfig } from "@/lib/sync/config";

/** A parse failure for a single API record, preserving the raw payload for triage. */
export interface ParseError {
  apiId: string | null;
  scope: "property" | "agent";
  message: string;
  raw: unknown;
}

/** Result shape returned by `fetchPropertiesForOffice` / `fetchAgentsForOffice`. */
export interface FetchResult<T> {
  records: T[];
  parseErrors: ParseError[];
}
