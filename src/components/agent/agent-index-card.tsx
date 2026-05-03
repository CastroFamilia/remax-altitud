"use client";

/**
 * AgentIndexCard — Story 4.3 (AC #4)
 *
 * Client Component (child of AgentIndexFilters tree).
 * Renders a single agent's card on the agents index page.
 */

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Agent } from "@/lib/db/schema/agents";

interface AgentIndexCardProps {
  agent: Agent;
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

  return (
    <Link href={`/agents/${agent.slug}`} locale={locale}>
      <article
        data-testid="agent-index-card"
        aria-label={agent.name}
        className="flex items-center gap-4 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
      >
        <div className="shrink-0">
          <Image
            src={photoSrc}
            alt={agent.name}
            width={80}
            height={80}
            sizes="80px"
            className="rounded-full object-cover"
            data-testid="agent-index-photo"
          />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold text-brand-navy">{agent.name}</h2>
          <p className="mt-0.5 text-sm text-text-muted">{officeName}</p>
          {languages && (
            <p className="mt-0.5 text-sm text-text-muted" data-testid="agent-index-languages">
              {languages}
            </p>
          )}
          <p className="mt-0.5 text-xs text-text-muted" data-testid="agent-index-listing-count">
            {agent.listingCount} {t("listings")}
          </p>
        </div>
      </article>
    </Link>
  );
}

export default AgentIndexCard;
