import * as Sentry from "@sentry/nextjs";

export interface RecruitmentDataPayload {
  languages?: string;
  area?: string;
  car?: string;
  computer?: string;
  time?: string;
  financial?: string;
  experience?: string;
  commission?: string;
  message?: string;
}

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
  recruitmentData?: RecruitmentDataPayload | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  referrer?: string | null;
  status?: string;
}

export type TheHubIntent = "buy" | "sell" | "rent" | "invest" | "recruit";

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
  recruitmentData?: RecruitmentDataPayload;
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

export function parseRecruitmentNotes(notes?: string | null): RecruitmentDataPayload {
  if (!notes) return {};
  const fields: Record<string, string> = {};
  const parts = notes.includes("\n") ? notes.split("\n") : notes.split(" | ");
  for (const part of parts) {
    const idx = part.indexOf(":");
    if (idx > 0) {
      const key = part.slice(0, idx).trim().toLowerCase();
      const val = part.slice(idx + 1).trim();
      fields[key] = val;
    }
  }
  return {
    languages: fields.languages || fields.idiomas,
    area: fields.area || fields["área"],
    car:
      fields["has vehicle"] ||
      fields["has car"] ||
      fields.vehiculo ||
      fields["vehículo"] ||
      fields.car ||
      fields.carro,
    computer: fields["has computer"] || fields.computadora || fields.computer || fields.laptop,
    time:
      fields["time availability"] ||
      fields["hours availability"] ||
      fields.tiempo ||
      fields.time ||
      fields.horas ||
      fields.hours,
    financial: fields.financial || fields.financiero,
    experience: fields.experience || fields.experiencia,
    commission:
      fields["commission outlook"] || fields.comision || fields["comisión"] || fields.commission,
    message: fields.message || fields.mensaje,
  };
}

/**
 * Normalizes internal lead intent to TheHub's supported enum ("buy" | "sell" | "rent" | "invest" | "recruit").
 */
export function normalizeIntent(intent: string): {
  normalizedIntent: TheHubIntent;
  extraNote?: string;
} {
  const lower = (intent || "").toLowerCase().trim();
  if (
    lower === "buy" ||
    lower === "sell" ||
    lower === "rent" ||
    lower === "invest" ||
    lower === "recruit"
  ) {
    return { normalizedIntent: lower as TheHubIntent };
  }

  // Fallback for non-standard value to "invest"
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
      process.env.THE_HUB_API_URL ||
      process.env.THEHUB_API_URL ||
      process.env.ALTITUD_HUB_URL ||
      (process.env.NODE_ENV === "production"
        ? "https://thehub.remax-altitud.cr"
        : "http://localhost:3000");
    const apiKey =
      process.env.THEHUB_API_KEY ||
      process.env.THEHUB_INTERNAL_API_SECRET ||
      process.env.ALTITUD_HUB_API_SECRET;

    if (!baseUrl) {
      console.warn(
        "[TheHub Job] Skipped: Neither THE_HUB_API_URL nor THEHUB_API_URL is configured.",
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
      ...(payload.recruitmentData ? { recruitmentData: payload.recruitmentData } : {}),
    };

    const endpoint = `${baseUrl.replace(/\/$/, "")}/api/v1/leads`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
      headers["X-API-Key"] = apiKey;
    }

    // If intent is recruitment, also dispatch to TheHub's recruiting candidate endpoint
    if (payload.intent === "recruit") {
      const candidateEndpoint = `${baseUrl.replace(/\/$/, "")}/api/v1/recruiting/candidates`;
      const rec = payload.recruitmentData || parseRecruitmentNotes(payload.notes);

      const candidatePayload = {
        name: payload.name,
        email: payload.email || "",
        phone: payload.phone,
        languages: rec.languages,
        area: rec.area,
        car: rec.car,
        computer: rec.computer,
        time: rec.time,
        financial: rec.financial,
        experience: rec.experience,
        commission: rec.commission,
        message: rec.message,
        notes: payload.notes || undefined,
      };

      fetch(candidateEndpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(candidatePayload),
        signal: AbortSignal.timeout(10000),
      })
        .then(async (response) => {
          if (!response.ok) {
            const txt = await response.text().catch(() => "");
            console.error(
              `[TheHub Candidate Job] Failed to post candidate. Status: ${response.status}. Body: ${txt}`,
            );
          } else {
            console.log("[TheHub Candidate Job] Candidate forwarded successfully to TheHub.");
          }
        })
        .catch((err) => {
          console.error("[TheHub Candidate Job] Error posting candidate to TheHub API:", err);
          Sentry.captureException(err);
        });
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
