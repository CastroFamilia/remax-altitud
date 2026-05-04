/**
 * ListingDetailLayout — Server Component
 *
 * Full-page layout for a listing detail page. Composes the gallery (lazy-loaded
 * Client Component), sticky specs bar, bilingual title/description, and features.
 *
 * Story 4.1, Task 4 | Story 4.2, Task 5 (AgentCard + StickyMobileCTA)
 * AC #1, #6, #7, #8, #9
 */

import { getTranslations } from "next-intl/server";
import { convertArea } from "@/lib/utils/units";
import { StickySpecsBar } from "@/components/listing/sticky-specs-bar";
import { PropertyGalleryLoader } from "@/components/listing/property-gallery-loader";
import { AgentCard } from "@/components/agent/agent-card";
import { StickyMobileCTA } from "@/components/lead/sticky-mobile-cta";
import { SimilarPropertiesLoader } from "@/components/listing/similar-properties-loader";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import type { Property } from "@/lib/db/schema/properties";
import type { Agent } from "@/lib/db/schema/agents";
import { normalizePropertyImages } from "@/lib/utils/normalize-images";
import { getRegionFromAreaSlug } from "@/components/property/property-card";

// ZMT badge visual config (same as property-card.tsx)
const ZMT_VISUAL: Record<string, { classes: string; icon: string }> = {
  titled: {
    classes: "bg-green-100 text-green-800",
    icon: "✓",
  },
  concession: {
    classes: "bg-amber-100 text-amber-800",
    icon: "◑",
  },
  zmt_restricted: {
    classes: "bg-red-100 text-red-800",
    icon: "⚠",
  },
};

interface ListingDetailLayoutProps {
  property: Property;
  agent: Agent | null;
  locale: string;
  officeName?: string; // resolved server-side in page.tsx (Story 4.2, Task 5b)
}

