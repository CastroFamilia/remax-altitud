import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SimplePageLayout } from "@/components/layout/simple-page-layout";
import { Link } from "@/i18n/navigation";
import { getAgentBySlug, getAllAgentSlugs, getPropertiesByAgentId } from "@/lib/db/queries/agents";
import { getOfficeById } from "@/lib/db/queries/offices";
import { AgentProfileHero } from "@/components/agent/agent-profile-hero";
import { AgentListingsGrid } from "@/components/agent/agent-listings-grid";
import type { PropertySearchItem } from "@/types/search";

// Story 4.3 Task 5: ISR — revalidate every 24 hours.
// on-demand revalidation via revalidateTag('agents') from the sync pipeline.
export const revalidate = 86400;

/**
 * SSG build-time generation — calls getAllAgentSlugs at build time.
 * Wrapped in try/catch so the build continues if the DB is unavailable
 * (pages generated on-demand via ISR fallback).
 */
export async function generateStaticParams() {
  try {
    const slugs = await getAllAgentSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return []; // Build continues; pages generated on-demand via ISR
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const agent = await getAgentBySlug(slug);
  if (!agent) return {};
  const t = await getTranslations({ locale, namespace: "AgentProfile" });
  const bio = locale === "es" ? agent.bioEs : agent.bioEn;
  return {
    title: `${agent.name} | RE/MAX Altitud`,
    description: bio.slice(0, 160) || t("defaultMetaDescription", { name: agent.name }),
    openGraph: {
      title: `${agent.name} | RE/MAX Altitud`,
      description: bio.slice(0, 160) || t("defaultMetaDescription", { name: agent.name }),
      images: agent.photoOptimizedUrl ? [{ url: agent.photoOptimizedUrl }] : [],
    },
  };
}

export default async function AgentProfilePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug, locale } = await params;
  setRequestLocale(locale); // required for next-intl static rendering support

  const agent = await getAgentBySlug(slug);

  // Unknown slug → 404
  if (!agent) {
    notFound();
  }

  // Inactive agent → "no longer active" page (NOT a 404)
  if (!agent.isActive) {
    const t = await getTranslations({ locale, namespace: "AgentProfile" });
    return (
      <SimplePageLayout pageTitle={agent.name}>
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-6 text-base text-text-muted">{t("agentNoLongerActive")}</p>
          <Link
            href="/agents"
            className="inline-block rounded-lg bg-brand-navy px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-navy/90"
          >
            {t("backToAgents")}
          </Link>
        </div>
      </SimplePageLayout>
    );
  }

  // Fetch office name and agent properties in parallel
  const [office, agentProperties] = await Promise.all([
    agent.officeId ? getOfficeById(agent.officeId) : Promise.resolve(null),
    getPropertiesByAgentId(agent.id),
  ]);

  const officeName = office?.name ?? "RE/MAX Altitud";

  return (
    <div className="container py-8 md:py-12">
      <AgentProfileHero agent={agent} officeName={officeName} locale={locale} />
      <AgentListingsGrid
        properties={agentProperties as unknown as PropertySearchItem[]}
        locale={locale}
        agentName={agent.name}
      />
    </div>
  );
}
