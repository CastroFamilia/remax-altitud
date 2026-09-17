import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SimplePageLayout } from "@/components/layout/simple-page-layout";
import { AgentIndexFilters } from "@/components/agent/agent-index-filters";
import { getAllAgents } from "@/lib/db/queries/agents";
import { getAllOffices } from "@/lib/db/queries/offices";
import { Link } from "@/i18n/navigation";
import { AgentReferralBanner } from "@/components/agent/agent-referral-banner";
import {
  fetchTheHubAgents,
  buildTheHubLookups,
  findMatchingTheHubAgent,
  type TheHubAgent,
} from "@/lib/thehub/agents";

export const dynamic = "force-dynamic";

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
    const [agents, allOffices, theHubData] = await Promise.all([
      getAllAgents(),
      getAllOffices(),
      fetchTheHubAgents(),
    ]);
    allAgents = agents;
    officeMap = Object.fromEntries(allOffices.map((o) => [o.id, o.name]));
    theHubAgents = theHubData;
  } catch (err) {
    console.error("Failed to load agents:", err);
  }

  const theHubLookups = buildTheHubLookups(theHubAgents);

  const enrichedAgents = allAgents.map((agent) => {
    const match = findMatchingTheHubAgent(theHubLookups, agent.email, agent.name);
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
      <AgentReferralBanner locale={locale} />
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
