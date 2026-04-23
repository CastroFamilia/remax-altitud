import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SimplePageLayout } from "@/components/layout/simple-page-layout";
import { OfficeCard } from "@/components/layout/office-card";
import { ContactForm } from "@/components/lead/contact-form";
import { offices } from "@/lib/constants/offices";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ContactPage" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      languages: {
        en: "/en/contact",
        es: "/es/contact",
      },
    },
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      type: "website",
    },
  };
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ContactPageContent />;
}

function ContactPageContent() {
  const t = useTranslations("ContactPage");
  return (
    <SimplePageLayout pageTitle={t("pageTitle")} intro={t("intro")}>
      <section aria-labelledby="contact-offices-heading" className="mx-auto max-w-5xl">
        <h2 id="contact-offices-heading" className="text-2xl font-bold text-brand-navy md:text-3xl">
          {t("officesHeading")}
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          {offices.map((office) => (
            <OfficeCard key={office.name} office={office} />
          ))}
        </div>
      </section>

      <section aria-labelledby="contact-form-heading" className="mx-auto mt-16 max-w-3xl">
        <h2
          id="contact-form-heading"
          className="text-center text-2xl font-bold text-brand-navy md:text-3xl"
        >
          {t("formHeading")}
        </h2>
        <p className="mt-2 text-center text-text-muted">{t("formIntro")}</p>
        <div className="mt-8">
          <ContactForm />
        </div>
      </section>
    </SimplePageLayout>
  );
}
