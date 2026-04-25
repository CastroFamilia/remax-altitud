import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SimplePageLayout } from "@/components/layout/simple-page-layout";
import { OfficeCard } from "@/components/layout/office-card";
import { offices } from "@/lib/constants/offices";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "AboutPage" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      languages: {
        en: "/en/about",
        es: "/es/about",
      },
    },
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      type: "website",
    },
  };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AboutPageContent />;
}

function AboutPageContent() {
  const t = useTranslations("AboutPage");
  return (
    <SimplePageLayout pageTitle={t("pageTitle")} intro={t("intro")}>
      <section aria-labelledby="offices-heading" className="mx-auto max-w-5xl">
        <h2 id="offices-heading" className="text-2xl font-bold text-brand-navy md:text-3xl">
          {t("officesHeading")}
        </h2>
        <p className="mt-2 text-text-muted">{t("officesIntro")}</p>
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          {offices.map((office) => (
            <OfficeCard key={office.name} office={office} />
          ))}
        </div>
      </section>

      <section aria-labelledby="mission-heading" className="mx-auto mt-16 max-w-3xl text-center">
        <h2 id="mission-heading" className="text-2xl font-bold text-brand-navy md:text-3xl">
          {t("mission.heading")}
        </h2>
        <p className="mt-4 text-text-muted">{t("mission.body")}</p>
      </section>

      <section
        aria-labelledby="about-cta-heading"
        className="mx-auto mt-16 max-w-3xl rounded-xl bg-brand-navy p-8 text-center text-white md:p-12"
      >
        <h2 id="about-cta-heading" className="text-2xl font-bold text-white md:text-3xl">
          {t("cta.heading")}
        </h2>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 md:flex-row">
          <Link
            href="/search"
            className="inline-flex h-11 items-center rounded-md bg-brand-gold px-6 font-semibold text-brand-navy shadow-[var(--shadow-cta)] transition-colors duration-[var(--duration-fast)] hover:bg-brand-gold/90"
          >
            {t("cta.primary")}
          </Link>
          <Link
            href="/sell"
            className="inline-flex h-11 items-center rounded-md border border-white/40 px-6 font-semibold text-white transition-colors duration-[var(--duration-fast)] hover:bg-white/10"
          >
            {t("cta.secondary")}
          </Link>
        </div>
      </section>
    </SimplePageLayout>
  );
}
