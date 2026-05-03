/**
 * UTM parameter extractor — Story 4.2 (AC #8 / FR54 support)
 *
 * Browser-safe utility. Reads UTM params from the current page URL
 * or from a provided URLSearchParams/query string.
 *
 * Do NOT add `import "server-only"` — this runs in the browser when
 * tracking WhatsApp clicks.
 */

export interface UtmParams {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
}

/**
 * Extracts UTM parameters from the provided search params or from
 * `window.location.search` if running in the browser.
 */
export function extractUtmParams(searchParams?: URLSearchParams | string): UtmParams {
  const params =
    typeof searchParams === "string"
      ? new URLSearchParams(searchParams)
      : (searchParams ??
        (typeof window !== "undefined"
          ? new URLSearchParams(window.location.search)
          : new URLSearchParams()));
  return {
    source: params.get("utm_source") ?? undefined,
    medium: params.get("utm_medium") ?? undefined,
    campaign: params.get("utm_campaign") ?? undefined,
    content: params.get("utm_content") ?? undefined,
    term: params.get("utm_term") ?? undefined,
  };
}
