/**
 * SimilarPropertiesLoader — Server Component
 *
 * Suspense boundary wrapper for the SimilarProperties carousel.
 * Defers the DB query to prevent blocking LCP on the listing detail page.
 *
 * Pattern: async Server Component (SimilarPropertiesData) wrapped in <Suspense>
 * so the page shell streams immediately while the below-fold data is fetched.
 *
 * Story 4.5, Task 3 | AC #8
 */

import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { SimilarProperties } from "./similar-properties";
import { SimilarPropertiesSkeleton } from "./similar-properties-skeleton";
import { getSimilarPropertiesRanked } from "@/lib/db/queries/properties";

interface SimilarPropertiesLoaderProps {
  currentSlug: string;
  areaSlug: string | null;
  priceUsd: number;
  propertyType: string;
  locale: string;
}

async function SimilarPropertiesData({
  currentSlug,
  areaSlug,
  priceUsd,
  propertyType,
  locale,
}: SimilarPropertiesLoaderProps) {
  const properties = await getSimilarPropertiesRanked({
    excludeSlug: currentSlug,
    areaSlug,
    priceUsd,
    propertyType,
    limit: 4,
  });
  return (
    <SimilarProperties properties={properties} locale={locale} currentPropertySlug={currentSlug} />
  );
}

export async function SimilarPropertiesLoader(props: SimilarPropertiesLoaderProps) {
  const t = await getTranslations({ locale: props.locale, namespace: "SimilarProperties" });
  return (
    <Suspense fallback={<SimilarPropertiesSkeleton ariaLabel={t("loadingAriaLabel")} />}>
      <SimilarPropertiesData {...props} />
    </Suspense>
  );
}
