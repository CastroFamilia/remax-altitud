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
import type { Agent } from "@/lib/db/schema/agents";

interface AgentCardProps {
  agent: Agent;
  propertyTitle: string;
  propertyRef: string; // property's apiId — used in WhatsApp message, e.g. "ALT-12345"
  locale: string;
  officeName: string; // resolved server-side and passed as prop
  variant?: "default" | "compact"; // default = listing detail sidebar; compact = future use
}

// WhatsApp icon as inline SVG (no external icon library installed)
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

export function AgentCard({
  agent,
  propertyTitle,
  propertyRef,
  locale,
  officeName,
}: AgentCardProps) {
  const t = useTranslations("AgentCard");

  // Photo fallback chain: photoOptimizedUrl → photoUrl → placeholder
  const photoSrc = agent.photoOptimizedUrl ?? agent.photoUrl ?? "/images/agent-placeholder.svg";

  // Build WhatsApp URL (only when whatsapp is set)
  const whatsappMessage = agent.whatsapp
    ? buildWhatsAppMessage({ agentName: agent.name, propertyTitle, propertyRef, locale })
    : null;
  const whatsappUrl =
    agent.whatsapp && whatsappMessage ? buildWhatsAppUrl(agent.whatsapp, whatsappMessage) : null;

  // Build mailto URL
  const emailSubject = agent.email
    ? t("emailSubject", { title: propertyTitle, ref: propertyRef })
    : null;
  const emailBody = agent.email ? t("emailBody", { title: propertyTitle, ref: propertyRef }) : null;
  const emailUrl =
    agent.email && emailSubject && emailBody
      ? `mailto:${agent.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`
      : null;

  // Languages: map locale codes to human-readable labels via i18n keys
  const languages = (agent.languages as string[])
    .map((lang) => {
      try {
        return t(`language.${lang}` as Parameters<typeof t>[0]);
      } catch {
        return lang.toUpperCase();
      }
    })
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
      role="article"
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
