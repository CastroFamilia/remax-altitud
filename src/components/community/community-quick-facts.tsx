import { getTranslations } from "next-intl/server";
import type { Community } from "@/lib/db/schema/communities";
import { Mountain, Plane, Wifi, Waves, Building2, Calendar } from "lucide-react";

interface CommunityQuickFactsProps {
  community: Community;
  locale: string;
}

interface QuickFact {
  key: string;
  icon: React.ReactNode;
  labelKey: string;
  value: string | string[] | undefined;
}

/**
 * Reads a locale-specific value from the quickFacts JSONB.
 *
 * Lookup order:
 *   1. `keyEn` / `keyEs`  (new i18n keys)
 *   2. `key`              (legacy unsuffixed fallback)
 */
function getLocalizedValue(
  qf: Record<string, unknown>,
  key: string,
  locale: string,
): string | string[] | undefined {
  const suffix = locale === "es" ? "Es" : "En";
  const localized = qf[`${key}${suffix}`];
  if (localized !== undefined && localized !== null && localized !== "") {
    return localized as string | string[];
  }
  // Fallback to unsuffixed legacy key
  const legacy = qf[key];
  if (legacy !== undefined && legacy !== null && legacy !== "") {
    return legacy as string | string[];
  }
  return undefined;
}

/**
 * CommunityQuickFacts — Server Component (AC #2)
 *
 * Icon grid displaying community facts: elevation, airport distance,
 * internet, amenities, developer, established year.
 * Renders only facts with data (handles missing fields gracefully).
 * Values are locale-aware: reads `keyEn`/`keyEs` suffixed JSONB keys first,
 * falling back to unsuffixed legacy keys.
 */
export async function CommunityQuickFacts({ community, locale }: CommunityQuickFactsProps) {
  const t = await getTranslations({ locale, namespace: "CommunityPage" });
  const quickFacts = (community.quickFacts ?? {}) as Record<string, unknown>;

  const iconProps = { className: "h-8 w-8 transition-colors duration-300", strokeWidth: 1.5 };

  const facts: QuickFact[] = [
    {
      key: "elevation",
      icon: <Mountain {...iconProps} />,
      labelKey: "quickFacts.elevation",
      value: getLocalizedValue(quickFacts, "elevation", locale),
    },
    {
      key: "airportDistance",
      icon: <Plane {...iconProps} />,
      labelKey: "quickFacts.airport",
      value: getLocalizedValue(quickFacts, "airportDistance", locale),
    },
    {
      key: "internet",
      icon: <Wifi {...iconProps} />,
      labelKey: "quickFacts.internet",
      value: getLocalizedValue(quickFacts, "internet", locale),
    },
    {
      key: "amenities",
      icon: <Waves {...iconProps} />,
      labelKey: "quickFacts.amenities",
      value: getLocalizedValue(quickFacts, "amenities", locale),
    },
    {
      key: "developer",
      icon: <Building2 {...iconProps} />,
      labelKey: "quickFacts.developer",
      value: getLocalizedValue(quickFacts, "developer", locale),
    },
    {
      key: "established",
      icon: <Calendar {...iconProps} />,
      labelKey: "quickFacts.established",
      value: getLocalizedValue(quickFacts, "established", locale),
    },
  ];

  const visibleFacts = facts.filter((f) => f.value);

  if (visibleFacts.length === 0) return null;

  return (
    <section
      data-testid="community-quick-facts"
      className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
    >
      <div className="mb-12 text-center">
        <h2 className="text-3xl font-light tracking-tight text-brand-navy sm:text-4xl">
          {t("quickFacts.heading")}
        </h2>
        <div className="mt-4 mx-auto h-1 w-24 bg-brand-gold rounded-full" />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visibleFacts.map((fact) => (
          <div
            key={fact.key}
            className="group relative overflow-hidden rounded-2xl border border-brand-navy/5 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-navy/5"
          >
            {/* Subtle background decoration on hover */}
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-brand-gold/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            <div className="relative flex flex-col items-center text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-navy/5 text-brand-navy transition-colors duration-300 group-hover:bg-brand-navy group-hover:text-brand-gold">
                {fact.icon}
              </div>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-brand-navy/60">
                {t(fact.labelKey)}
              </h3>
              <p className="text-base font-medium leading-relaxed text-brand-navy">
                {Array.isArray(fact.value) ? fact.value.join(", ") : fact.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
