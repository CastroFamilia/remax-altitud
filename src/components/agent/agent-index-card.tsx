"use client";

/**
 * AgentIndexCard — Story 4.3 (AC #4) & Issue #335
 *
 * Client Component (child of AgentIndexFilters tree).
 * Renders a rich agent card with photo, name, languages, bio snippet,
 * direct phone/WhatsApp, direct email, and "Envíame un referido" quick action.
 */

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Phone, Mail, ArrowUpRight } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import type { Agent } from "@/lib/db/schema/agents";

export type EnrichedAgent = Agent & {
  theHubBio?: string | null;
  theHubSlug?: string | null;
  theHubPhone?: string | null;
  theHubEmail?: string | null;
};

interface AgentIndexCardProps {
  agent: EnrichedAgent;
  officeName: string;
  locale: string;
}

// Known language code → i18n key. Anything else falls back to upper-cased code.
const KNOWN_LANGUAGES = new Set(["en", "es", "de", "fr", "it", "pt"]);

export function AgentIndexCard({ agent, officeName, locale }: AgentIndexCardProps) {
  const t = useTranslations("AgentProfile");

  // Photo fallback chain: photoOptimizedUrl → photoUrl → placeholder.
  const photoSrc =
    (agent.photoOptimizedUrl && agent.photoOptimizedUrl.length > 0
      ? agent.photoOptimizedUrl
      : null) ??
    (agent.photoUrl && agent.photoUrl.length > 0 ? agent.photoUrl : null) ??
    "/images/agent-placeholder.svg";

  // Languages: map locale codes to human-readable labels via i18n keys.
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

  const isOwner =
    agent.name.toLowerCase().includes("cesar") ||
    agent.name.toLowerCase().includes("césar") ||
    agent.name.toLowerCase().includes("alejandra");
  const displayTitle = isOwner ? "BROKER/OWNER" : officeName;

  // Bio: priority from TheHub, then localized DB bio
  const bio = agent.theHubBio || (locale === "es" ? agent.bioEs : agent.bioEn);

  // Contact details
  const phone = agent.theHubPhone || agent.phone || agent.whatsapp;
  const rawDigits = phone ? phone.replace(/\D/g, "") : "";
  const whatsappDigits = agent.whatsapp ? agent.whatsapp.replace(/\D/g, "") : rawDigits;
  const email = agent.theHubEmail || agent.email;

  return (
    <article
      data-testid="agent-index-card"
      aria-label={agent.name}
      className="flex h-full flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-gray-300 hover:shadow-md"
    >
      <div>
        {/* Header: Photo + Name + Role */}
        <div className="flex items-start gap-4">
          <Link href={`/agents/${agent.slug}`} locale={locale} className="shrink-0">
            <Image
              src={photoSrc}
              alt={agent.name}
              width={72}
              height={72}
              sizes="72px"
              className="rounded-full object-cover ring-2 ring-brand-navy/10 transition-transform hover:scale-105"
              data-testid="agent-index-photo"
            />
          </Link>
          <div className="min-w-0 flex-1">
            <Link href={`/agents/${agent.slug}`} locale={locale} className="group">
              <h2 className="text-base font-bold text-brand-navy group-hover:text-brand-burgundy transition-colors">
                {agent.name}
              </h2>
            </Link>
            <p className="mt-0.5 text-xs font-medium text-text-muted">{displayTitle}</p>
            {languages && (
              <p className="mt-1 text-xs text-text-muted" data-testid="agent-index-languages">
                🌐 {languages}
              </p>
            )}
            {!isOwner && (
              <p className="mt-0.5 text-xs text-text-muted" data-testid="agent-index-listing-count">
                🏠 {agent.listingCount} {t("listings")}
              </p>
            )}
          </div>
        </div>

        {/* Bio Snippet */}
        {bio && <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-slate-600">{bio}</p>}
      </div>

      {/* Contact & Action Section */}
      <div className="mt-4 border-t border-slate-100 pt-3 space-y-2.5">
        {/* Contact info rows */}
        <div className="flex flex-col gap-1 text-xs text-slate-600">
          {phone && (
            <div className="flex items-center justify-between">
              <a
                href={`tel:${rawDigits}`}
                className="inline-flex items-center gap-1.5 hover:text-brand-navy font-medium"
                title={phone}
              >
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                <span>{phone}</span>
              </a>
              {whatsappDigits && (
                <a
                  href={`https://wa.me/${whatsappDigits}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium"
                  aria-label={`WhatsApp ${agent.name}`}
                >
                  <WhatsAppIcon className="h-3.5 w-3.5" />
                  <span>WhatsApp</span>
                </a>
              )}
            </div>
          )}

          {email && (
            <div className="truncate">
              <a
                href={`mailto:${email}`}
                className="inline-flex items-center gap-1.5 hover:text-brand-navy font-medium truncate"
                title={email}
              >
                <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{email}</span>
              </a>
            </div>
          )}
        </div>

        {/* Quick action button: "Ver perfil" */}
        <Link
          href={`/agents/${agent.slug}`}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-navy px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-navy/90"
        >
          <span>{t("viewProfile")}</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  );
}

export default AgentIndexCard;
