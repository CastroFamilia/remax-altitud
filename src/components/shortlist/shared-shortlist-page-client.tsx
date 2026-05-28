"use client";

import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { PropertyCard } from "@/components/property/property-card";
import { MapView } from "@/components/map/map-view-loader";
import type { PropertySearchItem } from "@/types/search";
import { Info, Sparkles } from "lucide-react";

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
      <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="max-w-md w-full bg-white rounded-2xl border border-brand-warm p-8 text-center shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="w-16 h-16 rounded-full bg-brand-burgundy/10 text-brand-burgundy flex items-center justify-center mx-auto mb-6 animate-pulse">
            <span className="text-3xl" role="img" aria-label="hourglass">
              ⏳
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-3 text-brand-navy tracking-tight">
            {t("expiredTitle")}
          </h1>
          <p className="text-muted-foreground text-sm md:text-base mb-8 leading-relaxed">
            {t("expiredMessage")}
          </p>
          <Link
            href={`/${locale}/search`}
            className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-brand-navy text-white font-semibold hover:bg-brand-navy-light shadow-md transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
          >
            {t("browseCta")}
          </Link>
        </div>
      </div>
    );
  }

  // Filter out any properties that have null coordinates to prevent Mapbox/Supercluster runtime crashes.
  const mapProperties = properties.filter(
    (p): p is typeof p & { latitude: number; longitude: number } =>
      p.latitude !== null && p.longitude !== null,
  );

  return (
    <div className="container mx-auto px-4 py-10">
      {/* Premium Information Banner */}
      <div className="mb-8 rounded-xl bg-gradient-to-r from-brand-navy/5 via-brand-navy/[0.08] to-brand-gold/5 border border-brand-navy/10 p-5 shadow-sm backdrop-blur-md flex items-start gap-4 transition-all duration-300 hover:shadow-md hover:border-brand-gold/30">
        <div className="p-2.5 rounded-lg bg-brand-navy/10 text-brand-navy flex-shrink-0 animate-pulse">
          <Info className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm md:text-base font-medium text-brand-navy leading-relaxed">
            {t("sharedBanner")}
          </p>
        </div>
      </div>

      {/* Title Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-gold-dark bg-brand-gold/15 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" />
            RE/MAX Altitud
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-brand-navy tracking-tight mt-1">
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          {locale === "es"
            ? `${properties.length} ${properties.length === 1 ? "propiedad seleccionada" : "propiedades seleccionadas"}`
            : `${properties.length} ${properties.length === 1 ? "curated property" : "curated properties"}`}
        </p>
      </div>

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
        <div className="lg:col-span-5 h-[350px] lg:h-[600px] sticky top-24 rounded-2xl overflow-hidden shadow-lg border border-brand-warm">
          <MapView properties={mapProperties} locale={locale} />
        </div>
      </div>
    </div>
  );
}
