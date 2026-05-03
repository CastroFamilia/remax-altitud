"use client";

/**
 * AgentCard — Story 4.2 (AC #1, #2, #3, #4, #5, #9)
 *
 * Displays agent identity + contact CTAs on the listing detail page.
 * Client Component: builds WhatsApp URLs with locale context and tracks clicks.
 */

import Image from "next/image";
import { useTranslations } from "next-intl";
import { buildWhatsAppMessage, buildWhatsAppUrl } from "@/lib/utils/whatsapp";
import { extractUtmParams } from "@/lib/utils/utm";
import { trackWhatsAppClick } from "@/components/lead/whatsapp-cta";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import type { Agent } from "@/lib/db/schema/agents";

interface AgentCardProps {
  agent: Agent;
  propertyTitle: string;
  propertyRef: string; // property's apiId — used in WhatsApp message, e.g. "ALT-12345"
  locale: string;
  officeName: string; // resolved server-side and passed as prop
}

// Known language code → i18n key. Anything else falls back to upper-cased code.
const KNOWN_LANGUAGES = new Set(["en", "es", "de", "fr", "it", "pt"]);

export function AgentCard({
  agent,
  propertyTitle,
  propertyRef,
  locale,
  officeName,
}: AgentCardProps) {
  const t = useTranslations("AgentCard");

  // Photo fallback chain: photoOptimizedUrl → photoUrl → placeholder.
  // Treat empty strings as missing — next/image throws on src="".
  const photoSrc =
    (agent.photoOptimizedUrl && agent.photoOptimizedUrl.length > 0
      ? agent.photoOptimizedUrl
      : null) ??
    (agent.photoUrl && agent.photoUrl.length > 0 ? agent.photoUrl : null) ??
    "/images/agent-placeholder.svg";

  // Build WhatsApp URL (only when whatsapp is set; sanitize to digits-only for wa.me).
  const whatsappDigits = agent.whatsapp ? agent.whatsapp.replace(/\D/g, "") : "";
  const whatsappMessage = whatsappDigits
    ? buildWhatsAppMessage({ agentName: agent.name, propertyTitle, propertyRef, locale })
    : null;
  const whatsappUrl =
    whatsappDigits && whatsappMessage ? buildWhatsAppUrl(whatsappDigits, whatsappMessage) : null;

  // Build mailto URL
  const emailSubject = agent.email
    ? t("emailSubject", { title: propertyTitle, ref: propertyRef })
    : null;
  const emailBody = agent.email ? t("emailBody", { title: propertyTitle, ref: propertyRef }) : null;
  const emailUrl =
    agent.email && emailSubject && emailBody
      ? `mailto:${agent.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`
      : null;

  // Languages: map locale codes to human-readable labels via i18n keys.
  // Guard against null/non-array values from the DB and unknown codes.
  const languageCodes: string[] = Array.isArray(agent.languages)
    ? (agent.languages as string[])
    : [];
  const languages = languageCodes
    .map((lang) =>
      KNOWN_LANGUAGES.has(lang)
        ? t(`language.${lang}` as Parameters<typeof t>[0])
        : lang.toUpperCase(),
    )
    .join(", ");

  function handleWhatsAppClick() {
    trackWhatsAppClick({
      agentId: agent.id,
      propertyRef,
      locale,
      source: "listing_detail",
      utmParams: extractUtmParams(),
    });
  }

  return (
    <article
      aria-label={t("agentCardLabel", { name: agent.name })}
      data-testid="agent-card"
      className="rounded-xl border border-border bg-background p-6 shadow-sm"
    >
      {/* Agent photo + info */}
      <div className="flex items-start gap-4">
        <div className="shrink-0">
          <Image
            src={photoSrc}
            alt={t("agentPhotoAlt", { name: agent.name })}
            width={80}
            height={80}
            sizes="80px"
            className="rounded-full object-cover"
            data-testid="agent-photo"
          />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold text-brand-navy">{agent.name}</h3>
          {languages && (
            <p className="mt-1 text-sm text-text-muted" data-testid="agent-languages">
              {languages}
            </p>
          )}
          <p className="mt-1 text-sm text-text-muted">{officeName}</p>
          {agent.listingCount > 0 && (
            <p className="mt-1 text-xs text-text-muted">
              {agent.listingCount} {t("listings")}
            </p>
          )}
        </div>
      </div>

      {/* Transparency note (FR36 / AC #5) */}
      <p className="mt-4 text-sm text-text-muted" data-testid="agent-transparency-note">
        {t("transparencyNote")}
      </p>

      {/* CTA buttons */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        {whatsappUrl ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleWhatsAppClick}
            data-testid="agent-whatsapp-cta"
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-whatsapp px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <WhatsAppIcon className="h-5 w-5" />
            {t("whatsapp")}
          </a>
        ) : null}

        {emailUrl ? (
          <a
            href={emailUrl}
            data-testid="agent-email-cta"
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-navy px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            {t("email")}
          </a>
        ) : (
          <span
            aria-disabled="true"
            data-testid="agent-email-cta"
            className="flex flex-1 cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-400"
          >
            {t("email")}
          </span>
        )}
      </div>
    </article>
  );
}

export default AgentCard;
