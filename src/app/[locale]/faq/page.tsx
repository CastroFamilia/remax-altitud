import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SimplePageLayout } from "@/components/layout/simple-page-layout";
import { SimpleAccordion } from "@/components/ui/accordion";
import Script from "next/script";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "FAQ" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      languages: {
        en: "/en/faq",
        es: "/es/faq",
      },
    },
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      type: "website",
    },
  };
}

export default async function FAQPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <FAQPageContent />;
}

function FAQPageContent() {
  const t = useTranslations("FAQ");
  const common = useTranslations("HomePage");

  const faqItems = [
    { value: "q1", title: t("q1_question"), content: t("q1_answer") },
    { value: "q2", title: t("q2_question"), content: t("q2_answer") },
    { value: "q3", title: t("q3_question"), content: t("q3_answer") },
    { value: "q4", title: t("q4_question"), content: t("q4_answer") },
    { value: "q5", title: t("q5_question"), content: t("q5_answer") },
    { value: "q6", title: t("q6_question"), content: t("q6_answer") },
    { value: "q7", title: t("q7_question"), content: t("q7_answer") },
    { value: "q8", title: t("q8_question"), content: t("q8_answer") },
    { value: "q9", title: t("q9_question"), content: t("q9_answer") },
    { value: "q10", title: t("q10_question"), content: t("q10_answer") },
    { value: "q11", title: t("q11_question"), content: t("q11_answer") },
    { value: "q12", title: t("q12_question"), content: t("q12_answer") },
    { value: "q13", title: t("q13_question"), content: t("q13_answer") },
    { value: "q14", title: t("q14_question"), content: t("q14_answer") },
    { value: "q15", title: t("q15_question"), content: t("q15_answer") },
    { value: "q16", title: t("q16_question"), content: t("q16_answer") },
    { value: "q17", title: t("q17_question"), content: t("q17_answer") },
  ];

  // Generate JSON-LD Schema for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.title,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.content,
      },
    })),
  };

  return (
    <>
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SimplePageLayout pageTitle={t("pageTitle")} intro={t("intro")}>
        <section aria-labelledby="faq-heading" className="mx-auto max-w-3xl mb-16">
          <h2 id="faq-heading" className="sr-only">
            {t("pageTitle")}
          </h2>
          <div className="rounded-xl border border-brand-warm bg-white p-6 shadow-sm md:p-8">
            <SimpleAccordion items={faqItems} />
          </div>
          <div className="mt-8 rounded-xl bg-brand-sand/50 p-6 text-brand-navy">
            <p className="text-lg font-medium italic">{t("conclusion")}</p>
          </div>
        </section>

        {/* Call to Action Section */}
        <section
          aria-labelledby="faq-cta-heading"
          className="mx-auto mt-16 max-w-3xl rounded-xl bg-brand-navy p-8 text-center text-white md:p-12"
        >
          <h2 id="faq-cta-heading" className="text-2xl font-bold text-white md:text-3xl">
            {common("vipSearchBanner.title")}
          </h2>
          <p className="mt-4 text-white/80">{common("vipSearchBanner.body")}</p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 md:flex-row">
            <Link
              href="/search"
              className="inline-flex h-11 items-center rounded-md bg-brand-gold px-6 font-semibold text-brand-navy shadow-[var(--shadow-cta)] transition-colors duration-[var(--duration-fast)] hover:bg-brand-gold/90"
            >
              {common("vipSearchBanner.ctaButton")}
            </Link>
          </div>
        </section>
      </SimplePageLayout>
    </>
  );
}
