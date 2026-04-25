import "server-only";
import type { FetchResult, ParseError, RawAgent, RawProperty } from "@/types/remax-api";
import { rawAgentApiSchema } from "./schemas/agent";
import { rawPropertyApiSchema } from "./schemas/property";

/**
 * Per-record validation of an API payload. Bad records are collected into
 * `parseErrors` instead of throwing (AC #10 / FR55) so a single malformed
 * listing does not block the rest of the sync. The schema's chained
 * `.transform(...)` does validation and normalization in one pass — no
 * double-parse — and the parser attaches the original `apiRaw` payload.
 */
export function parsePropertyArray(json: unknown): FetchResult<RawProperty> {
  const records: RawProperty[] = [];
  const parseErrors: ParseError[] = [];

  if (!Array.isArray(json)) {
    parseErrors.push({
      apiId: null,
      scope: "property",
      message: "Expected an array at the root of the property payload",
      raw: json,
    });
    return { records, parseErrors };
  }

  for (const element of json) {
    const validation = rawPropertyApiSchema.safeParse(element);
    if (!validation.success) {
      parseErrors.push({
        apiId: extractApiId(element, "property"),
        scope: "property",
        message: validation.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
        raw: element,
      });
      continue;
    }

    const record: RawProperty = { ...validation.data, apiRaw: element };
    records.push(record);

    // Defensive: Field Mapping Reference requires non-"Sq Mt" LotSizeUnits to be
    // nulled AND flagged in parseErrors. The record itself still ships.
    const raw = (element ?? {}) as Record<string, unknown>;
    const units = raw.LotSizeUnits;
    const area = raw.LotSizeArea;
    if (
      area !== undefined &&
      area !== null &&
      area !== "" &&
      typeof units === "string" &&
      units.length > 0 &&
      units !== "Sq Mt"
    ) {
      parseErrors.push({
        apiId: record.apiId,
        scope: "property",
        message: `Non-standard LotSizeUnits "${units}" — lotSizeM2 set to null`,
        raw: element,
      });
    }
  }

  return { records, parseErrors };
}

export function parseAgentArray(json: unknown): FetchResult<RawAgent> {
  const records: RawAgent[] = [];
  const parseErrors: ParseError[] = [];

  if (!Array.isArray(json)) {
    parseErrors.push({
      apiId: null,
      scope: "agent",
      message: "Expected an array at the root of the agent payload",
      raw: json,
    });
    return { records, parseErrors };
  }

  for (const element of json) {
    const validation = rawAgentApiSchema.safeParse(element);
    if (!validation.success) {
      parseErrors.push({
        apiId: extractApiId(element, "agent"),
        scope: "agent",
        message: validation.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
        raw: element,
      });
      continue;
    }

    records.push({ ...validation.data, apiRaw: element });
  }

  return { records, parseErrors };
}

function extractApiId(element: unknown, scope: "property" | "agent"): string | null {
  if (!element || typeof element !== "object") return null;
  const obj = element as Record<string, unknown>;
  const candidate = scope === "property" ? obj.ListingId : (obj.AssociateID ?? obj.AssociateId);
  if (typeof candidate === "number" || typeof candidate === "string") return String(candidate);
  return null;
}
