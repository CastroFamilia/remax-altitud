import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SimplePageLayout } from "@/components/layout/simple-page-layout";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ServicesPage" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      languages: {
        en: "/en/services",
        es: "/es/services",
      },
    },
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      type: "website",
    },
  };
}

type ServiceKey = "buy" | "sell" | "invest";

const SERVICES: Array<{ key: ServiceKey; href: string }> = [
  { key: "buy", href: "/search" },
  { key: "sell", href: "/sell" },
  { key: "invest", href: "/search?tag=investment" },
];

export default async function ServicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ServicesPageContent />;
}

function ServicesPageContent() {
  const t = useTranslations("ServicesPage");
  return (
    <SimplePageLayout pageTitle={t("pageTitle")} intro={t("intro")}>
      <section aria-labelledby="services-heading" className="mx-auto max-w-6xl">
        <h2 id="services-heading" className="sr-only">
          {t("servicesHeading")}
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {SERVICES.map(({ key, href }) => (
            <article
              key={key}
              className="flex flex-col rounded-xl border border-brand-warm bg-white p-6 shadow-md"
            >
              <h3 className="text-xl font-bold text-brand-navy md:text-2xl">
                {t(`${key}.heading`)}
              </h3>
              <p className="mt-3 text-text-muted">{t(`${key}.description`)}</p>
              <ul className="mt-4 flex-1 space-y-2 text-sm text-brand-navy/80">
                <li className="flex gap-2">
                  <span aria-hidden className="text-brand-gold-dark">
                    •
                  </span>
                  <span>{t(`${key}.bullet1`)}</span>
                </li>
                <li className="flex gap-2">
                  <span aria-hidden className="text-brand-gold-dark">
                    •
                  </span>
                  <span>{t(`${key}.bullet2`)}</span>
                </li>
                <li className="flex gap-2">
                  <span aria-hidden className="text-brand-gold-dark">
                    •
                  </span>
                  <span>{t(`${key}.bullet3`)}</span>
                </li>
                <li className="flex gap-2">
                  <span aria-hidden className="text-brand-gold-dark">
                    •
                  </span>
                  <span>{t(`${key}.bullet4`)}</span>
                </li>
              </ul>
              <Link
                href={href}
                className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-brand-navy px-6 font-semibold text-white shadow-[var(--shadow-cta)] transition-colors duration-[var(--duration-fast)] hover:bg-brand-navy-light"
              >
                {t(`${key}.cta`)}
              </Link>
            </article>
          ))}
        </div>
      </section>
    </SimplePageLayout>
  );
}
