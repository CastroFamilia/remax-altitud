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
  const t = await getTranslations({ locale, namespace: "PrivacyPage" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      languages: {
        en: "/en/privacy",
        es: "/es/privacy",
      },
    },
  };
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PrivacyPageContent />;
}

function PrivacyPageContent() {
  const t = useTranslations("PrivacyPage");
  return (
    <SimplePageLayout pageTitle={t("pageTitle")} intro={t("intro")}>
      <div className="mx-auto max-w-3xl space-y-10 text-text-muted">
        {/* 1. Information We Collect */}
        <section aria-labelledby="privacy-collect">
          <h2 id="privacy-collect" className="mb-3 text-xl font-bold text-brand-navy">
            {t("collect.heading")}
          </h2>
          <p>{t("collect.body")}</p>
        </section>

        {/* 2. How We Use Your Information */}
        <section aria-labelledby="privacy-use">
          <h2 id="privacy-use" className="mb-3 text-xl font-bold text-brand-navy">
            {t("use.heading")}
          </h2>
          <p>{t("use.body")}</p>
        </section>

        {/* 3. Cookies */}
        <section aria-labelledby="privacy-cookies">
          <h2 id="privacy-cookies" className="mb-3 text-xl font-bold text-brand-navy">
            {t("cookies.heading")}
          </h2>
          <p>{t("cookies.body")}</p>
        </section>

        {/* 4. Third Parties */}
        <section aria-labelledby="privacy-third">
          <h2 id="privacy-third" className="mb-3 text-xl font-bold text-brand-navy">
            {t("third.heading")}
          </h2>
          <p>{t("third.body")}</p>
        </section>

        {/* 5. Your Rights */}
        <section aria-labelledby="privacy-rights">
          <h2 id="privacy-rights" className="mb-3 text-xl font-bold text-brand-navy">
            {t("rights.heading")}
          </h2>
          <p>{t("rights.body")}</p>
        </section>

        {/* 6. Contact */}
        <section aria-labelledby="privacy-contact">
          <h2 id="privacy-contact" className="mb-3 text-xl font-bold text-brand-navy">
            {t("contact.heading")}
          </h2>
          <p>{t("contact.body")}</p>
        </section>

        <p className="text-sm text-text-muted/60">{t("lastUpdated")}</p>
      </div>
    </SimplePageLayout>
  );
}
