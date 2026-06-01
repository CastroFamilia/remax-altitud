import { getTranslations } from "next-intl/server";
import { getFeaturedCommunities } from "@/lib/db/queries/communities";
import { getAllAreas } from "@/lib/db/queries/areas";
import { FeaturedCommunitiesCarousel } from "./featured-communities-carousel";

interface FeaturedCommunitiesProps {
  locale: string;
}

/**
 * FeaturedCommunities — Server Component (AC #8)
 *
 * Replaces FeaturedCommunitiesShell with real data from communities table.
 * Shows curated communities in a premium responsive swiper carousel.
 */
export async function FeaturedCommunities({ locale }: FeaturedCommunitiesProps) {
  const t = await getTranslations({ locale, namespace: "HomePage.featuredCommunities" });

  let communities: Awaited<ReturnType<typeof getFeaturedCommunities>> = [];
  interface AreaInfo {
    slug: string;
    nameEn: string;
    nameEs: string;
  }
  let areaInfoMap: Record<string, AreaInfo> = {};
  try {
    const [communitiesData, areasData] = await Promise.all([
      getFeaturedCommunities(6),
      getAllAreas(),
    ]);
    communities = communitiesData;
    areaInfoMap = Object.fromEntries(
      areasData.map((a) => [a.id, { slug: a.slug, nameEn: a.nameEn, nameEs: a.nameEs }]),
    );
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
          <p className="mt-1 text-sm text-text-secondary md:text-base">{t("description")}</p>
        </div>
        <p className="py-12 text-center text-text-muted">{t("shellNotice")}</p>
      </section>
    );
  }

  return (
    <section
      data-testid="featured-communities"
      aria-labelledby="featured-communities-heading"
      className="scroll-mt-16"
    >
      <div className="mb-6 flex items-end justify-between gap-4 md:mb-8">
        <div>
          <h2
            id="featured-communities-heading"
            className="text-3xl font-extrabold text-brand-navy tracking-tight sm:text-4xl"
          >
            {t("heading")}
          </h2>
          <p className="mt-2 text-base text-text-muted max-w-2xl font-medium">{t("description")}</p>
        </div>
        <a
          href={`/${locale}/communities`}
          className="hidden shrink-0 items-center gap-1.5 text-sm font-bold text-brand-navy underline underline-offset-4 hover:text-brand-navy/80 transition-colors md:inline-flex"
        >
          {t("viewAll")} →
        </a>
      </div>

      <FeaturedCommunitiesCarousel
        communities={communities}
        areaInfoMap={areaInfoMap}
        locale={locale}
      />
    </section>
  );
}
