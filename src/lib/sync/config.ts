import "server-only";

/** Typed RE/MAX CCA API configuration read from environment variables. */
export interface RemaxConfig {
  readonly baseUrl: string;
  readonly pzOfficeGuid: string;
  readonly domOfficeGuid: string;
}

/**
 * Read required RE/MAX env vars. Throws a descriptive error listing every missing
 * variable (aggregated, not first-miss) so operators fix everything in one pass.
 */
export function getRemaxConfig(): RemaxConfig {
  const baseUrl = process.env.REMAX_API_BASE_URL;
  const pzOfficeGuid = process.env.PZ_OFFICE_GUID;
  const domOfficeGuid = process.env.DOM_OFFICE_GUID;

  const missing: string[] = [];
  if (!baseUrl) missing.push("REMAX_API_BASE_URL");
  if (!pzOfficeGuid) missing.push("PZ_OFFICE_GUID");
  if (!domOfficeGuid) missing.push("DOM_OFFICE_GUID");

  if (missing.length > 0) {
    throw new Error(`Missing required RE/MAX env vars: ${missing.join(", ")}`);
  }

  return {
    baseUrl: baseUrl!.replace(/\/+$/, ""),
    pzOfficeGuid: pzOfficeGuid!,
    domOfficeGuid: domOfficeGuid!,
  };
}
