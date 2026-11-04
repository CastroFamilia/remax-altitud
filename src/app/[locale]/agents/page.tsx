import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SimplePageLayout } from "@/components/layout/simple-page-layout";
import { AgentIndexFilters } from "@/components/agent/agent-index-filters";
import { getAllAgents } from "@/lib/db/queries/agents";
import { getAllOffices } from "@/lib/db/queries/offices";
import { Link } from "@/i18n/navigation";
import {
  fetchTheHubAgents,
  buildTheHubLookups,
  findMatchingTheHubAgent,
  type TheHubAgent,
} from "@/lib/thehub/agents";

// Revalidate every 60s (ISR) for fast responses and auto-syncing with TheHub
export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "AgentProfile" });
  return {
    title: `${t("indexPageTitle")} | REMAX Altitud`,
    description: t("indexPageDescription"),
  };
}

export default async function AgentsIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale); // required for next-intl static rendering support

  const t = await getTranslations({ locale, namespace: "AgentProfile" });

  let allAgents: Awaited<ReturnType<typeof getAllAgents>> = [];
  let officeMap: Record<string, string> = {};
  let theHubAgents: TheHubAgent[] = [];

  try {
    const [agentsResult, officesResult, theHubResult] = await Promise.allSettled([
      getAllAgents(),
      getAllOffices(),
      fetchTheHubAgents(),
    ]);

    if (agentsResult.status === "fulfilled") {
      allAgents = agentsResult.value;
    } else {
      console.error("Failed to load agents from database:", agentsResult.reason);
    }

    if (officesResult.status === "fulfilled") {
      officeMap = Object.fromEntries(officesResult.value.map((o) => [o.id, o.name]));
    } else {
      console.error("Failed to load offices from database:", officesResult.reason);
    }

    if (theHubResult.status === "fulfilled") {
      theHubAgents = theHubResult.value;
    } else {
      console.warn("Failed to load TheHub data (non-fatal):", theHubResult.reason);
    }
  } catch (err) {
    console.error("Failed to load agents page data:", err);
  }

  const theHubLookups = buildTheHubLookups(theHubAgents);

  const enrichedAgents = allAgents.map((agent) => {
    const match = findMatchingTheHubAgent(theHubLookups, agent.email, agent.name, agent.slug);
    return {
      ...agent,
      theHubBio: match?.bio || null,
      theHubSlug: match?.slug || agent.slug,
      theHubPhone: match?.phone || null,
      theHubEmail: match?.email || null,
    };
  });

  return (
    <SimplePageLayout pageTitle={t("indexPageTitle")} intro={t("indexPageDescription")}>
      <div className="flex justify-center mb-8">
        <Link
          href="/join"
          className="inline-flex h-11 items-center justify-center rounded-md bg-brand-navy px-8 text-sm font-medium text-white transition-colors hover:bg-brand-navy/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        >
          {t("joinTeamCta")}
        </Link>
      </div>
      <AgentIndexFilters agents={enrichedAgents} locale={locale} officeMap={officeMap} />
    </SimplePageLayout>
  );
}
