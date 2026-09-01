import * as Sentry from "@sentry/nextjs";

export interface SendLeadToTheHubPayload {
  id?: string;
  name: string;
  phone: string;
  email?: string | null;
  source: string;
  intent: string;
  language?: string | null;
  assignedAgentId?: string | null;
  propertyId?: string | null;
  shortlistPropertyIds?: string[];
  notes?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  referrer?: string | null;
  status?: string;
}

export type TheHubIntent = "buy" | "sell" | "rent" | "invest";

export interface TheHubLeadInput {
  name: string;
  phone: string;
  email?: string;
  source: string;
  intent: TheHubIntent;
  notes?: string;
  propertyId?: string;
  assignedAgentId?: string;
  utmData?: Record<string, unknown>;
}

export interface TheHubApiResponse {
  success: boolean;
  data?: {
    leadId: string;
    lead?: Record<string, unknown>;
  };
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Normalizes internal lead intent to TheHub's supported enum ("buy" | "sell" | "rent" | "invest").
 */
export function normalizeIntent(intent: string): {
  normalizedIntent: TheHubIntent;
  extraNote?: string;
} {
  const lower = (intent || "").toLowerCase().trim();
  if (lower === "buy" || lower === "sell" || lower === "rent" || lower === "invest") {
    return { normalizedIntent: lower as TheHubIntent };
  }

  // If intent is "recruit" or other non-standard value, fallback to "invest" and add annotation
  return {
    normalizedIntent: "invest",
    extraNote: `Original Intent: ${intent}`,
  };
}

/**
 * Sends a lead asynchronously to TheHub REST API in the background.
 * Conforms to TheHub OpenAPI POST /api/v1/leads endpoint.
 *
 * This job runs non-blocking and will never throw unhandled rejections or block the caller.
 */
export async function sendLeadToTheHubJob(payload: SendLeadToTheHubPayload): Promise<void> {
  try {
    const baseUrl =
      process.env.THEHUB_API_URL || process.env.ALTITUD_HUB_URL || "http://localhost:3000";
    const apiKey = process.env.THEHUB_API_KEY || process.env.ALTITUD_HUB_API_SECRET;

    if (!baseUrl) {
      console.warn(
        "[TheHub Job] Skipped: Neither THEHUB_API_URL nor ALTITUD_HUB_URL is configured.",
      );
      return;
    }

    const { normalizedIntent, extraNote } = normalizeIntent(payload.intent);

    // Build combined notes
    const noteParts: string[] = [];
    if (payload.notes) noteParts.push(payload.notes);
    if (extraNote) noteParts.push(extraNote);
    if (payload.language) noteParts.push(`Language: ${payload.language}`);
    if (payload.shortlistPropertyIds && payload.shortlistPropertyIds.length > 1) {
      noteParts.push(`Shortlisted Properties: ${payload.shortlistPropertyIds.join(", ")}`);
    }
    const combinedNotes = noteParts.join(" | ") || undefined;

    // Resolve propertyId (direct propertyId or single shortlist item)
    const propertyId =
      payload.propertyId ||
      (payload.shortlistPropertyIds && payload.shortlistPropertyIds.length === 1
        ? payload.shortlistPropertyIds[0]
        : undefined);

    // Build UTM data object if any UTM parameters are present
    const utmData: Record<string, unknown> = {};
    if (payload.utmSource) utmData.utm_source = payload.utmSource;
    if (payload.utmMedium) utmData.utm_medium = payload.utmMedium;
    if (payload.utmCampaign) utmData.utm_campaign = payload.utmCampaign;
    if (payload.referrer) utmData.referrer = payload.referrer;

    const leadInput: TheHubLeadInput = {
      name: payload.name,
      phone: payload.phone,
      ...(payload.email ? { email: payload.email } : {}),
      source: payload.source,
      intent: normalizedIntent,
      ...(combinedNotes ? { notes: combinedNotes } : {}),
      ...(propertyId ? { propertyId } : {}),
      ...(payload.assignedAgentId ? { assignedAgentId: payload.assignedAgentId } : {}),
      ...(Object.keys(utmData).length > 0 ? { utmData } : {}),
    };

    const endpoint = `${baseUrl.replace(/\/$/, "")}/api/v1/leads`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
      headers["X-API-Key"] = apiKey;
    }

    // Execute non-blocking fetch with 10s timeout
    fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(leadInput),
      signal: AbortSignal.timeout(10000),
      keepalive: true,
    })
      .then(async (response) => {
        if (!response.ok) {
          const responseText = await response.text().catch(() => "");
          console.error(
            `[TheHub Job] Failed to post lead. Status: ${response.status} ${response.statusText}. Body: ${responseText}`,
          );
        } else {
          const result = (await response.json().catch(() => ({}))) as TheHubApiResponse;
          console.log(
            `[TheHub Job] Lead forwarded successfully to TheHub. LeadId: ${result.data?.leadId || "unknown"}`,
          );
        }
      })
      .catch((err) => {
        console.error("[TheHub Job] Error posting lead to TheHub API:", err);
        Sentry.captureException(err);
      });
  } catch (error) {
    console.error("[TheHub Job] Failed to prepare or dispatch lead to TheHub:", error);
    Sentry.captureException(error);
  }
}
