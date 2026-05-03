/**
 * WhatsApp message builder utilities — Story 4.2
 *
 * Pure functions, no client/server runtime guard needed.
 * Can be called from both Server and Client Components.
 */

export interface WhatsAppMessageOptions {
  agentName: string;
  propertyTitle: string;
  propertyRef: string; // e.g. "ALT-12345"
  locale: string; // "en" | "es"
}

/**
 * Builds a pre-populated WhatsApp message in the user's language.
 * AC #2 (English), AC #3 (Spanish).
 */
export function buildWhatsAppMessage(opts: WhatsAppMessageOptions): string {
  if (opts.locale === "es") {
    return `Hola ${opts.agentName}, me interesa la propiedad "${opts.propertyTitle}" (Ref: ${opts.propertyRef}).`;
  }
  return `Hi ${opts.agentName}, I'm interested in "${opts.propertyTitle}" (Ref: ${opts.propertyRef}).`;
}

/**
 * Builds a wa.me URL with the message URL-encoded.
 * `whatsapp` must be E.164 digits only (e.g. "50627710000").
 * Strips any non-digit characters defensively. Returns `null` if no
 * digits remain — the caller is expected to guard the link against null.
 */
export function buildWhatsAppUrl(whatsapp: string, message: string): string | null {
  const digits = whatsapp.replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
