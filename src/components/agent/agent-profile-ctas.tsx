"use client";

/**
 * AgentProfileCTAs — Story 4.3 (AC #1)
 *
 * Client Component: builds WhatsApp URLs at runtime (locale-aware message, no property context).
 * Provides WhatsApp + Email CTAs for the agent profile page.
 */

import { useTranslations } from "next-intl";
import { buildWhatsAppUrl } from "@/lib/utils/whatsapp";
import { extractUtmParams } from "@/lib/utils/utm";
import { trackWhatsAppClick } from "@/components/lead/whatsapp-cta";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";

interface AgentProfileCTAsProps {
  agentWhatsapp: string | null;
  agentEmail: string | null;
  agentName: string;
  locale: string;
  agentId: string; // for lead tracking
}

export function AgentProfileCTAs({
  agentWhatsapp,
  agentEmail,
  agentName,
  locale,
  agentId,
}: AgentProfileCTAsProps) {
  const t = useTranslations("AgentProfile");

  // General inquiry message (no property context on agent profile page).
  // Localized via the `generalInquiryEn` key, which has Spanish + English copies
  // in src/messages/{en,es}.json — the active locale namespace selects which.
  const agentProfileMessage = t("generalInquiryEn", { name: agentName });

  // Build WhatsApp URL
  const whatsappDigits = agentWhatsapp ? agentWhatsapp.replace(/\D/g, "") : "";
  const whatsappUrl = whatsappDigits ? buildWhatsAppUrl(whatsappDigits, agentProfileMessage) : null;

  // Build mailto URL
  const emailUrl = agentEmail ? `mailto:${agentEmail}` : null;

  function handleWhatsAppClick() {
    trackWhatsAppClick({
      agentId,
      propertyRef: "",
      locale,
      source: "agent_profile",
      utmParams: extractUtmParams(),
    });
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      {whatsappUrl ? (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleWhatsAppClick}
          data-testid="agent-profile-whatsapp-cta"
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-whatsapp px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          <WhatsAppIcon className="h-5 w-5" />
          {t("whatsapp")}
        </a>
      ) : null}

      {emailUrl ? (
        <a
          href={emailUrl}
          data-testid="agent-profile-email-cta"
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-navy px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          {t("email")}
        </a>
      ) : null}
    </div>
  );
}

export default AgentProfileCTAs;
