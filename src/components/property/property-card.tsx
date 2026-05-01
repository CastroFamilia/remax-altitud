import Link from "next/link";
import Image from "next/image";
import { SaveButton } from "@/components/property/save-button";
import { ShareButton } from "@/components/property/share-button";
import { formatPriceAbbrev } from "@/lib/map/geo-utils";
import type { PropertySearchItem } from "@/types/search";

interface PropertyCardProps {
  property: PropertySearchItem;
  locale: string;
  variant?: "default" | "compact" | "horizontal";
}

const BEACH_SLUGS = new Set([
  "dominical",
  "uvita",
  "ojochal",
  "quepos",
  "manuel-antonio",
  "jaco",
  "tamarindo",
  "nosara",
  "samara",
  "santa-teresa",
  "playa-hermosa",
]);

const MOUNTAIN_SLUGS = new Set(["perez-zeledon"]);

const LAND_TYPES = new Set(["Lote", "Terreno", "Finca"]);

/**
 * Determine region from area slug.
 * Returns 'Mountain', 'Beach', or null.
 */
export function getRegionFromAreaSlug(areaSlug: string | null): "Mountain" | "Beach" | null {
  if (!areaSlug) return null;
  if (BEACH_SLUGS.has(areaSlug)) return "Beach";
  if (MOUNTAIN_SLUGS.has(areaSlug)) return "Mountain";
  return null;
}

/**
 * Format area in human-friendly units.
 * >= 10,000 m² → ha; otherwise m²
 */
function formatArea(value: number): string {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(1)} ha`;
  }
  return `${Math.round(value)} m²`;
}

// ZMT badge config
const ZMT_CONFIG: Record<string, { label: string; classes: string; icon: string }> = {
  titled: {
    label: "Titled Property",
    classes: "bg-green-100 text-green-800",
    icon: "✓",
  },
  concession: {
    label: "Concession",
    classes: "bg-amber-100 text-amber-800",
    icon: "◑",
  },
  zmt_restricted: {
    label: "ZMT Restricted",
    classes: "bg-red-100 text-red-800",
    icon: "⚠",
  },
};

/**
 * PropertyCard — Server Component (RSC).
 * Architecture §8: PropertyCard (static data) → Server Component.
 * SaveButton and ShareButton are Client Component children.
 */
export function PropertyCard({ property, locale, variant = "default" }: PropertyCardProps) {
  const title = locale === "es" ? (property.titleEs ?? property.titleEn) : property.titleEn;
  const price = formatPriceAbbrev(property.priceUsd);
  const imageSrc = property.images[0]?.url ?? "/property-placeholder.svg";
  const imageAlt = property.images[0]?.alt ?? title;
  const region = getRegionFromAreaSlug(property.areaSlug);
  const isLand = LAND_TYPES.has(property.propertyType);
  const zmtConfig = property.zmtStatus ? ZMT_CONFIG[property.zmtStatus] : null;

  const isHorizontal = variant === "horizontal";
  const isCompact = variant === "compact";

  return (
    <article
      data-testid="property-card"
      role="article"
      aria-label={`Property: ${title}, ${price}`}
      className={`group relative overflow-hidden rounded-lg bg-card shadow-sm transition-all duration-200 ease-out hover:translate-y-[-4px] hover:shadow-lg ${isHorizontal ? "flex flex-row" : ""}`}
    >
      {/* Card link wraps image + body */}
      <Link
        href={`/${locale}/property/${property.slug}`}
        className={isHorizontal ? "flex flex-row w-full" : "block"}
      >
        {/* Hero image */}
        <div
          data-testid="property-image"
          className={`relative aspect-[3/2] overflow-hidden ${isHorizontal ? "w-[40%] flex-shrink-0" : ""}`}
        >
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />

          {/* Region badge — top-left overlay */}
          {region && (
            <span
              data-testid="region-badge"
              className={`absolute left-2 top-2 rounded px-2 py-0.5 text-xs font-semibold text-white ${region === "Mountain" ? "bg-brand-mountain" : "bg-brand-beach"}`}
            >
              {region}
            </span>
          )}
        </div>

        {/* Card body */}
        <div
          className={`flex flex-col gap-2 p-4 ${isHorizontal ? "w-[60%]" : ""} ${isCompact ? "p-3" : ""}`}
        >
          {/* Price */}
          <p data-testid="property-price" className="font-bold text-xl text-[--color-accent]">
            {price}
          </p>

          {/* Title */}
          <h3
            data-testid="property-title"
            className={`font-semibold text-sm leading-snug ${isCompact ? "line-clamp-1" : "line-clamp-2"}`}
          >
            {title}
          </h3>

          {/* Specs row */}
          <div
            data-testid="property-specs"
            className="flex flex-wrap gap-2 text-xs text-muted-foreground"
          >
            {!isLand && (
              <>
                <span>{property.bedrooms ?? "-"} bed</span>
                <span>·</span>
                <span>{property.bathrooms ?? "-"} bath</span>
                {(property.lotSizeM2 !== null || property.constructionM2 !== null) && (
                  <span>·</span>
                )}
              </>
            )}
            {property.lotSizeM2 !== null && <span>{formatArea(property.lotSizeM2)}</span>}
            {property.constructionM2 !== null && (
              <>
                <span>·</span>
                <span>{formatArea(property.constructionM2)} built</span>
              </>
            )}
          </div>

          {/* ZMT badge */}
          {zmtConfig && (
            <span
              data-testid="zmt-badge"
              className={`inline-flex w-fit items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${zmtConfig.classes}`}
            >
              <span aria-hidden="true">{zmtConfig.icon}</span>
              {zmtConfig.label}
            </span>
          )}
        </div>
      </Link>

      {/* Save button — absolute positioned top-right on image */}
      <div className="absolute right-2 top-2 z-10">
        <SaveButton propertyId={property.id} propertyTitle={title} />
      </div>

      {/* Footer CTA area: Save + Share */}
      <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-2">
        <SaveButton propertyId={property.id} propertyTitle={title} />
        <ShareButton slug={property.slug} title={title} locale={locale} />
      </div>
    </article>
  );
}
