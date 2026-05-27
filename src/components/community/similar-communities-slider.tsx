"use client";

import { useTranslations } from "next-intl";
import type { Community } from "@/lib/db/schema/communities";
import { CommunityCard } from "@/components/area/community-card";

interface SimilarCommunitiesSliderProps {
  communities: Community[];
  locale: string;
  areaSlug: string;
}

/**
 * SimilarCommunitiesSlider — Client Component (AC #6)
 *
 * Horizontal slider showing nearby community cards.
 * Always visible below tabs, not tabbed.
 * Uses CommunityCard from src/components/area/community-card.tsx.
 */
export function SimilarCommunitiesSlider({
  communities,
  locale,
  areaSlug,
}: SimilarCommunitiesSliderProps) {
  const t = useTranslations("CommunityPage");

  if (communities.length === 0) return null;

  return (
    <section
      data-testid="community-similar-slider"
      className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"
    >
      <h2 className="mb-6 text-2xl font-bold text-brand-navy">{t("similarCommunities.heading")}</h2>
      <div
        className="flex gap-6 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300"
        role="region"
        aria-label={t("similarCommunities.heading")}
      >
        {communities.map((community) => {
          const tagline = locale === "es" ? community.taglineEs : community.taglineEn;

          return (
            <div key={community.slug} className="w-72 flex-shrink-0">
              <CommunityCard
                name={community.name}
                tagline={tagline}
                heroImageUrl={community.heroImageUrl}
                href={`/${locale}/areas/${areaSlug}/communities/${community.slug}`}
                locale={locale}
                priceMin={community.priceMinUsd}
                priceMax={community.priceMaxUsd}
                listingCount={community.listingCount}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
