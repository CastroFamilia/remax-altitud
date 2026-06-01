import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import {
  getCommunityBySlugAndArea,
  getAllCommunityParams,
  getPropertiesByCommunityId,
  getSimilarCommunities,
} from "@/lib/db/queries/communities";
import { getAreaBySlug } from "@/lib/db/queries/areas";
import {
  generateCommunityJsonLd,
  generateBreadcrumbJsonLd,
  serializeJsonLd,
} from "@/lib/seo/structured-data";
import { buildAlternatesMetadata } from "@/lib/seo/metadata";
import { CommunityHero } from "@/components/community/community-hero";
import { CommunityQuickFacts } from "@/components/community/community-quick-facts";
import { CommunityDescription } from "@/components/community/community-description";
import { CommunityTabs } from "@/components/community/community-tabs";
import { SimilarCommunitiesSlider } from "@/components/community/similar-communities-slider";
import { CommunityMiniMap } from "@/components/community/community-mini-map";
import { InvestmentContext } from "@/components/area/investment-context";

/**
 * Community Page — SSG + ISR (revalidate = 3600)
 *
 * Architecture §L124: Community pages use SSG + ISR — property availability changes daily.
 * On-demand revalidation via revalidateTag('communities') from sync pipeline.
 *
 * Story 6.2 (AC #1–#16)
 */

export const revalidate = 3600;

/**
 * SSG build-time generation — calls getAllCommunityParams at build time.
 * Wrapped in try/catch so the build continues if the DB is unavailable.
 */
export async function generateStaticParams() {
  try {
    return await getAllCommunityParams();
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string; community: string }>;
}): Promise<Metadata> {
  const { locale, slug, community: communitySlug } = await params;
  const community = await getCommunityBySlugAndArea(communitySlug, slug);
  if (!community) return {};

  const t = await getTranslations({ locale, namespace: "CommunityPage" });

  return {
    title: t("meta.title", { community: community.name }),
    description: t("meta.description", { community: community.name }),
    alternates: {
      ...buildAlternatesMetadata(`/areas/${slug}/communities/${communitySlug}`),
    },
    openGraph: {
      title: t("meta.ogTitle", { community: community.name }),
      description: t("meta.ogDescription", { community: community.name }),
    },
  };
}

export default async function CommunityPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string; community: string }>;
}) {
  const { locale, slug, community: communitySlug } = await params;
  setRequestLocale(locale);

  const [area, community] = await Promise.all([
    getAreaBySlug(slug),
    getCommunityBySlugAndArea(communitySlug, slug),
  ]);
  if (!area || !community) notFound();

  const t = await getTranslations({ locale, namespace: "CommunityPage" });

  const [communityProperties, similarCommunities] = await Promise.all([
    getPropertiesByCommunityId(community.id),
    getSimilarCommunities(community.areaId, communitySlug),
  ]);

  const areaName = locale === "es" ? area.nameEs : area.nameEn;
  const communityJsonLd = generateCommunityJsonLd(community, area, locale);
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    {
      name: locale === "es" ? "Inicio" : "Home",
      href: `/${locale}`,
      position: 1,
    },
    {
      name: locale === "es" ? "Zonas" : "Areas",
      href: `/${locale}/areas`,
      position: 2,
    },
    { name: areaName, href: `/${locale}/areas/${slug}`, position: 3 },
    {
      name: community.name,
      href: `/${locale}/areas/${slug}/communities/${communitySlug}`,
      position: 4,
    },
  ]);

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(communityJsonLd),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(breadcrumbJsonLd),
        }}
      />
      <CommunityHero community={community} areaName={areaName} locale={locale} />
      <CommunityQuickFacts community={community} locale={locale} />
      <CommunityDescription community={community} locale={locale} />
      <CommunityMiniMap community={community} areaName={areaName} locale={locale} />
      <InvestmentContext
        metadata={area.metadata as Record<string, unknown> | null}
        locale={locale}
      />
      <CommunityTabs properties={communityProperties} community={community} locale={locale} />
      <SimilarCommunitiesSlider
        communities={similarCommunities}
        locale={locale}
        areaSlug={slug}
        areaName={areaName}
      />
    </main>
  );
}
