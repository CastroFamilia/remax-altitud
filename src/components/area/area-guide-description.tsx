import { getTranslations } from "next-intl/server";
import type { Area } from "@/lib/db/schema/areas";

interface AreaGuideDescriptionProps {
  area: Area;
  locale: string;
}

/**
 * AreaGuideDescription — Server Component (AC #2)
 *
 * Renders the lifestyle narrative and nearest services.
 * CRITICAL: This MUST be a Server Component (no 'use client') to ensure
 * the description is in the initial SSG HTML output for full SEO indexing.
 * The description is always visible — not behind a tab (AC #2, Risk R-003).
 */
export async function AreaGuideDescription({ area, locale }: AreaGuideDescriptionProps) {
  const description = locale === "es" ? area.descriptionEs : area.descriptionEn;
  const metadata = area.metadata as Record<string, string> | null;
  const t = await getTranslations({ locale, namespace: "AreaGuide" });

  return (
    <section
      data-testid="area-guide-description"
      className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"
    >
      {/* Lifestyle narrative — always visible, not tabbed */}
      <div className="prose prose-lg max-w-none text-text-muted">
        <p className="whitespace-pre-line leading-relaxed">{description}</p>
      </div>

      {/* Nearest services grid */}
      {metadata && (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {metadata.nearestAirport && (
            <ServiceItem icon="✈️" label={t("nearestServices.airport")} value={metadata.nearestAirport} />
          )}
          {metadata.nearestHospital && (
            <ServiceItem icon="🏥" label={t("nearestServices.hospital")} value={metadata.nearestHospital} />
          )}
          {metadata.nearestBeach && (
            <ServiceItem icon="🏖️" label={t("nearestServices.beach")} value={metadata.nearestBeach} />
          )}
        </div>
      )}
    </section>
  );
}

function ServiceItem({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-background p-4">
      <span className="text-xl" aria-hidden="true">
        {icon}
      </span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">{label}</p>
        <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}
