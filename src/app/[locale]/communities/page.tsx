import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getAllCommunities } from "@/lib/db/queries/communities";
import { getAllAreas } from "@/lib/db/queries/areas";
import { generateBreadcrumbJsonLd, serializeJsonLd } from "@/lib/seo/structured-data";
import { buildAlternatesMetadata } from "@/lib/seo/metadata";
import { CommunityCard } from "@/components/area/community-card";

/**
 * Community Index Page — SSG + ISR
 *
 * Lists all communities with hero cards (AC #10).
 */

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "CommunityPage" });

  return {
    title: t("index.meta.title"),
    description: t("index.meta.description"),
    alternates: { ...buildAlternatesMetadata("/communities") },
    openGraph: {
      title: t("index.meta.title"),
      description: t("index.meta.description"),
      type: "website",
    },
  };
}

export default async function CommunitiesIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "CommunityPage" });

  let communities: Awaited<ReturnType<typeof getAllCommunities>> = [];
  let areaMap: Record<string, string> = {};
  try {
    const [communitiesData, areasData] = await Promise.all([getAllCommunities(), getAllAreas()]);
    communities = communitiesData;
    areaMap = Object.fromEntries(areasData.map((a) => [a.id, a.slug]));
  } catch {
    // DB unavailable — render empty grid (CI build with dummy DATABASE_URL)
  }

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    {
      name: locale === "es" ? "Inicio" : "Home",
      href: `/${locale}`,
      position: 1,
    },
    {
      name: t("index.title"),
      href: `/${locale}/communities`,
      position: 2,
    },
  ]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(breadcrumbJsonLd),
        }}
      />

      {/* Page header */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-extrabold text-brand-navy md:text-5xl">{t("index.title")}</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-text-muted">{t("index.description")}</p>
      </div>

      {/* Community cards grid */}
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {communities.map((community) => {
          const tagline = locale === "es" ? community.taglineEs : community.taglineEn;
          const areaSlug = areaMap[community.areaId] ?? "";

          return (
            <div key={community.slug} data-testid="community-index-card">
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
    </main>
  );
}
