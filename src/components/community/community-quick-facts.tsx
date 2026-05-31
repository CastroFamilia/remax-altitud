import { getTranslations } from "next-intl/server";
import type { Community } from "@/lib/db/schema/communities";

interface CommunityQuickFactsProps {
  community: Community;
  locale: string;
}

interface QuickFact {
  key: string;
  icon: string;
  labelKey: string;
  value: string | undefined;
}

/**
 * CommunityQuickFacts — Server Component (AC #2)
 *
 * Icon grid displaying community facts: elevation, airport distance,
 * internet, amenities, developer, established year.
 * Renders only facts with data (handles missing fields gracefully).
 */
export async function CommunityQuickFacts({ community, locale }: CommunityQuickFactsProps) {
  const t = await getTranslations({ locale, namespace: "CommunityPage" });
  const quickFacts = community.quickFacts as Record<string, string | undefined>;

  const facts: QuickFact[] = [
    { key: "elevation", icon: "📍", labelKey: "quickFacts.elevation", value: quickFacts.elevation },
    {
      key: "airportDistance",
      icon: "✈",
      labelKey: "quickFacts.airport",
      value: quickFacts.airportDistance,
    },
    { key: "internet", icon: "🌐", labelKey: "quickFacts.internet", value: quickFacts.internet },
    { key: "amenities", icon: "🏊", labelKey: "quickFacts.amenities", value: quickFacts.amenities },
    { key: "developer", icon: "🏗", labelKey: "quickFacts.developer", value: quickFacts.developer },
    {
      key: "established",
      icon: "📅",
      labelKey: "quickFacts.established",
      value: quickFacts.established,
    },
  ];

  const visibleFacts = facts.filter((f) => f.value);

  if (visibleFacts.length === 0) return null;

  return (
    <section
      data-testid="community-quick-facts"
      className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
    >
      <h2 className="mb-6 text-2xl font-bold text-brand-navy">{t("quickFacts.heading")}</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {visibleFacts.map((fact) => (
          <div
            key={fact.key}
            className="flex flex-col items-center rounded-lg border border-gray-200 bg-white p-4 text-center shadow-sm"
          >
            <span className="text-2xl" aria-hidden="true">
              {fact.icon}
            </span>
            <span className="mt-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
              {t(fact.labelKey)}
            </span>
            <span className="mt-1 text-sm font-medium text-brand-navy">
              {Array.isArray(fact.value) ? fact.value.join(", ") : fact.value}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
