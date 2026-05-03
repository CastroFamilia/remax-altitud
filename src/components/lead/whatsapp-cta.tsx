"use client";

/**
 * Lead tracking for WhatsApp CTA clicks — Story 4.2 (AC #8 / FR54)
 *
 * Client-side only. This file accesses `window` to dispatch custom
 * browser events. Marking it 'use client' prevents Next.js from
 * attempting to run it on the server.
 *
 * NOTE: Story 4.2 does NOT implement POST /api/leads (Epic 5 / Story 5.3 scope).
 * This is a client-side placeholder that dispatches a custom event.
 * Epic 5 Story 5.3 will replace the dispatchEvent call with a real API call.
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
 * TODO Story 5.3: Replace with POST /api/leads
 */
export function trackWhatsAppClick(event: WhatsAppClickEvent): void {
  // TODO Story 5.3: Replace with POST /api/leads
  // For now, emit a custom event for future analytics integration
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("whatsapp_click", { detail: event }));
  }
}
