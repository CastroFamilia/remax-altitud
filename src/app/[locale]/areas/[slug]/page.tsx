import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import {
  getAreaBySlug,
  getAllAreaSlugs,
  getPropertiesByAreaSlug,
  getSimilarAreas,
} from "@/lib/db/queries/areas";
import { getAllAgents } from "@/lib/db/queries/agents";
import { getCommunitiesByAreaId } from "@/lib/db/queries/communities";
import {
  generatePlaceJsonLd,
  generateBreadcrumbJsonLd,
  serializeJsonLd,
} from "@/lib/seo/structured-data";
import { buildAlternatesMetadata } from "@/lib/seo/metadata";
import { AreaGuideHero } from "@/components/area/area-guide-hero";
import { AreaGuideDescription } from "@/components/area/area-guide-description";
import { AreaGuideTabs } from "@/components/area/area-guide-tabs";
import { CommunityCard } from "@/components/area/community-card";
import { InvestmentContext } from "@/components/area/investment-context";
import { FeaturedAreas } from "@/components/home/featured-areas";

/**
 * Area Guide Page — SSG (no ISR)
 *
 * Architecture §L123: Area guides use pure SSG — no revalidation.
 * Content changes require rebuild.
 *
 * Stories: 6.1 (AC #1–#13)
 */

/**
 * SSG build-time generation — calls getAllAreaSlugs at build time.
 * Wrapped in try/catch so the build continues if the DB is unavailable
 * (pages generated on-demand via fallback).
 */
export async function generateStaticParams() {
  try {
    const slugs = await getAllAreaSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return []; // Build continues; pages generated on-demand
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const area = await getAreaBySlug(slug);
  if (!area) return {};

  const t = await getTranslations({ locale, namespace: "AreaGuide" });
  const areaName = locale === "es" ? area.nameEs : area.nameEn;
  const metadata = area.metadata as Record<string, string | undefined> | null;

  const seoTitleKey = locale === "es" ? "seoTitleEs" : "seoTitleEn";
  const seoDescKey = locale === "es" ? "seoDescriptionEs" : "seoDescriptionEn";

  const title = metadata?.[seoTitleKey] || t("meta.title", { area: areaName });
  const description = metadata?.[seoDescKey] || t("meta.description", { area: areaName });

  return {
    title,
    description,
    alternates: { ...buildAlternatesMetadata(`/areas/${slug}`) },
    openGraph: {
      title,
      description,
    },
  };
}

export default async function AreaGuidePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const area = await getAreaBySlug(slug);
  if (!area) notFound();

  const t = await getTranslations({ locale, namespace: "AreaGuide" });

  const [areaProperties, agents, similarAreas, communities] = await Promise.all([
    getPropertiesByAreaSlug(slug),
    getAllAgents(),
    getSimilarAreas(area.region, slug),
    getCommunitiesByAreaId(area.id),
  ]);

  const placeJsonLd = generatePlaceJsonLd(area, locale);
  const areaName = locale === "es" ? area.nameEs : area.nameEn;
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: locale === "es" ? "Inicio" : "Home", href: `/${locale}`, position: 1 },
    { name: t("index.title"), href: `/${locale}/areas`, position: 2 },
    { name: areaName, href: `/${locale}/areas/${slug}`, position: 3 },
  ]);

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(placeJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
      />
      <AreaGuideHero area={area} locale={locale} />
      <AreaGuideDescription area={area} locale={locale} />
      <InvestmentContext
        metadata={area.metadata as Record<string, unknown> | null}
        locale={locale}
      />

      {/* Communities belonging to this area */}
      {communities.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h2 className="mb-6 text-2xl font-bold text-brand-navy">{t("communities.heading")}</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {communities.map((community) => {
              const tagline = locale === "es" ? community.taglineEs : community.taglineEn;
              return (
                <CommunityCard
                  key={community.slug}
                  name={community.name}
                  tagline={tagline}
                  heroImageUrl={community.heroImageUrl}
                  href={`/${locale}/areas/${slug}/communities/${community.slug}`}
                  locale={locale}
                  priceMin={community.priceMinUsd}
                  priceMax={community.priceMaxUsd}
                  listingCount={community.listingCount}
                  latitude={community.latitude}
                  longitude={community.longitude}
                  geoFenceCoords={community.geoFenceCoords as [number, number][] | null}
                />
              );
            })}
          </div>
        </section>
      )}
      <AreaGuideTabs
        properties={areaProperties}
        agents={agents}
        similarAreas={similarAreas}
        locale={locale}
      />

      {/* Premium Featured Areas Section */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 border-t border-border mt-12">
        <FeaturedAreas locale={locale} />
      </section>
    </main>
  );
}
