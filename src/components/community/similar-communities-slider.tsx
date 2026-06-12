"use client";

import { useTranslations } from "next-intl";
import type { Community } from "@/lib/db/schema/communities";
import { CommunityCard } from "@/components/area/community-card";
import { sortCommunitiesCustom } from "@/lib/community/sort";

interface SimilarCommunitiesSliderProps {
  communities: Community[];
  locale: string;
  areaSlug: string;
  areaName?: string;
  /** True when displaying communities from other areas as a fallback. */
  isFallback?: boolean;
  /** Map from community slug → area info, used only in fallback mode. */
  fallbackAreaMap?: Record<
    string,
    { areaSlug: string; areaNameEn: string; areaNameEs: string }
  > | null;
}

/**
 * SimilarCommunitiesSlider — Client Component (AC #6)
 *
 * Horizontal slider showing nearby community cards.
 * Always visible below tabs, not tabbed.
 * Uses CommunityCard from src/components/area/community-card.tsx.
 *
 * When this community is the only one in its area, falls back to
 * communities from other areas with a contextual subtitle.
 */
export function SimilarCommunitiesSlider({
  communities,
  locale,
  areaSlug,
  areaName,
  isFallback = false,
  fallbackAreaMap,
}: SimilarCommunitiesSliderProps) {
  const t = useTranslations("CommunityPage");

  if (communities.length === 0) return null;

  const heading = isFallback ? t("exploreCommunities.heading") : t("similarCommunities.heading");

  return (
    <section
      data-testid="community-similar-slider"
      className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"
    >
      <h2 className="mb-2 text-2xl font-bold text-brand-navy">{heading}</h2>
      {isFallback && (
        <p className="mb-6 text-sm text-gray-500">{t("exploreCommunities.subtitle")}</p>
      )}
      {!isFallback && <div className="mb-4" />}
      <div
        className="flex gap-6 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300"
        role="region"
        aria-label={heading}
      >
        {sortCommunitiesCustom(communities).map((community) => {
          // Resolve area info: use fallback map when in fallback mode
          const areaInfo = isFallback && fallbackAreaMap?.[community.slug];
          const cardAreaSlug = areaInfo ? areaInfo.areaSlug : areaSlug;
          const cardAreaName = areaInfo
            ? locale === "es"
              ? areaInfo.areaNameEs
              : areaInfo.areaNameEn
            : areaName;

          const tagline = locale === "es" ? community.taglineEs : community.taglineEn;
          const qf = (community.quickFacts || {}) as Record<string, unknown>;

          const propertyTypes = (
            locale === "es"
              ? community.propertyTypesEs || qf.propertyTypesEs || qf.propertyTypes || ""
              : community.propertyTypesEn || qf.propertyTypesEn || qf.propertyTypes || ""
          ) as string;

          const sizeMin =
            community.sizeMinM2 ?? (typeof qf.sizeMinM2 === "number" ? qf.sizeMinM2 : null);
          const sizeMax =
            community.sizeMaxM2 ?? (typeof qf.sizeMaxM2 === "number" ? qf.sizeMaxM2 : null);

          const priceRangeOverride = (
            locale === "es" ? qf.priceRangeEs || qf.priceRange : qf.priceRangeEn || qf.priceRange
          ) as string | null;

          const sizeRangeOverride = (
            locale === "es" ? qf.sizeRangeEs || qf.sizeRange : qf.sizeRangeEn || qf.sizeRange
          ) as string | null;

          return (
            <div key={community.slug} className="w-72 flex-shrink-0">
              <CommunityCard
                name={community.name}
                tagline={tagline}
                heroImageUrl={community.heroImageUrl}
                href={`/${locale}/areas/${cardAreaSlug}/communities/${community.slug}`}
                locale={locale}
                priceMin={community.priceMinUsd}
                priceMax={community.priceMaxUsd}
                listingCount={community.listingCount}
                location={cardAreaName}
                propertyTypes={propertyTypes}
                sizeMin={sizeMin}
                sizeMax={sizeMax}
                priceRangeOverride={priceRangeOverride}
                sizeRangeOverride={sizeRangeOverride}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
