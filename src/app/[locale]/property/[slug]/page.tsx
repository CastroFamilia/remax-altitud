import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SimplePageLayout } from "@/components/layout/simple-page-layout";
import { getPropertyBySlug, getSimilarProperties } from "@/lib/db/queries/properties";

// Force dynamic — property visibility changes after each sync run
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);
  if (!property || property.isVisible) return {};
  // Soft-deleted: suppress from search engines
  return { robots: { index: false, follow: false } };
}

export default async function PropertyPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug, locale } = await params;
  setRequestLocale(locale); // required for next-intl static rendering support

  const property = await getPropertyBySlug(slug);

  if (!property) {
    notFound(); // URL never existed → 404
  }

  if (!property.isVisible) {
    // Soft-deleted → "No longer available" UI (NOT a 404)
    const similar = await getSimilarProperties(property.areaSlug, slug);
    const t = await getTranslations({ locale, namespace: "PropertyUnavailable" });

    return (
      <SimplePageLayout pageTitle={t("heading")} intro={t("subtext")}>
        {similar.length > 0 ? (
          <section aria-labelledby="similar-heading" className="mx-auto max-w-3xl">
            <h2 id="similar-heading" className="mb-6 text-xl font-bold text-brand-navy md:text-2xl">
              {t("similarHeading")}
            </h2>
            <ul className="space-y-4">
              {similar.map((p) => (
                <li key={p.slug}>
                  <a
                    href={`/${locale}/property/${p.slug}`}
                    className="block rounded-lg border border-gray-200 p-4 hover:border-brand-navy hover:bg-gray-50 transition-colors"
                  >
                    <p className="font-semibold text-brand-navy">
                      {locale === "es" ? p.titleEs : p.titleEn}
                    </p>
                    {p.priceUsd != null && (
                      <p className="mt-1 text-sm text-text-muted">
                        ${p.priceUsd.toLocaleString("en-US")}
                      </p>
                    )}
                    <span className="mt-2 inline-block text-sm font-medium text-brand-navy underline">
                      {t("similarCta")}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <div className="mx-auto max-w-3xl text-center">
            <a
              href={`/${locale}/search`}
              className="inline-block rounded-lg bg-brand-navy px-6 py-3 font-semibold text-white hover:bg-brand-navy/90 transition-colors"
            >
              {t("browseCta")}
            </a>
          </div>
        )}
      </SimplePageLayout>
    );
  }

  // TODO Story 4.1: Full listing detail page
  notFound(); // Placeholder — visible properties have no detail page yet
}
