"use client";

import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { PropertyCard } from "@/components/property/property-card";
import { MapView } from "@/components/map/map-view-loader";
import type { PropertySearchItem } from "@/types/search";

interface SharedShortlistPageClientProps {
  properties: PropertySearchItem[];
  isExpired?: boolean;
}

export function SharedShortlistPageClient({
  properties = [],
  isExpired = false,
}: SharedShortlistPageClientProps) {
  const t = useTranslations("Shortlist");
  const locale = useLocale();

  // Expired state
  if (isExpired) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-lg">
        <h1 className="text-3xl font-bold mb-4 text-brand-navy">{t("expiredTitle")}</h1>
        <p className="text-muted-foreground mb-8">{t("expiredMessage")}</p>
        <Link
          href={`/${locale}/search`}
          className="inline-flex h-11 items-center justify-center rounded-md bg-brand-navy hover:bg-brand-navy/90 text-white font-semibold px-8 shadow-md transition-colors"
        >
          {t("browseCta")}
        </Link>
      </div>
    );
  }

  // Filter out any properties that have null coordinates to prevent Mapbox/Supercluster runtime crashes.
  const mapProperties = properties.filter(
    (p): p is typeof p & { latitude: number; longitude: number } =>
      p.latitude !== null && p.longitude !== null,
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Information Banner */}
      <div className="mb-6 rounded-lg bg-blue-50 border border-blue-200 p-4 text-blue-800">
        {t("sharedBanner")}
      </div>

      <h1 className="text-3xl font-bold mb-6 text-brand-navy">{t("title")}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Property list */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {properties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                locale={locale}
                readOnly={true}
                isSharedView={true}
              />
            ))}
          </div>
        </div>

        {/* Right Side: Mini-map showing shared property locations */}
        <div className="lg:col-span-5 h-[350px] lg:h-[600px] sticky top-24 rounded-xl overflow-hidden shadow-md border border-border">
          <MapView properties={mapProperties} locale={locale} />
        </div>
      </div>
    </div>
  );
}
