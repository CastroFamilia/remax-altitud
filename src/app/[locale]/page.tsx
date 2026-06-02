import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { SplitHero } from "@/components/home/split-hero";
import { FeaturedPropertiesShell, SellCtaShell } from "@/components/home/homepage-sections";
import { FeaturedCommunities } from "@/components/home/featured-communities";
import { FeaturedAreas } from "@/components/home/featured-areas";
import { VipSearchBanner } from "@/components/home/vip-search-banner";
import { LifestyleQuestionnaire } from "@/components/home/lifestyle-questionnaire";
import {
  getQuestionnaireRecommendationProperties,
  type QuestionnaireProperties,
} from "@/lib/db/queries/questionnaire";

/** Opt out of static caching so DB-driven sections (featured properties,
 *  communities, areas) always render with fresh data. */
export const dynamic = "force-dynamic";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Fetch listing recommendations for the lifestyle questionnaire
  const questionnaireProperties = await getQuestionnaireRecommendationProperties();

  return <HomeContent locale={locale} questionnaireProperties={questionnaireProperties} />;
}

function HomeContent({
  locale,
  questionnaireProperties,
}: {
  locale: string;
  questionnaireProperties: QuestionnaireProperties;
}) {
  const t = useTranslations("HomePage");

  return (
    <>
      <h1 className="sr-only">{t("title")}</h1>
      <SplitHero />
      <div className="container space-y-16 py-16">
        <LifestyleQuestionnaire initialProperties={questionnaireProperties} locale={locale} />
        <VipSearchBanner />
        <FeaturedPropertiesShell locale={locale} />
        <LifestyleQuestionnaire initialProperties={questionnaireProperties} locale={locale} />
        <FeaturedCommunities locale={locale} />
        <FeaturedAreas locale={locale} />
      </div>
      <div className="container pb-16">
        <SellCtaShell />
      </div>
    </>
  );
}
