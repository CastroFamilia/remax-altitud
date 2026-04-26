"use client";

/**
 * Story 3.2: MapPropertyPopup — preview card shown when a property pin is tapped.
 *
 * Renders inside a Mapbox Popup anchored to the property's lat/lon.
 * Contains: thumbnail image, price, title, specs (beds/baths/lot), ZMT badge, CTA link.
 *
 * @see _bmad-output/implementation-artifacts/3-2-interactive-map-with-property-pins.md Task 4
 */

import Image from "next/image";
import { Popup } from "react-map-gl";
import { X } from "lucide-react";
import { Link } from "@/i18n/navigation";

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
    zmtStatus: string;
    images: { url: string; alt?: string }[];
    latitude: number;
    longitude: number;
  };
  locale: string;
  onClose: () => void;
}

const ZMT_LABELS: Record<string, string> = {
  titled: "Titled",
  concession: "Concession",
  zmt_restricted: "ZMT Restricted",
};

export function MapPropertyPopup({ property, locale, onClose }: MapPropertyPopupProps) {
  const title = locale === "es" ? property.titleEs : property.titleEn;
  const firstImage = property.images[0];
  const formattedPrice = property.priceUsd.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
  const zmtLabel = ZMT_LABELS[property.zmtStatus] ?? property.zmtStatus;

  const specs: string[] = [];
  if (property.bedrooms != null) specs.push(`${property.bedrooms} bed`);
  if (property.bathrooms != null) specs.push(`${property.bathrooms} bath`);
  if (property.lotSizeM2 != null) specs.push(`${Math.round(property.lotSizeM2)} m²`);

  return (
    <Popup
      longitude={property.longitude}
      latitude={property.latitude}
      anchor="bottom"
      offset={[0, -30] as [number, number]}
      closeButton={false}
      onClose={onClose}
    >
      <div
        data-testid="map-property-popup"
        className="max-w-xs bg-background border border-border rounded-lg shadow-lg overflow-hidden"
      >
        {/* Thumbnail.
            `unoptimized` keeps next/image safe with arbitrary remote URLs
            until `images.remotePatterns` is configured for property image
            hosts in next.config.ts. Without `unoptimized`, Next.js will
            throw at runtime for hosts not on the allowlist. */}
        {firstImage ? (
          <div className="relative h-32 w-full">
            <Image
              src={firstImage.url}
              alt={firstImage.alt ?? title}
              fill
              className="object-cover"
              sizes="320px"
              unoptimized
            />
          </div>
        ) : (
          <div className="h-32 w-full bg-muted" aria-hidden="true" />
        )}

        {/* Card body */}
        <div className="p-3">
          {/* Price */}
          <p className="text-base font-bold text-foreground">{formattedPrice}</p>

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
              // next-intl's <Link> automatically prepends the active locale —
              // pass the path WITHOUT the locale prefix to avoid /en/en/...
              href={`/property/${property.slug}`}
              className="text-xs font-semibold text-brand-navy hover:underline"
            >
              View Details
            </Link>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close property preview"
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
