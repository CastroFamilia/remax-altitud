import { getTranslations } from "next-intl/server";
import { getFeaturedCommunities } from "@/lib/db/queries/communities";
import { getAllAreas } from "@/lib/db/queries/areas";
import { CommunityCard } from "@/components/area/community-card";

interface FeaturedCommunitiesProps {
  locale: string;
}

/**
 * FeaturedCommunities — Server Component (AC #8)
 *
 * Replaces FeaturedCommunitiesShell with real data from communities table.
 * Shows 2-3 community hero-scale cards with gold borders.
 */
export async function FeaturedCommunities({ locale }: FeaturedCommunitiesProps) {
  const t = await getTranslations({ locale, namespace: "HomePage.featuredCommunities" });

  let communities: Awaited<ReturnType<typeof getFeaturedCommunities>> = [];
  let areaMap: Record<string, string> = {};
  try {
    const [communitiesData, areasData] = await Promise.all([
      getFeaturedCommunities(3),
      getAllAreas(),
    ]);
    communities = communitiesData;
    areaMap = Object.fromEntries(areasData.map((a) => [a.id, a.slug]));
  } catch {
    // DB unavailable — render shell fallback
  }

  if (communities.length === 0) {
    return (
      <section
        data-testid="featured-communities"
        aria-labelledby="featured-communities-heading"
        className="scroll-mt-16"
      >
        <div className="mb-4 md:mb-6">
          <h2 id="featured-communities-heading" className="text-brand-navy">
            {t("heading")}
          </h2>
          <p className="mt-1 text-sm text-text-secondary md:text-base">
            {t("description")}
          </p>
        </div>
        <p className="py-12 text-center text-text-muted">
          {t("shellNotice")}
        </p>
      </section>
    );
  }

  return (
    <section
      data-testid="featured-communities"
      aria-labelledby="featured-communities-heading"
      className="scroll-mt-16"
    >
      <div className="mb-4 flex items-end justify-between gap-4 md:mb-6">
        <div>
          <h2 id="featured-communities-heading" className="text-brand-navy">
            {t("heading")}
          </h2>
          <p className="mt-1 text-sm text-text-secondary md:text-base">
            {t("description")}
          </p>
        </div>
        <a
          href={`/${locale}/communities`}
          className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-brand-navy underline-offset-4 hover:underline md:inline-flex"
        >
          {t("viewAll")} →
        </a>
      </div>

      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:pb-0">
        {communities.map((community) => {
          const tagline =
            locale === "es" ? community.taglineEs : community.taglineEn;
          const areaSlug = areaMap[community.areaId] ?? "";

          return (
            <div key={community.slug} className="w-[80%] shrink-0 snap-start md:w-auto">
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

      <div className="mt-4 md:hidden">
        <a
          href={`/${locale}/communities`}
          className="inline-flex items-center gap-1 text-sm font-semibold text-brand-navy underline-offset-4 hover:underline"
        >
          {t("viewAll")} →
        </a>
      </div>
    </section>
  );
}
