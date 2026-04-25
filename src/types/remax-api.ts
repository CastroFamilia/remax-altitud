/**
 * Canonical type exports for RE/MAX CCA API consumers. Downstream stories
 * import from `@/types/remax-api`; do not import Zod-derived types from
 * `@/lib/sync/schemas/*` directly.
 */

import type {
  RawProperty as _RawProperty,
  RawPropertyAmenities,
} from "@/lib/sync/schemas/property";
import type { RawAgent as _RawAgent } from "@/lib/sync/schemas/agent";

export type { RawPropertyAmenities } from "@/lib/sync/schemas/property";
export type { RemaxConfig } from "@/lib/sync/config";

/**
 * Normalized property record from RE/MAX CCA API.
 * Extends the schema-inferred type with optional legacy/alias fields
 * used by test factories and consumer code.
 */
export type RawProperty = _RawProperty & {
  // Legacy/alias fields used by test fixtures and downstream consumers
  agentId?: string | null;
  agentFirstName?: string | null;
  agentLastName?: string | null;
  slug?: string | null;
  address?: string | null;
  contractTypeEn?: string | null;
  contractTypeEs?: string | null;
  officeId?: string | null;
};

/**
 * Normalized agent record from RE/MAX CCA API.
 * Extends the schema-inferred type with optional alias fields
 * used by test factories and consumer code.
 */
export type RawAgent = _RawAgent & {
  // Alias fields used by test fixtures (schema uses `name` combined)
  firstName?: string | null;
  lastName?: string | null;
  officeId?: string | null;
};

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
