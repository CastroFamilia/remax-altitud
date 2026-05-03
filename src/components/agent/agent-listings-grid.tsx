/**
 * AgentListingsGrid — Story 4.3 (AC #2, FR39)
 *
 * Server Component: renders the property grid on the agent profile page.
 * Reuses PropertyCard from Story 3.5 — no new card component needed.
 */

import { getTranslations } from "next-intl/server";
import { PropertyCard } from "@/components/property/property-card";
import type { PropertySearchItem } from "@/types/search";

interface AgentListingsGridProps {
  properties: PropertySearchItem[];
  locale: string;
  agentName: string;
}

export async function AgentListingsGrid({ properties, locale, agentName }: AgentListingsGridProps) {
  const t = await getTranslations("AgentProfile");

  return (
    <section className="mx-auto max-w-7xl py-8">
      <h2
        className="mb-6 text-xl font-bold text-brand-navy md:text-2xl"
        data-testid="agent-listings-heading"
      >
        {t("listingsHeading", { name: agentName })}
      </h2>

      {properties.length === 0 ? (
        <p data-testid="agent-no-listings" className="text-base text-text-muted">
          {t("noListings", { name: agentName })}
        </p>
      ) : (
        <ul
          data-testid="agent-listings-grid"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {properties.map((property) => (
            <li key={property.id}>
              <PropertyCard property={property} locale={locale} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default AgentListingsGrid;
