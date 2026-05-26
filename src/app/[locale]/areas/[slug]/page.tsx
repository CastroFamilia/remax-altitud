import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { getAreaBySlug, getAllAreaSlugs, getPropertiesByAreaSlug, getSimilarAreas } from "@/lib/db/queries/areas";
import { getAllAgents } from "@/lib/db/queries/agents";
import { generatePlaceJsonLd, generateBreadcrumbJsonLd, serializeJsonLd } from "@/lib/seo/structured-data";
import { buildAlternatesMetadata } from "@/lib/seo/metadata";
import { AreaGuideHero } from "@/components/area/area-guide-hero";
import { AreaGuideDescription } from "@/components/area/area-guide-description";
import { AreaGuideTabs } from "@/components/area/area-guide-tabs";

/**
 * Area Guide Page — SSG (no ISR)
 *
 * Architecture §L123: Area guides use pure SSG — no revalidation.
 * Content changes require rebuild.
 *
 * Stories: 6.1 (AC #1–#13)
 */

export async function generateStaticParams() {
  const slugs = await getAllAreaSlugs();
  return slugs.map((slug) => ({ slug }));
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

  return {
    title: t("meta.title", { area: areaName }),
    description: t("meta.description", { area: areaName }),
    alternates: { ...buildAlternatesMetadata(`/areas/${slug}`) },
    openGraph: {
      title: t("meta.ogTitle", { area: areaName }),
      description: t("meta.ogDescription", { area: areaName }),
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

  const [areaProperties, agents, similarAreas] = await Promise.all([
    getPropertiesByAreaSlug(slug),
    getAllAgents(),
    getSimilarAreas(area.region, slug),
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
      {/* Communities — populated in Story 6.2 */}
      <AreaGuideTabs
        properties={areaProperties}
        agents={agents}
        similarAreas={similarAreas}
        locale={locale}
      />
    </main>
  );
}
