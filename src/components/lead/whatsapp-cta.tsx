"use client";

/**
 * Lead tracking for WhatsApp CTA clicks — Story 5.3 (AC #5 / FR54)
 *
 * Client-side only. Fires a POST /api/leads with source="whatsapp_click"
 * as a fire-and-forget operation. Also dispatches a custom browser event
 * for backwards compatibility and future analytics integration.
 */

import type { UtmParams } from "@/lib/utils/utm";

export interface WhatsAppClickEvent {
  agentId: string;
  propertyRef: string;
  locale: string;
  source: string; // "listing_detail" | "sticky_mobile_cta"
  utmParams: UtmParams;
}

/**
 * Fires a lead tracking event when WhatsApp is clicked.
 * Story 5.3: POST /api/leads (fire-and-forget, no await).
 */
export function trackWhatsAppClick(event: WhatsAppClickEvent): void {
  // Fire-and-forget: POST /api/leads with whatsapp_click source
  try {
    fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "WhatsApp Click",
        phone: "0000000", // placeholder — satisfies min(7) Zod rule; not a real contact
        source: "whatsapp_click",
        intent: "buy",
        notes: `WhatsApp click from ${event.source} for agent ${event.agentId}`,
        utm_source: event.utmParams.source ?? null,
        utm_medium: event.utmParams.medium ?? null,
        utm_campaign: event.utmParams.campaign ?? null,
        referrer: typeof document !== "undefined" ? document.referrer || null : null,
        preferredLanguage: event.locale,
        location: { text: "", lat: null, lng: null },
      }),
    }).catch(() => {
      // Fire-and-forget — intentionally swallow errors
    });
  } catch {
    // Fire-and-forget — intentionally swallow errors
  }

  // Also dispatch custom event for backwards compatibility and analytics
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("whatsapp_click", { detail: event }));
  }
}

