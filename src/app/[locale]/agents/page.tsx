import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SimplePageLayout } from "@/components/layout/simple-page-layout";
import { AgentIndexFilters } from "@/components/agent/agent-index-filters";
import { getAllAgents } from "@/lib/db/queries/agents";
import { getAllOffices } from "@/lib/db/queries/offices";

// Story 4.3 Task 6: ISR — revalidate every 24 hours.
export const revalidate = 86400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "AgentProfile" });
  return {
    title: `${t("indexPageTitle")} | RE/MAX Altitud`,
    description: t("indexPageDescription"),
  };
}

export default async function AgentsIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale); // required for next-intl static rendering support

  const t = await getTranslations({ locale, namespace: "AgentProfile" });

  // Fetch all active agents and offices in parallel.
  // Wrapped in try/catch so SSG build continues if DB is unavailable —
  // pages are generated on-demand via ISR fallback (same pattern as generateStaticParams).
  let allAgents: Awaited<ReturnType<typeof getAllAgents>> = [];
  let officeMap: Record<string, string> = {};
  try {
    const [agents, allOffices] = await Promise.all([getAllAgents(), getAllOffices()]);
    allAgents = agents;
    officeMap = Object.fromEntries(allOffices.map((o) => [o.id, o.name]));
  } catch {
    // DB unavailable at build time — render empty shell; ISR will populate on first request.
  }

  return (
    <SimplePageLayout pageTitle={t("indexPageTitle")} intro={t("indexPageDescription")}>
      <AgentIndexFilters agents={allAgents} locale={locale} officeMap={officeMap} />
    </SimplePageLayout>
  );
}
