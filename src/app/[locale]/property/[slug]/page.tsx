import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SimplePageLayout } from "@/components/layout/simple-page-layout";
import { Link } from "@/i18n/navigation";
import {
  getPropertyBySlug,
  getSimilarProperties,
  getAllPropertySlugs,
} from "@/lib/db/queries/properties";
import { getAgentById } from "@/lib/db/queries/agents";
import { getOfficeById } from "@/lib/db/queries/offices";
import { ListingDetailLayout } from "@/components/listing/listing-detail-layout";
import { normalizePropertyImages } from "@/lib/utils/normalize-images";
import { getAreaBySlug } from "@/lib/db/queries/areas";
import { InvestmentContext } from "@/components/area/investment-context";
import {
  generateListingJsonLd,
  generateBreadcrumbJsonLd,
  serializeJsonLd,
} from "@/lib/seo/structured-data";
import { buildAlternatesMetadata, generateCanonicalUrl } from "@/lib/seo/metadata";
import { SITE_ORIGIN } from "@/lib/seo/constants";

// Story 4.1 Task 1: Replace force-dynamic with ISR (NFR25, 4.1-UNIT-002)
// Revalidate every 24 hours — the sync pipeline's revalidateTag('properties') call
// also triggers on-demand revalidation after each daily sync.
export const revalidate = 86400; // 24 hours

/**
 * SSG build-time generation — calls getAllPropertySlugs at build time.
 * Wrapped in try/catch so the build continues if the DB is unavailable
 * (pages generated on-demand via ISR fallback).
 */
export async function generateStaticParams() {
  try {
    const slugs = await getAllPropertySlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return []; // Build continues; pages generated on-demand via ISR
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const property = await getPropertyBySlug(slug);
  if (!property) return {};
  if (!property.isVisible) return { robots: { index: false, follow: false } };
  const title = locale === "es" ? property.titleEs : property.titleEn;
  const description = locale === "es" ? property.descriptionEs : property.descriptionEn;
  const images = normalizePropertyImages(property.images);
  return {
    title: `${title} | RE/MAX Altitud`,
    description: description.slice(0, 160),
    alternates: {
      canonical: generateCanonicalUrl(locale, `/property/${slug}`),
      ...buildAlternatesMetadata(`/property/${slug}`),
    },
    openGraph: {
      title,
      description: description.slice(0, 160),
      images: images[0] ? [{ url: images[0].src }] : [],
      type: "website",
      url: generateCanonicalUrl(locale, `/property/${slug}`),
    },
  };
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
      <div data-testid="listing-unavailable-page">
        <SimplePageLayout pageTitle={t("heading")} intro={t("subtext")}>
          {similar.length > 0 ? (
            <section aria-labelledby="similar-heading" className="mx-auto max-w-3xl">
              <h2
                id="similar-heading"
                className="mb-6 text-xl font-bold text-brand-navy md:text-2xl"
              >
                {t("similarHeading")}
              </h2>
              <ul data-testid="similar-properties-list" className="space-y-4">
                {similar.map((p) => (
                  <li key={p.slug}>
                    <Link
                      href={`/property/${p.slug}`}
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
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <div className="mx-auto max-w-3xl text-center">
              <Link
                href="/search"
                data-testid="agent-cta"
                className="inline-block rounded-lg bg-brand-navy px-6 py-3 font-semibold text-white hover:bg-brand-navy/90 transition-colors"
              >
                {t("browseCta")}
              </Link>
            </div>
          )}
        </SimplePageLayout>
      </div>
    );
  }

  // Fetch associated agent (if agentId is set)
  const agent = property.agentId ? await getAgentById(property.agentId) : null;

  // Fetch associated office name (Story 4.2, Task 5b)
  const office = agent?.officeId ? await getOfficeById(agent.officeId) : null;

  // Story 4.4 Task 7: JSON-LD structured data for RealEstateListing + BreadcrumbList (AC #1, #4)
  const title = locale === "es" ? property.titleEs : property.titleEn;
  const tBreadcrumbs = await getTranslations({ locale, namespace: "Breadcrumbs" });
  const listingJsonLd = generateListingJsonLd(property, locale);
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { position: 1, name: tBreadcrumbs("home"), href: `${SITE_ORIGIN}/${locale}` },
    { position: 2, name: tBreadcrumbs("search"), href: `${SITE_ORIGIN}/${locale}/search` },
    {
      position: 3,
      name: title,
      href: `${SITE_ORIGIN}/${locale}/property/${property.slug}`,
    },
  ]);

  // Query optimization: only fetch area metadata if the property is tagged for investment (AC #4)
  const INVESTMENT_TAGS = ["Investment Property", "Rental Potential", "Commercial"];
  const hasInvestmentTag = property.lifestyleTags?.some((tag) => INVESTMENT_TAGS.includes(tag));
  const area = hasInvestmentTag && property.areaSlug ? await getAreaBySlug(property.areaSlug) : null;

  const investmentContext = area ? (
    <InvestmentContext metadata={area.metadata as Record<string, unknown> | null} locale={locale} />
  ) : undefined;

  // Visible property → full listing detail page (Story 4.1)
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(listingJsonLd) }}
        data-testid="listing-jsonld"
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
        data-testid="breadcrumb-jsonld"
      />
      <ListingDetailLayout
        property={property}
        agent={agent}
        locale={locale}
        officeName={office?.name}
        investmentContext={investmentContext}
      />
    </>
  );
}
