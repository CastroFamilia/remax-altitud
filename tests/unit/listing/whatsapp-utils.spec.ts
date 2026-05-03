/**
 * Story 4.2: Agent Card & Contact CTAs
 * Module: src/lib/utils/whatsapp.ts
 *
 * Covers:
 *   AC #2  — buildWhatsAppUrl returns correct wa.me URL
 *   AC #3  — buildWhatsAppMessage returns Spanish message for Spanish locale
 *
 * Environment: node (no JSX — .spec.ts runs in node environment by default)
 */

import { describe, it, expect } from "vitest";
import { buildWhatsAppMessage, buildWhatsAppUrl } from "@/lib/utils/whatsapp";

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe("Story 4.2: whatsapp utility functions", () => {
  // buildWhatsAppMessage — [P0] core behavior

  it("[P0] 4.2-UTIL-001: buildWhatsAppMessage returns English message for locale='en'", () => {
    const message = buildWhatsAppMessage({
      agentName: "Emma Smith",
      propertyTitle: "Beautiful Mountain Home",
      propertyRef: "ALT-12345",
      locale: "en",
    });

    // English format: "Hi [name], I'm interested in "[title]" (Ref: [ref])."
    expect(message).toContain("Emma Smith");
    expect(message).toContain("Beautiful Mountain Home");
    expect(message).toContain("ALT-12345");
    expect(message).toMatch(/^Hi /);
  });

  it("[P0] 4.2-UTIL-002: buildWhatsAppMessage returns Spanish message for locale='es' (AC #3)", () => {
    const message = buildWhatsAppMessage({
      agentName: "Emma Smith",
      propertyTitle: "Casa en la Montaña",
      propertyRef: "ALT-12345",
      locale: "es",
    });

    // Spanish format: "Hola [name], me interesa la propiedad "[title]"..."
    expect(message).toContain("Emma Smith");
    expect(message).toContain("Casa en la Montaña");
    expect(message).toContain("ALT-12345");
    expect(message).toMatch(/^Hola /);
  });

  it("[P0] 4.2-UTIL-003: buildWhatsAppUrl returns correct wa.me URL with encoded message", () => {
    const url = buildWhatsAppUrl("50688000000", "Hello World");

    expect(url).toMatch(/^https:\/\/wa\.me\/50688000000\?text=/);
    expect(url).toContain(encodeURIComponent("Hello World"));
  });

  // [P1] Edge cases — URL encoding and special characters

  it("[P1] 4.2-UTIL-004: buildWhatsAppUrl encodes special characters in message (spaces, commas, apostrophes)", () => {
    const message = "Hi John, I'm interested in \"Casa Bella\" (Ref: ALT-99)";
    const url = buildWhatsAppUrl("50600000001", message);

    // URL must be properly encoded — raw spaces and quotes would break URLs
    expect(url).not.toContain(" ");
    expect(url).not.toContain('"');
    // Encoded equivalents must be present
    expect(url).toContain("%20");
  });

  it("[P1] 4.2-UTIL-005: buildWhatsAppMessage handles agent name with special characters", () => {
    const message = buildWhatsAppMessage({
      agentName: "María José Rodríguez",
      propertyTitle: "Villa Pacífica",
      propertyRef: "ALT-99999",
      locale: "es",
    });

    // Special characters in name should be preserved in message
    expect(message).toContain("María José Rodríguez");
    expect(message).toContain("Villa Pacífica");
  });
});
