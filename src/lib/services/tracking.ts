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

interface TrackShortlistPayload {
  propertyId: string;
  action: "save" | "unsave";
  locale: "en" | "es";
}

interface TrackPropertyViewPayload {
  propertyId: string;
  slug: string;
  locale: "en" | "es";
}

/**
 * Tracks property shortlist save/unsave events by sending them to ALTITUD HUB.
 */
export async function trackShortlistEventInBackground(payload: TrackShortlistPayload) {
  try {
    const hubUrl = process.env.ALTITUD_HUB_URL;
    const apiKey = process.env.ALTITUD_HUB_API_SECRET;

    if (!hubUrl || !apiKey) {
      console.log("Shortlist event tracking skipped: ALTITUD_HUB_URL or ALTITUD_HUB_API_SECRET not set.");
      return;
    }

    const endpoint = `${hubUrl.replace(/\/$/, "")}/api/v1/tracking/shortlist`;

    fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        propertyId: payload.propertyId,
        action: payload.action,
        locale: payload.locale,
        timestamp: new Date().toISOString(),
      }),
      keepalive: true,
    }).catch((err) => {
      console.error("Failed to POST shortlist event tracking data to ALTITUD HUB:", err);
    });
  } catch (error) {
    console.error("Failed to prepare shortlist event tracking payload:", error);
  }
}

/**
 * Tracks property view events by sending them to ALTITUD HUB.
 */
export async function trackPropertyViewInBackground(payload: TrackPropertyViewPayload) {
  try {
    let userAgent: string | undefined = undefined;
    let ipAddress: string | undefined = undefined;

    try {
      const headersList = await headers();
      userAgent = headersList.get("user-agent") || undefined;
      ipAddress =
        headersList.get("x-forwarded-for")?.split(",")[0] ||
        headersList.get("x-real-ip") ||
        undefined;
    } catch {
      // Gracefully fall back when outside HTTP context
    }

    const hubUrl = process.env.ALTITUD_HUB_URL;
    const apiKey = process.env.ALTITUD_HUB_API_SECRET;

    if (!hubUrl || !apiKey) {
      console.log("Property view tracking skipped: ALTITUD_HUB_URL or ALTITUD_HUB_API_SECRET not set.");
      return;
    }

    const endpoint = `${hubUrl.replace(/\/$/, "")}/api/v1/tracking/view`;

    fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        propertyId: payload.propertyId,
        slug: payload.slug,
        locale: payload.locale,
        ipAddress,
        userAgent,
        timestamp: new Date().toISOString(),
      }),
      keepalive: true,
    }).catch((err) => {
      console.error("Failed to POST property view tracking data to ALTITUD HUB:", err);
    });
  } catch (error) {
    console.error("Failed to prepare property view tracking payload:", error);
  }
}

/**
 * Forward user inquiries/leads securely to ALTITUD HUB.
 */
export async function forwardLeadToHubInBackground(leadPayload: Record<string, unknown>) {
  try {
    const hubUrl = process.env.ALTITUD_HUB_URL;
    const apiKey = process.env.ALTITUD_HUB_API_SECRET;

    if (!hubUrl || !apiKey) {
      console.log("Lead forwarding to Altitud Hub skipped: ALTITUD_HUB_URL or ALTITUD_HUB_API_SECRET not set.");
      return;
    }

    const endpoint = `${hubUrl.replace(/\/$/, "")}/api/v1/leads`;

    fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        ...leadPayload,
        timestamp: new Date().toISOString(),
      }),
      keepalive: true,
    }).catch((err) => {
      console.error("Failed to forward lead to ALTITUD HUB:", err);
    });
  } catch (error) {
    console.error("Failed to prepare lead forwarding payload:", error);
  }
}
