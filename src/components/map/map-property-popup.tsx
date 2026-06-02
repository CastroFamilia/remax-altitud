"use client";

/**
 * Story 3.2: MapPropertyPopup — preview card shown when a property pin is tapped.
 *
 * Renders inside a Mapbox Popup anchored to the property's lat/lon.
 * Contains: thumbnail image, price (currency-aware), title, specs (beds/baths/area),
 * ZMT badge, listing type badge, property type badge, and CTA link.
 *
 * @see _bmad-output/implementation-artifacts/3-2-interactive-map-with-property-pins.md Task 4
 */

import Image from "next/image";
import { Popup } from "react-map-gl";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { convertArea, type UnitSystem } from "@/lib/utils/units";
import { PropertyPriceDisplay } from "@/components/property/property-price-display";
import type { OptimizedImage } from "@/types/images";

/** Bi-directional property type display → normalized EN key */
const TYPE_DISPLAY: Record<string, string> = {
  Casa: "House",
  House: "House",
  "House/Villa": "House",
  Residential: "House",
  Lote: "Lot",
  Lot: "Lot",
  "Lot/Land": "Lot",
  Land: "Lot",
  Terreno: "Lot",
  Terrenos: "Lot",
  Finca: "Farm/Ranch",
  Farm: "Farm/Ranch",
  Ranch: "Farm/Ranch",
  "Rural area": "Farm/Ranch",
  Apartamento: "Apartment",
  Apartment: "Apartment",
  Condominium: "Condo",
  Condo: "Condo",
  Comercial: "Commercial",
  Commercial: "Commercial",
};

/** Color classes for property type badge — matches property-card.tsx */
const TYPE_BADGE_COLORS: Record<string, string> = {
  House: "bg-indigo-600",
  Lot: "bg-amber-600",
  "Farm/Ranch": "bg-emerald-700",
  Apartment: "bg-violet-600",
  Condo: "bg-sky-600",
  Commercial: "bg-rose-600",
};

/** Property types that are "land" — show lot size instead of construction */
const LAND_TYPES = new Set([
  "Lote",
  "Terreno",
  "Finca",
  "Lot",
  "Lot/Land",
  "Land",
  "Farm",
  "Ranch",
  "Rural area",
  "Terrenos",
]);

interface MapPropertyPopupProps {
  property: {
    id: string;
    slug: string;
    titleEn: string;
    titleEs: string;
    priceUsd: number;
    bedrooms: number | null;
    bathrooms: number | null;
    lotSizeM2: number | null;
    constructionM2?: number | null;
    zmtStatus: string;
    propertyType?: string;
    listingType?: string;
    currency?: string | null;
    apiRaw?: unknown;
    images: OptimizedImage[];
    latitude: number;
    longitude: number;
  };
  locale: string;
  onClose: () => void;
  unitSystem?: UnitSystem;
}

export function MapPropertyPopup({
  property,
  locale,
  onClose,
  unitSystem = "metric",
}: MapPropertyPopupProps) {
  const t = useTranslations("SearchPage.MapView");

  const title = locale === "es" ? property.titleEs : property.titleEn;
  const firstImage = property.images[0];
  const isLand = LAND_TYPES.has(property.propertyType ?? "");

  // Resolve the original CRC price from apiRaw (same logic as property-card)
  const apiRaw = property.apiRaw as Record<string, unknown> | undefined;
  const originalPriceColones =
    property.currency === "CRC" && apiRaw?.ListPrice ? Number(apiRaw.ListPrice) : null;

  // ZMT badge label (i18n)
  const zmtLabel = t(`zmtStatus.${property.zmtStatus}` as Parameters<typeof t>[0]);

  // Property type badge
  const typeBadgeKey = property.propertyType ? (TYPE_DISPLAY[property.propertyType] ?? null) : null;

  // Build specs line
  const specs: string[] = [];
  if (!isLand) {
    if (property.bedrooms != null) specs.push(t("specs.beds", { count: property.bedrooms }));
    if (property.bathrooms != null) specs.push(t("specs.baths", { count: property.bathrooms }));
    if (property.constructionM2 != null)
      specs.push(convertArea(property.constructionM2, unitSystem, locale, false));
  } else {
    if (property.lotSizeM2 != null)
      specs.push(convertArea(property.lotSizeM2, unitSystem, locale, true));
  }

  return (
    <Popup
      longitude={property.longitude}
      latitude={property.latitude}
      anchor="bottom"
      offset={[0, -30] as [number, number]}
      closeButton={false}
      closeOnClick={false}
      onClose={onClose}
    >
      <div
        data-testid="map-property-popup"
        className="max-w-xs bg-background border border-border rounded-lg shadow-lg overflow-hidden"
      >
        {/* Thumbnail with badges overlay */}
        <div className="relative h-32 w-full">
          <Image
            src={firstImage?.src || "/property-placeholder.svg"}
            alt={firstImage?.alt ?? title}
            fill
            className="object-cover"
            sizes="320px"
            unoptimized
          />

          {/* Property type badge — top-left */}
          {typeBadgeKey && (
            <span
              className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase text-white shadow-sm backdrop-blur-sm ${TYPE_BADGE_COLORS[typeBadgeKey] || "bg-gray-600"}`}
            >
              {t(`typeBadge.${typeBadgeKey}` as Parameters<typeof t>[0])}
            </span>
          )}

          {/* Listing type badge (Sale/Lease) — bottom-right */}
          {property.listingType && (
            <span
              className={`absolute right-2 bottom-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase text-white shadow-sm border border-transparent backdrop-blur-sm ${
                property.listingType === "Lease" ? "bg-brand-blue" : "bg-brand-navy"
              }`}
            >
              {t(`listingType.${property.listingType}` as Parameters<typeof t>[0])}
            </span>
          )}
        </div>

        {/* Card body */}
        <div className="p-3">
          {/* Price — currency-aware */}
          <PropertyPriceDisplay
            priceUsd={property.priceUsd}
            originalCurrency={property.currency}
            originalPriceColones={originalPriceColones}
            locale={locale}
            variant="simple"
            className="text-base font-bold text-foreground"
          />

          {/* Title */}
          <p className="text-sm font-medium text-foreground mt-0.5 line-clamp-2">{title}</p>

          {/* Specs row */}
          {specs.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">{specs.join(" · ")}</p>
          )}

          {/* ZMT badge */}
          <span className="inline-block mt-1.5 bg-muted text-muted-foreground text-xs rounded px-1.5 py-0.5">
            {zmtLabel}
          </span>

          {/* Actions row */}
          <div className="flex items-center justify-between mt-3">
            <Link
              href={`/property/${property.slug}`}
              className="text-xs font-semibold text-brand-navy hover:underline"
            >
              {t("viewDetails")}
            </Link>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("closePopup")}
              data-testid="map-popup-close"
              className="text-muted-foreground hover:text-foreground"
            >
              <X size={14} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </Popup>
  );
}
