import React from "react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db/client";
import { communities } from "@/lib/db/schema/communities";
import { areas } from "@/lib/db/schema/areas";
import { eq } from "drizzle-orm";
import { CommunityCard } from "@/components/area/community-card";
import { buildAlternatesMetadata } from "@/lib/seo/metadata";
import { generateBreadcrumbJsonLd, serializeJsonLd } from "@/lib/seo/structured-data";
import { sortCommunitiesCustom } from "@/lib/db/queries/communities";

/** Opt out of static caching so DB-driven communities list always renders with fresh data. */
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateStaticParams() {
  return [{ locale: "en" }, { locale: "es" }];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "CommunityPage" });

  return {
    title: t("index.meta.title"),
    description: t("index.meta.description"),
    alternates: { ...buildAlternatesMetadata("/communities") },
    openGraph: {
      title: t("index.meta.title"),
      description: t("index.meta.description"),
    },
  };
}

export default async function CommunitiesIndexPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "CommunityPage" });

  // Fetch all communities joined with area to build accurate href
  interface DBCommunityRow {
    id: string;
    slug: string;
    name: string;
    taglineEn: string | null;
    taglineEs: string | null;
    heroImageUrl: string | null;
    priceMinUsd: number | null;
    priceMaxUsd: number | null;
    listingCount: number;
    latitude: number | null;
    longitude: number | null;
    geoFenceCoords: unknown;
    areaSlug: string;
    areaNameEn: string;
    areaNameEs: string;
    propertyTypesEn: string | null;
    propertyTypesEs: string | null;
    sizeMinM2: number | null;
    sizeMaxM2: number | null;
    quickFacts: unknown;
  }
  let dbCommunities: DBCommunityRow[] = [];
  try {
    const rawCommunities = await db
      .select({
        id: communities.id,
        slug: communities.slug,
        name: communities.name,
        taglineEn: communities.taglineEn,
        taglineEs: communities.taglineEs,
        heroImageUrl: communities.heroImageUrl,
        priceMinUsd: communities.priceMinUsd,
        priceMaxUsd: communities.priceMaxUsd,
        listingCount: communities.listingCount,
        latitude: communities.latitude,
        longitude: communities.longitude,
        geoFenceCoords: communities.geoFenceCoords,
        areaSlug: areas.slug,
        areaNameEn: areas.nameEn,
        areaNameEs: areas.nameEs,
        propertyTypesEn: communities.propertyTypesEn,
        propertyTypesEs: communities.propertyTypesEs,
        sizeMinM2: communities.sizeMinM2,
        sizeMaxM2: communities.sizeMaxM2,
        quickFacts: communities.quickFacts,
      })
      .from(communities)
      .innerJoin(areas, eq(communities.areaId, areas.id));

    // Sort communities based on custom order requested by user: RISE, Santa Elena Hills, Harmony Heights, SERENA, Residencial La Piedra, Villas San Miguel
    dbCommunities = sortCommunitiesCustom(rawCommunities) as unknown as DBCommunityRow[];
  } catch (error) {
    console.error("Failed to fetch communities from DB:", error);
  }

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: locale === "es" ? "Inicio" : "Home", href: `/${locale}`, position: 1 },
    { name: t("index.title"), href: `/${locale}/communities`, position: 2 },
  ]);

  return (
    <main className="min-h-screen bg-[var(--color-bg-white,#fff)] pt-24 pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-brand-navy tracking-tight">
            {t("index.title")}
          </h1>
          <p className="text-lg text-text-muted leading-relaxed font-medium">
            {t("index.description")}
          </p>
        </div>

        {/* Communities Grid */}
        {dbCommunities.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-2xl border border-slate-100 max-w-xl mx-auto">
            <p className="text-text-muted font-bold text-lg">No communities found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {dbCommunities.map((comm) => {
              const tagline = (locale === "es" ? comm.taglineEs : comm.taglineEn) || undefined;
              const href = `/${locale}/areas/${comm.areaSlug}/communities/${comm.slug}`;

              // Resolve location based on locale
              const location = locale === "es" ? comm.areaNameEs : comm.areaNameEn;

              // Parse fallbacks from quickFacts if table columns are empty
              const qf = (comm.quickFacts || {}) as Record<string, unknown>;

              const propertyTypes = (
                locale === "es"
                  ? comm.propertyTypesEs || qf.propertyTypesEs || qf.propertyTypes || ""
                  : comm.propertyTypesEn || qf.propertyTypesEn || qf.propertyTypes || ""
              ) as string;

              const sizeMin =
                comm.sizeMinM2 ?? (typeof qf.sizeMinM2 === "number" ? qf.sizeMinM2 : null);
              const sizeMax =
                comm.sizeMaxM2 ?? (typeof qf.sizeMaxM2 === "number" ? qf.sizeMaxM2 : null);

              const priceRangeOverride = (
                locale === "es"
                  ? qf.priceRangeEs || qf.priceRange
                  : qf.priceRangeEn || qf.priceRange
              ) as string | null;

              const sizeRangeOverride = (
                locale === "es" ? qf.sizeRangeEs || qf.sizeRange : qf.sizeRangeEn || qf.sizeRange
              ) as string | null;

              return (
                <div key={comm.id} data-testid="community-index-card">
                  <CommunityCard
                    name={comm.name}
                    tagline={tagline}
                    heroImageUrl={comm.heroImageUrl}
                    href={href}
                    locale={locale}
                    priceMin={comm.priceMinUsd}
                    priceMax={comm.priceMaxUsd}
                    listingCount={comm.listingCount}
                    latitude={comm.latitude}
                    longitude={comm.longitude}
                    geoFenceCoords={comm.geoFenceCoords as unknown as [number, number][] | null}
                    location={location}
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
        )}
      </div>
    </main>
  );
}
