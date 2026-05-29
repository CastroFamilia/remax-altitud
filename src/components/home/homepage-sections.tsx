import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { getFeaturedProperties } from "@/lib/db/queries/properties";
import { PropertyCard } from "@/components/property/property-card";
import { detectDefaultUnitSystem } from "@/lib/utils/units";

type SectionNamespace =
  | "HomePage.featuredProperties"
  | "HomePage.featuredCommunities"
  | "HomePage.areaHighlights";

type SectionShellProps = {
  namespace: SectionNamespace;
  viewAllHref: string;
  variant?: "default" | "gold-border";
};

function SectionShell({ namespace, viewAllHref, variant = "default" }: SectionShellProps) {
  const t = useTranslations(namespace);
  const cards = [0, 1, 2];

  const cardClass = cn(
    "relative flex aspect-[4/3] w-[80%] shrink-0 snap-start items-center justify-center overflow-hidden rounded-lg bg-muted text-sm text-text-muted md:w-auto",
    variant === "gold-border" && "border-2 border-brand-gold",
  );

  return (
    <section aria-labelledby={`${namespace}-heading`} className="scroll-mt-16">
      <div className="mb-4 flex items-end justify-between gap-4 md:mb-6">
        <div>
          <h2 id={`${namespace}-heading`} className="text-brand-navy">
            {t("heading")}
          </h2>
          <p className="mt-1 text-sm text-text-secondary md:text-base">{t("description")}</p>
        </div>
        <Link
          href={viewAllHref}
          className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-brand-navy underline-offset-4 hover:underline md:inline-flex"
        >
          {t("viewAll")}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:pb-0">
        {cards.map((i) => (
          <div key={i} className={cardClass}>
            <span className="px-4 text-center text-text-muted">{t("shellNotice")}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 md:hidden">
        <Link
          href={viewAllHref}
          className="inline-flex items-center gap-1 text-sm font-semibold text-brand-navy underline-offset-4 hover:underline"
        >
          {t("viewAll")}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

export async function FeaturedPropertiesShell({ locale }: { locale: string }) {
  let properties: Awaited<ReturnType<typeof getFeaturedProperties>> = [];
  try {
    properties = await getFeaturedProperties(3);
  } catch (error) {
    console.warn("FeaturedPropertiesShell: Failed to fetch featured properties from DB:", error);
  }
  const t = await getTranslations({ locale, namespace: "HomePage.featuredProperties" });
  const unitSystem = detectDefaultUnitSystem(locale);

  if (properties.length === 0) {
    const cards = [0, 1, 2];
    const cardClass = "relative flex aspect-[4/3] w-[80%] shrink-0 snap-start items-center justify-center overflow-hidden rounded-lg bg-muted text-sm text-text-muted md:w-auto";

    return (
      <section aria-labelledby="HomePage.featuredProperties-heading" className="scroll-mt-16">
        <div className="mb-4 flex items-end justify-between gap-4 md:mb-6">
          <div>
            <h2 id="HomePage.featuredProperties-heading" className="text-brand-navy">
              {t("heading")}
            </h2>
            <p className="mt-1 text-sm text-text-secondary md:text-base">{t("description")}</p>
          </div>
          <Link
            href="/search"
            className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-brand-navy underline-offset-4 hover:underline md:inline-flex"
          >
            {t("viewAll")}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:pb-0">
          {cards.map((i) => (
            <div key={i} className={cardClass}>
              <span className="px-4 text-center text-text-muted">{t("shellNotice")}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 md:hidden">
          <Link
            href="/search"
            className="inline-flex items-center gap-1 text-sm font-semibold text-brand-navy underline-offset-4 hover:underline"
          >
            {t("viewAll")}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="HomePage.featuredProperties-heading" className="scroll-mt-16">
      <div className="mb-4 flex items-end justify-between gap-4 md:mb-6">
        <div>
          <h2 id="HomePage.featuredProperties-heading" className="text-brand-navy">
            {t("heading")}
          </h2>
          <p className="mt-1 text-sm text-text-secondary md:text-base">{t("description")}</p>
        </div>
        <Link
          href="/search"
          className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-brand-navy underline-offset-4 hover:underline md:inline-flex"
        >
          {t("viewAll")}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:pb-0">
        {properties.map((property) => (
          <div key={property.id} className="snap-start shrink-0 w-[80%] md:w-auto">
            <PropertyCard property={property} locale={locale} unitSystem={unitSystem} />
          </div>
        ))}
      </div>

      <div className="mt-4 md:hidden">
        <Link
          href="/search"
          className="inline-flex items-center gap-1 text-sm font-semibold text-brand-navy underline-offset-4 hover:underline"
        >
          {t("viewAll")}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

export function FeaturedCommunitiesShell() {
  return (
    <SectionShell
      namespace="HomePage.featuredCommunities"
      viewAllHref="/communities"
      variant="gold-border"
    />
  );
}

export function AreaHighlightsShell() {
  return <SectionShell namespace="HomePage.areaHighlights" viewAllHref="/areas" />;
}

export function SellCtaShell() {
  const t = useTranslations("HomePage.sellCta");
  return (
    <section
      aria-labelledby="sell-cta-heading"
      className="relative my-16 overflow-hidden rounded-xl bg-brand-navy px-6 py-12 text-white md:px-12 md:py-16"
    >
      <div className="absolute inset-0 -z-0 glass-strong" aria-hidden="true" />
      <div className="relative z-[1] mx-auto max-w-3xl text-center">
        <h2 id="sell-cta-heading" className="!text-white">
          {t("heading")}
        </h2>
        <p className="mt-3 text-[length:var(--text-body-lg)] leading-[var(--text-body-lg-lh)] text-white/90">
          {t("description")}
        </p>
        <Link
          href="/sell"
          className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-brand-gold px-6 font-semibold text-brand-navy shadow-[var(--shadow-cta)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-smooth)] hover:bg-brand-gold-dark"
        >
          {t("cta")}
        </Link>
      </div>
    </section>
  );
}