export async function ListingDetailLayout({
  property,
  agent,
  locale,
  officeName,
}: ListingDetailLayoutProps) {
  const t = await getTranslations({ locale, namespace: "ListingDetail" });
  const tBreadcrumbs = await getTranslations({ locale, namespace: "Breadcrumbs" });

  // Locale-aware title with cross-locale fallback so the WhatsApp/email
  // pre-populated message never references an empty title when one locale is missing.
  const title =
    (locale === "es" ? property.titleEs : property.titleEn) ??
    property.titleEn ??
    property.titleEs ??
    "";
  const description = locale === "es" ? property.descriptionEs : property.descriptionEn;
  const images = normalizePropertyImages(property.images, title);

  // ZMT badge
  const zmtVisual = property.zmtStatus ? ZMT_VISUAL[property.zmtStatus] : null;
  const zmtStatusKey = property.zmtStatus as "titled" | "concession" | "zmt_restricted" | null;

  // Region from area slug
  const region = getRegionFromAreaSlug(property.areaSlug);

  // Amenities — stored as a string array in the DB
  const amenities = (property.amenities as unknown as string[]) ?? [];

  return (
    <>
      <article className="min-h-screen bg-background">
        {/* Breadcrumbs — visual nav (Story 4.5, AC #4) */}
        <Breadcrumbs
          items={[
            { label: tBreadcrumbs("home"), href: "/" },
            { label: tBreadcrumbs("search"), href: "/search" },
            { label: title },
          ]}
          locale={locale}
          ariaLabel={tBreadcrumbs("ariaLabel")}
        />

        {/* Hero Gallery — lazy-loaded Client Component via PropertyGalleryLoader (ssr: false) */}
        <PropertyGalleryLoader
          images={images}
          youtubeUrl={property.youtubeUrl}
          propertyTitle={title}
        />

        {/* Sticky specs bar — Client Component (uses useLocaleUnits) */}
        <StickySpecsBar
          priceUsd={property.priceUsd}
          bedrooms={property.bedrooms}
          bathrooms={property.bathrooms}
          lotSizeM2={property.lotSizeM2}
          constructionM2={property.constructionM2}
          zmtStatus={property.zmtStatus ?? "titled"}
          locale={locale}
        />

        <div className="mx-auto max-w-7xl px-4 py-8 space-y-8">
          {/* Title */}
          <div>
            <h1 className="text-3xl font-bold text-brand-navy md:text-4xl">{title}</h1>

            {/* Region badge */}
            {region && (
              <span className="mt-2 inline-block rounded-full bg-brand-navy/10 px-3 py-1 text-sm font-medium text-brand-navy">
                {region}
              </span>
            )}

            {/* ZMT badge (more prominent than in property card) */}
            {zmtVisual && zmtStatusKey && (
              <span
                className={`ml-2 mt-2 inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold ${zmtVisual.classes}`}
              >
                <span aria-hidden="true">{zmtVisual.icon}</span>
                {t(`zmtStatus.${zmtStatusKey}` as Parameters<typeof t>[0])}
              </span>
            )}
          </div>

          {/* Property specs summary */}
          <div className="grid grid-cols-2 gap-4 rounded-xl border border-border p-6 md:grid-cols-4">
            {property.priceUsd != null && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                  {t("specs.price")}
                </p>
                <p className="mt-1 text-lg font-bold text-brand-navy">
                  ${property.priceUsd.toLocaleString("en-US")}
                </p>
              </div>
            )}
            {property.bedrooms != null && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                  {t("specs.bedrooms", { count: property.bedrooms })}
                </p>
                <p className="mt-1 text-lg font-bold text-brand-navy">{property.bedrooms}</p>
              </div>
            )}
            {property.bathrooms != null && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                  {t("specs.bathrooms", { count: property.bathrooms })}
                </p>
                <p className="mt-1 text-lg font-bold text-brand-navy">{property.bathrooms}</p>
              </div>
            )}
            {property.lotSizeM2 != null && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                  {t("specs.lotSize")}
                </p>
                <p className="mt-1 text-lg font-bold text-brand-navy">
                  {convertArea(property.lotSizeM2, "metric", locale)}
                </p>
              </div>
            )}
            {property.constructionM2 != null && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                  {t("specs.builtArea")}
                </p>
                <p className="mt-1 text-lg font-bold text-brand-navy">
                  {convertArea(property.constructionM2, "metric", locale)}
                </p>
              </div>
            )}
          </div>

          {/* Description */}
          {description && (
            <section aria-labelledby="description-heading">
              <h2 id="description-heading" className="mb-4 text-2xl font-bold text-brand-navy">
                {t("description")}
              </h2>
              <div className="prose prose-gray max-w-none">
                {description.split("\n").map((paragraph, i) => (
                  // Using index as key is safe here: the list is derived from a
                  // static string split — order never changes and items are never
                  // reordered, inserted, or removed independently.
                  <p key={i} className="mb-4 text-text-body leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          )}

          {/* Features & Amenities */}
          {amenities.length > 0 && (
            <section aria-labelledby="features-heading">
              <h2 id="features-heading" className="mb-4 text-2xl font-bold text-brand-navy">
                {t("features")}
              </h2>
              <ul className="grid grid-cols-2 gap-2 md:grid-cols-3">
                {amenities.map((amenity) => (
                  <li
                    key={amenity}
                    className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                  >
                    <span aria-hidden="true" className="text-brand-navy">
                      ✓
                    </span>
                    <span>{amenity}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Agent Card (Story 4.2) */}
          {agent ? (
            <AgentCard
              agent={agent}
              propertyTitle={title}
              propertyRef={property.apiId ?? property.id}
              locale={locale}
              officeName={officeName ?? t("unknownOffice")}
            />
          ) : (
            <p className="text-sm text-text-muted">{t("noAgentAssigned")}</p>
          )}

          {/* Similar Properties carousel — Suspense-wrapped for LCP isolation (Story 4.5, AC #1, #8) */}
          <SimilarPropertiesLoader
            currentSlug={property.slug}
            areaSlug={property.areaSlug}
            priceUsd={property.priceUsd}
            propertyType={property.propertyType}
            locale={locale}
          />

          {/* TODO Epic 6: Area context block (area name link + nearby count) goes here */}

          {/* TODO post-4.1: Location Map (Mapbox, Epic 3 scope only) */}
          {/* <PropertyLocationMap lat={property.latitude} lng={property.longitude} /> */}
        </div>
      </article>

      {/* Sticky mobile CTA bar — 56px fixed bottom bar, mobile-only (Story 4.2, AC #6/#7) */}
      {agent && (
        <StickyMobileCTA
          agentId={agent.id}
          agentWhatsapp={agent.whatsapp ?? null}
          agentEmail={agent.email ?? null}
          agentName={agent.name}
          propertyTitle={title}
          propertyRef={property.apiId ?? property.id}
          locale={locale}
        />
      )}
    </>
  );
}

export default ListingDetailLayout;
