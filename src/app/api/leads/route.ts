/**
 * POST /api/leads — Story 5.3 (AC #1, #2, #3, #4, #8, #9, #10)
 *
 * Creates a lead record for all sources (seller, CMA, VIP buyer,
 * contact, agent contact, WhatsApp click) with:
 * - Zod input validation (AR18)
 * - Idempotency dedup (60s window, phone_hash + source)
 * - PII encryption (phone, email) via encryptField()
 * - Agent routing via matchAgentByCoordinates()
 * - UTM / referrer source tracking (FR54)
 * - Auto-responder emails for all sources with email provided
 * - Agent notification emails for agent_contact source
 * - Sentry error capture (AR19)
 * - In-memory rate limiting (10 req/min/IP)
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";
import { createLead, findRecentDuplicate } from "@/lib/db/queries/leads";
import { matchAgentByCoordinates } from "@/lib/leads/route-agent";
import { forwardLeadToHubInBackground } from "@/lib/services/tracking";
import { sendEmailInBackground } from "@/lib/services/email";
import { renderPropertyInquiryEmail } from "@/lib/emails/PropertyInquiryEmail";
import { renderGenericLeadConfirmationEmail } from "@/lib/emails/GenericLeadConfirmationEmail";
import { renderAgentLeadNotificationEmail } from "@/lib/emails/AgentLeadNotificationEmail";
import { db } from "@/lib/db/client";
import { properties } from "@/lib/db/schema/properties";
import { eq } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Zod input schema
// ---------------------------------------------------------------------------

const locationSchema = z
  .object({
    text: z.string().default(""),
    lat: z.number().nullable().default(null),
    lng: z.number().nullable().default(null),
  })
  .default({ text: "", lat: null, lng: null });

const leadInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(7, "Phone must have at least 7 characters"),
  email: z.string().email("Invalid email").nullable().optional().or(z.literal("")),
  source: z.enum([
    "whatsapp",
    "seller_form",
    "contact_form",
    "cma_form",
    "whatsapp_click",
    "agent_contact",
  ]),
  intent: z.enum(["buy", "sell", "invest", "recruit"]),
  propertyType: z.string().optional().default(""),
  location: locationSchema,
  size: z.string().optional().default(""),
  sizeUnit: z.string().optional().default(""),
  priceExpectation: z.string().nullable().optional().default(null),
  needsPricingHelp: z.boolean().optional().default(false),
  description: z.string().optional().default(""),
  bedrooms: z.string().nullable().optional().default(null),
  bathrooms: z.string().nullable().optional().default(null),
  preferredLanguage: z.string().optional().default(""),
  notes: z.string().optional().default(""),
  utm_source: z
    .string()
    .max(200)
    .regex(/^[a-zA-Z0-9_\-./ ]*$/, "Invalid utm_source characters")
    .nullable()
    .optional()
    .default(null),
  utm_medium: z
    .string()
    .max(200)
    .regex(/^[a-zA-Z0-9_\-./ ]*$/, "Invalid utm_medium characters")
    .nullable()
    .optional()
    .default(null),
  utm_campaign: z
    .string()
    .max(200)
    .regex(/^[a-zA-Z0-9_\-./ ]*$/, "Invalid utm_campaign characters")
    .nullable()
    .optional()
    .default(null),
  referrer: z.string().max(2000).nullable().optional().default(null),
  assignedAgentId: z.string().uuid().optional().nullable().default(null),
  shortlistPropertyIds: z.array(z.string().uuid()).optional().default([]),
});

// ---------------------------------------------------------------------------
// In-memory rate limiter (10 req/min per IP)
// ---------------------------------------------------------------------------

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;
let rateLimitRequestCount = 0;
const RATE_LIMIT_CLEANUP_INTERVAL = 100; // prune expired entries every N requests

function isRateLimited(ip: string): boolean {
  // Skip rate limiting in test environment
  if (process.env.NODE_ENV === "test" || process.env.VITEST) return false;

  const now = Date.now();

  // Periodic cleanup to prevent unbounded Map growth
  rateLimitRequestCount++;
  if (rateLimitRequestCount >= RATE_LIMIT_CLEANUP_INTERVAL) {
    rateLimitRequestCount = 0;
    for (const [key, entry] of rateLimitMap) {
      if (now > entry.resetAt) rateLimitMap.delete(key);
    }
  }

  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) return true;
  return false;
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  // Rate limiting
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }

  // Parse body
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Zod validation
  const parseResult = leadInputSchema.safeParse(rawBody);
  if (!parseResult.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        issues: parseResult.error.issues,
      },
      { status: 400 },
    );
  }

  const data = parseResult.data;

  // Capture HTTP Referer from request headers (fallback to body referrer)
  // Headers.get() is case-insensitive per spec — one call suffices
  const headerReferer = request.headers.get("referer");
  const referrer = data.referrer || headerReferer || null;

  try {
    // Idempotency dedup: check for same phone + source within 60s
    const duplicate = await findRecentDuplicate(data.phone, data.source);
    if (duplicate) {
      return NextResponse.json(
        {
          error: "Already submitted",
          leadId: duplicate.id,
        },
        { status: 409 },
      );
    }

    // Agent routing
    const isSellerOrCma = data.source === "seller_form" || data.source === "cma_form";
    const assignedAgentId = isSellerOrCma
      ? null
      : data.assignedAgentId ||
        (await matchAgentByCoordinates(data.location.lat, data.location.lng));

    // Build notes from property details
    const noteParts: string[] = [];
    if (data.notes) noteParts.push(data.notes);
    if (data.propertyType) noteParts.push(`Property: ${data.propertyType}`);
    if (data.size) noteParts.push(`Size: ${data.size} ${data.sizeUnit}`);
    if (data.priceExpectation) noteParts.push(`Price: ${data.priceExpectation}`);
    if (data.needsPricingHelp) noteParts.push("Needs pricing consultation");
    if (data.description) noteParts.push(`Description: ${data.description}`);
    if (data.bedrooms) noteParts.push(`Beds: ${data.bedrooms}`);
    if (data.bathrooms) noteParts.push(`Baths: ${data.bathrooms}`);
    if (data.location.text) noteParts.push(`Location: ${data.location.text}`);

    // Create lead (encryption happens inside createLead)
    const lead = await createLead({
      name: data.name,
      phone: data.phone,
      email: data.email || null,
      source: data.source,
      intent: data.intent,
      language: data.preferredLanguage || null,
      assignedAgentId,
      shortlistPropertyIds: data.shortlistPropertyIds || [],
      notes: noteParts.join(" | ") || null,
      utmSource: data.utm_source,
      utmMedium: data.utm_medium,
      utmCampaign: data.utm_campaign,
      referrer,
      status: "new",
    });

    // Forward lead details to Altitud Hub in the background (Option B)
    forwardLeadToHubInBackground({
      id: lead.id,
      name: data.name,
      phone: data.phone,
      email: data.email || null,
      source: data.source,
      intent: data.intent,
      language: data.preferredLanguage || null,
      assignedAgentId,
      shortlistPropertyIds: data.shortlistPropertyIds || [],
      notes: noteParts.join(" | ") || null,
      utmSource: data.utm_source,
      utmMedium: data.utm_medium,
      utmCampaign: data.utm_campaign,
      referrer,
      status: "new",
    });

    // Fetch agent details for confirmation screen (non-fatal, dynamic import)
    let agentDetails = null;
    if (assignedAgentId) {
      try {
        const { getAgentById } = await import("@/lib/db/queries/agents");
        const agent = await getAgentById(assignedAgentId);
        if (agent) {
          agentDetails = {
            id: agent.id,
            name: agent.name,
            phone: agent.phone,
            email: agent.email,
            whatsapp: agent.whatsapp,
            photoUrl: agent.photoOptimizedUrl ?? agent.photoUrl,
            languages: agent.languages,
            listingCount: agent.listingCount,
            slug: agent.slug,
            officeId: agent.officeId,
          };
        }
      } catch {
        // Agent fetch failure is non-fatal — lead was already created
      }
    }

    // -----------------------------------------------------------------------
    // Auto-responder emails — send confirmation to leads who provide email
    // -----------------------------------------------------------------------
    if (data.email && data.source !== "whatsapp_click" && data.source !== "whatsapp") {
      try {
        const locale = data.preferredLanguage === "es" ? "es" : "en";

        // Property-specific email (existing behavior for property inquiry forms)
        if (data.source === "contact_form" && data.shortlistPropertyIds.length > 0) {
          const [property] = await db
            .select({
              titleEn: properties.titleEn,
              titleEs: properties.titleEs,
              slug: properties.slug,
            })
            .from(properties)
            .where(eq(properties.id, data.shortlistPropertyIds[0]))
            .limit(1);

          if (property && agentDetails) {
            const propertyName = locale === "es" ? property.titleEs : property.titleEn;
            const host = request.headers.get("host") || "dev.remax-altitud.cr";
            const protocol = host.includes("localhost") ? "http" : "https";
            const propertyUrl = `${protocol}://${host}/${locale}/property/${property.slug}`;

            const htmlContent = renderPropertyInquiryEmail({
              locale,
              propertyName,
              propertyUrl,
              agentName: agentDetails.name,
              agentEmail: agentDetails.email || "",
              agentPhone: agentDetails.whatsapp || agentDetails.phone || "",
            });

            sendEmailInBackground({
              to: data.email,
              subject:
                locale === "es" ? "Hemos recibido su consulta" : "We have received your inquiry",
              html: htmlContent,
            });
          }
        } else {
          // Generic confirmation for seller, CMA, VIP, contact, agent_contact forms
          const { subject, html } = renderGenericLeadConfirmationEmail({
            locale,
            source: data.source,
            leadName: data.name,
            agentName: agentDetails?.name,
            agentEmail: agentDetails?.email,
            agentPhone: agentDetails?.whatsapp || agentDetails?.phone,
            contactedAgentName: data.source === "agent_contact" ? agentDetails?.name : null,
          });

          sendEmailInBackground({
            to: data.email,
            subject,
            html,
          });
        }
      } catch (err) {
        console.error("Failed to send auto-responder email", err);
      }
    }

    // -----------------------------------------------------------------------
    // Agent notification email — notify the agent when contacted via profile or property inquiry
    // -----------------------------------------------------------------------
    if (
      (data.source === "agent_contact" || data.source === "contact_form") &&
      agentDetails?.email
    ) {
      try {
        const locale = data.preferredLanguage === "es" ? "es" : "en";
        const { subject, html } = renderAgentLeadNotificationEmail({
          locale,
          agentName: agentDetails.name,
          leadName: data.name,
          leadPhone: data.phone,
          leadEmail: data.email || null,
          leadMessage: data.notes || null,
        });

        sendEmailInBackground({
          to: agentDetails.email,
          subject,
          html,
        });
      } catch (err) {
        console.error("Failed to send agent notification email", err);
      }
    }

    // -----------------------------------------------------------------------
    // Office notification email — notify the office for seller and CMA leads
    // -----------------------------------------------------------------------
    if (isSellerOrCma) {
      try {
        const locale = data.preferredLanguage === "es" ? "es" : "en";
        const { subject, html } = renderAgentLeadNotificationEmail({
          locale,
          agentName: "RE/MAX Altitud",
          leadName: data.name,
          leadPhone: data.phone,
          leadEmail: data.email || null,
          leadMessage: data.notes || null,
        });

        sendEmailInBackground({
          to: "hola@remax-altitud.cr",
          subject,
          html,
        });
      } catch (err) {
        console.error("Failed to send office notification email", err);
      }
    }

    return NextResponse.json(
      {
        leadId: lead.id,
        assignedAgentId: lead.assignedAgentId,
        agent: agentDetails,
      },
      { status: 201 },
    );
  } catch (error) {
    // Sentry error capture (AR19)
    Sentry.captureException(error);

    return NextResponse.json({ error: "Lead creation failed" }, { status: 500 });
  }
}
