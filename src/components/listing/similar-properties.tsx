/**
 * SimilarProperties — Server Component
 *
 * Horizontal carousel of PropertyCards showing similar listings.
 * Uses CSS snap scroll for horizontal scrolling — zero client JS bundle cost.
 *
 * Story 4.5, Task 2 | AC #1, #5, #6, #7
 */

import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PropertyCard } from "@/components/property/property-card";
import type { PropertySearchItem } from "@/types/search";

interface SimilarPropertiesProps {
  properties: PropertySearchItem[];
  locale: string;
  currentPropertySlug: string; // for deduplication safety
}

export async function SimilarProperties({
  properties,
  locale,
  currentPropertySlug,
}: SimilarPropertiesProps): Promise<React.ReactElement> {
  const t = await getTranslations({ locale, namespace: "SimilarProperties" });

  // Deduplicate: exclude current property from display (safety guard)
  const filteredProperties = properties.filter((p) => p.slug !== currentPropertySlug);

  // Empty state (AC: #7)
  if (filteredProperties.length === 0) {
    return (
      <section aria-labelledby="similar-heading" data-testid="similar-properties-empty">
        <h2 id="similar-heading" className="mb-4 text-xl font-bold text-brand-navy md:text-2xl">
          {t("heading")}
        </h2>
        <Link
          href="/search"
          data-testid="similar-browse-cta"
          className="inline-flex items-center rounded-lg border border-brand-navy px-4 py-2 text-sm font-medium text-brand-navy hover:bg-brand-navy hover:text-white transition-colors"
        >
          {t("browseCta")}
        </Link>
      </section>
    );
  }

  // Carousel layout — CSS snap (no JS carousel library) (AC: #5)
  return (
    <section aria-labelledby="similar-heading" data-testid="similar-properties-carousel">
      <h2 id="similar-heading" className="mb-4 text-xl font-bold text-brand-navy md:text-2xl">
        {t("heading")}
      </h2>
      <div
        role="list"
        className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth [-webkit-overflow-scrolling:touch]"
        style={{ scrollbarWidth: "none" }}
        aria-label={t("carouselAriaLabel")}
      >
        {filteredProperties.map((property) => (
          <div key={property.slug} role="listitem" className="snap-start shrink-0 w-72 md:w-80">
            <PropertyCard property={property} locale={locale} variant="compact" />
          </div>
        ))}
      </div>
      {/* Keyboard navigation hint — screen-reader-only */}
      <p className="sr-only">{t("keyboardHint")}</p>
    </section>
  );
}
