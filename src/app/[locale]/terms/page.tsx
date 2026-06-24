import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SimplePageLayout } from "@/components/layout/simple-page-layout";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "TermsPage" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      languages: {
        en: "/en/terms",
        es: "/es/terms",
      },
    },
  };
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <TermsPageContent />;
}

function TermsPageContent() {
  const t = useTranslations("TermsPage");
  return (
    <SimplePageLayout pageTitle={t("pageTitle")} intro={t("intro")}>
      <div className="mx-auto max-w-3xl space-y-10 text-text-muted">
        {/* 1. Acceptance */}
        <section aria-labelledby="terms-acceptance">
          <h2 id="terms-acceptance" className="mb-3 text-xl font-bold text-brand-navy">
            {t("acceptance.heading")}
          </h2>
          <p>{t("acceptance.body")}</p>
        </section>

        {/* 2. Use of the Site */}
        <section aria-labelledby="terms-use">
          <h2 id="terms-use" className="mb-3 text-xl font-bold text-brand-navy">
            {t("use.heading")}
          </h2>
          <p>{t("use.body")}</p>
        </section>

        {/* 3. Listings & Information */}
        <section aria-labelledby="terms-listings">
          <h2 id="terms-listings" className="mb-3 text-xl font-bold text-brand-navy">
            {t("listings.heading")}
          </h2>
          <p>{t("listings.body")}</p>
        </section>

        {/* 4. Intellectual Property */}
        <section aria-labelledby="terms-ip">
          <h2 id="terms-ip" className="mb-3 text-xl font-bold text-brand-navy">
            {t("ip.heading")}
          </h2>
          <p>{t("ip.body")}</p>
        </section>

        {/* 5. Limitation of Liability */}
        <section aria-labelledby="terms-liability">
          <h2 id="terms-liability" className="mb-3 text-xl font-bold text-brand-navy">
            {t("liability.heading")}
          </h2>
          <p>{t("liability.body")}</p>
        </section>

        {/* 6. Governing Law */}
        <section aria-labelledby="terms-law">
          <h2 id="terms-law" className="mb-3 text-xl font-bold text-brand-navy">
            {t("law.heading")}
          </h2>
          <p>{t("law.body")}</p>
        </section>

        {/* 7. Contact */}
        <section aria-labelledby="terms-contact">
          <h2 id="terms-contact" className="mb-3 text-xl font-bold text-brand-navy">
            {t("contact.heading")}
          </h2>
          <p>{t("contact.body")}</p>
        </section>

        <p className="text-sm text-text-muted/60">{t("lastUpdated")}</p>
      </div>
    </SimplePageLayout>
  );
}
