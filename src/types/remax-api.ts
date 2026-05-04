/**
 * Canonical type exports for RE/MAX CCA API consumers. Downstream stories
 * import from `@/types/remax-api`; do not import Zod-derived types from
 * `@/lib/sync/schemas/*` directly.
 */

export type { OptimizedImage } from "./images";

import type { RawProperty as _RawProperty } from "@/lib/sync/schemas/property";
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

/**
 * An entry in the `sync_logs.errors` JSONB array — covers Zod parse failures
 * (`scope: "property" | "agent"`) as well as non-fatal warnings emitted by the
 * pipeline, e.g. `"lot_size_warning"` for non-standard `LotSizeUnits` (Story
 * 2.3 AC #12). Warnings are surfaced to operators but do NOT block the upsert.
 */
export interface ParseError {
  apiId: string | null;
  scope:
    | "property"
    | "agent"
    | "lot_size_warning"
    | "image_error"
    | "translation_error"
    | "tagging_error";
  message: string;
  raw: unknown;
}

/** Result shape returned by `fetchPropertiesForOffice` / `fetchAgentsForOffice`. */
export interface FetchResult<T> {
  records: T[];
  parseErrors: ParseError[];
}
