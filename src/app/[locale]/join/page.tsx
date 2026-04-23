import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SimplePageLayout } from "@/components/layout/simple-page-layout";
import { RecruitmentForm } from "@/components/lead/contact-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "JoinPage" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      languages: {
        en: "/en/join",
        es: "/es/join",
      },
    },
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      type: "website",
    },
  };
}

const BENEFIT_KEYS = [1, 2, 3, 4] as const;

export default async function JoinPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <JoinPageContent />;
}

function JoinPageContent() {
  const t = useTranslations("JoinPage");
  return (
    <SimplePageLayout pageTitle={t("pageTitle")} intro={t("intro")}>
      <section aria-labelledby="benefits-heading" className="mx-auto max-w-5xl">
        <h2
          id="benefits-heading"
          className="text-center text-2xl font-bold text-brand-navy md:text-3xl"
        >
          {t("benefitsHeading")}
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          {BENEFIT_KEYS.map((n) => (
            <article key={n} className="rounded-xl border border-brand-warm bg-white p-6 shadow-md">
              <h3 className="text-lg font-bold text-brand-navy md:text-xl">
                {t(`benefit${n}Title`)}
              </h3>
              <p className="mt-2 text-text-muted">{t(`benefit${n}Body`)}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="join-form-heading" className="mx-auto mt-16 max-w-3xl">
        <h2
          id="join-form-heading"
          className="text-center text-2xl font-bold text-brand-navy md:text-3xl"
        >
          {t("formHeading")}
        </h2>
        <div className="mt-8">
          <RecruitmentForm />
        </div>
      </section>
    </SimplePageLayout>
  );
}
