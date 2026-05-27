import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { SplitHero } from "@/components/home/split-hero";
import {
  AreaHighlightsShell,
  FeaturedPropertiesShell,
  SellCtaShell,
} from "@/components/home/homepage-sections";
import { FeaturedCommunities } from "@/components/home/featured-communities";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <HomeContent locale={locale} />;
}

function HomeContent({ locale }: { locale: string }) {
  const t = useTranslations("HomePage");

  return (
    <>
      <h1 className="sr-only">{t("title")}</h1>
      <SplitHero />
      <div className="container space-y-16 py-16">
        <FeaturedPropertiesShell />
        {/* @ts-expect-error Async Server Component */}
        <FeaturedCommunities locale={locale} />
        <AreaHighlightsShell />
      </div>
      <div className="container pb-16">
        <SellCtaShell />
      </div>
    </>
  );
}
