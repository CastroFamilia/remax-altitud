/**
 * AgentProfileHero — Story 4.3 (AC #1, #5)
 *
 * Server Component: renders agent's photo, name, bio, languages, office,
 * and listing count. Contact CTAs are delegated to AgentProfileCTAs (Client Component).
 */

import Image from "next/image";
import { getTranslations } from "next-intl/server";
import type { Agent } from "@/lib/db/schema/agents";
import { AgentProfileCTAs } from "@/components/agent/agent-profile-ctas";

interface AgentProfileHeroProps {
  agent: Agent;
  officeName: string;
  locale: string;
}

// Known language code → i18n key. Anything else falls back to upper-cased code.
const KNOWN_LANGUAGES = new Set(["en", "es", "de", "fr", "it", "pt"]);

export async function AgentProfileHero({ agent, officeName, locale }: AgentProfileHeroProps) {
  const t = await getTranslations("AgentProfile");

  // Photo fallback chain: photoOptimizedUrl → photoUrl → placeholder.
  // Treat empty strings as missing — next/image throws on src="".
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

  // Bio: locale-aware, empty bio hidden
  const bio = locale === "es" ? agent.bioEs : agent.bioEn;

  const isOwner =
    agent.name.toLowerCase().includes("cesar") ||
    agent.name.toLowerCase().includes("césar") ||
    agent.name.toLowerCase().includes("alejandra");
  const displayTitle = isOwner ? "BROKER/OWNER" : officeName;

  return (
    <section
      aria-labelledby="agent-name-heading"
      data-testid="agent-profile-hero"
      className="mx-auto max-w-3xl space-y-6 py-8"
    >
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <div className="shrink-0">
          <Image
            src={photoSrc}
            alt={agent.name}
            width={160}
            height={160}
            sizes="160px"
            className="rounded-full object-cover"
            data-testid="agent-profile-photo"
          />
        </div>
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <h1
            id="agent-name-heading"
            className="text-2xl font-extrabold text-brand-navy md:text-3xl"
          >
            {agent.name}
          </h1>
          <p className="mt-1 text-base text-text-muted">{displayTitle}</p>
          {languages && (
            <p className="mt-1 text-sm text-text-muted" data-testid="agent-profile-languages">
              {languages}
            </p>
          )}
          {!isOwner && (
            <p className="mt-1 text-sm text-text-muted" data-testid="agent-profile-listing-count">
              {agent.listingCount} {t("listings")}
            </p>
          )}
        </div>
      </div>

      {bio && <p className="text-base text-text-body">{bio}</p>}

      <div>
        <AgentProfileCTAs
          agentWhatsapp={agent.whatsapp}
          agentEmail={agent.email}
          agentName={agent.name}
          locale={locale}
          agentId={agent.id}
        />
      </div>

      {agent.videoUrl && (
        <div className="mt-8 overflow-hidden rounded-xl bg-brand-light shadow-sm">
          {agent.videoUrl.includes("youtube.com") || agent.videoUrl.includes("youtu.be") ? (
            <iframe
              className="aspect-video w-full"
              src={agent.videoUrl
                .replace("watch?v=", "embed/")
                .replace("youtu.be/", "youtube.com/embed/")}
              title={`${agent.name} Presentation Video`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video
              className="aspect-video w-full"
              controls
              src={agent.videoUrl}
              title={`${agent.name} Presentation Video`}
            />
          )}
        </div>
      )}
    </section>
  );
}

export default AgentProfileHero;
