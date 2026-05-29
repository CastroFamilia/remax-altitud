import { headers } from "next/headers";
import type { SearchFilters } from "@/types/search";

interface TrackSearchPayload {
  rawQuery?: string;
  parsedFilters?: SearchFilters;
  searchMode: "smart" | "traditional";
  resultsCount: number;
}

/**
 * Tracks searches by sending them asynchronously to ALTITUD HUB.
 * Handled as a non-blocking background promise to ensure user searches are never slowed down.
 */
export async function trackSearchInBackground(payload: TrackSearchPayload) {
  try {
    let userAgent: string | undefined = undefined;
    let ipAddress: string | undefined = undefined;
    let sessionId = "anonymous";

    // 1. Resolve request headers safely inside the server context.
    // We wrap this call in a try/catch block because in non-HTTP-request contexts (like Vitest runs or static site generation),
    // next/headers throws a context error.
    try {
      const headersList = await headers();
      userAgent = headersList.get("user-agent") || undefined;
      ipAddress =
        headersList.get("x-forwarded-for")?.split(",")[0] ||
        headersList.get("x-real-ip") ||
        undefined;
      sessionId = headersList.get("cookie")?.match(/session-id=([^;]+)/)?.[1] || "anonymous";
    } catch {
      // Gracefully fall back to defaults when outside an active HTTP request context (e.g. testing)
    }

    const hubUrl = process.env.ALTITUD_HUB_URL;
    const apiKey = process.env.ALTITUD_HUB_API_SECRET;

    if (!hubUrl || !apiKey) {
      // In development or when not configured, we gracefully log and return
      console.log("Search tracking skipped: ALTITUD_HUB_URL or ALTITUD_HUB_API_SECRET not set.");
      return;
    }

    const endpoint = `${hubUrl.replace(/\/$/, "")}/api/v1/tracking/search`;

    // 2. Perform the fetch call concurrently (non-blocking)
    // We catch errors at this level to ensure a tracking failure never disrupts the user
    fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        sessionId,
        rawQuery: payload.rawQuery || payload.parsedFilters?.q,
        parsedFilters: payload.parsedFilters,
        searchMode: payload.searchMode,
        resultsCount: payload.resultsCount,
        ipAddress,
        userAgent,
      }),
      keepalive: true, // Next.js/fetch: keep request alive even if client navigates away
    }).catch((err) => {
      console.error("Failed to POST tracking data to ALTITUD HUB:", err);
    });
  } catch (error) {
    console.error("Failed to prepare search tracking payload:", error);
  }
}
