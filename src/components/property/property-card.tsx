import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { SaveButton } from "@/components/shortlist/save-button";
import { ShareButton } from "@/components/property/share-button";
import { convertArea, type UnitSystem } from "@/lib/utils/units";
import { formatUSD, formatEUR, isNonUSLocale } from "@/lib/utils/currency";
import type { PropertySearchItem } from "@/types/search";

interface PropertyCardProps {
  property: PropertySearchItem;
  locale: string;
  variant?: "default" | "compact" | "horizontal";
  unitSystem?: UnitSystem;
  onRemove?: (id: string) => void;
  isSharedView?: boolean;
  readOnly?: boolean;
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

// ZMT badge visual config (classes + icon only; labels resolved via i18n)
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

/**
 * PropertyCard — Server Component (RSC).
 * Architecture §8: PropertyCard (static data) → Server Component.
 * SaveButton and ShareButton are Client Component children.
 */
export function PropertyCard({
  property,
  locale,
  variant = "default",
  unitSystem,
  onRemove,
  isSharedView = false,
  readOnly = false,
}: PropertyCardProps) {
  const t = useTranslations("PropertyCard");
  const title = locale === "es" ? (property.titleEs ?? property.titleEn) : property.titleEn;
  const activeUnitSystem = unitSystem ?? "metric";
  const imageSrc = property.images[0]?.src ?? "/property-placeholder.svg";
  const imageAlt = property.images[0]?.alt ?? title;
  const region = getRegionFromAreaSlug(property.areaSlug);
  const isLand = LAND_TYPES.has(property.propertyType);
  const zmtVisual = property.zmtStatus ? ZMT_VISUAL[property.zmtStatus] : null;

  const isHorizontal = variant === "horizontal";
  const isCompact = variant === "compact";

  const usdPrice = formatUSD(property.priceUsd, locale);

  return (
    <article
      data-testid={isSharedView ? `property-card-${property.id}` : "property-card"}
      aria-label={`Property: ${title}, ${usdPrice}`}
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
              className={`absolute ${onRemove ? "left-12" : "left-2"} top-2 rounded px-2 py-0.5 text-xs font-semibold text-white ${region === "Mountain" ? "bg-brand-mountain" : "bg-brand-beach"}`}
            >
              {t(`region.${region === "Mountain" ? "mountain" : "beach"}`)}
            </span>
          )}
        </div>

        {/* Card body */}
        <div
          className={`flex flex-col gap-2 ${isCompact ? "p-3" : "p-4"} ${isHorizontal ? "w-[60%]" : ""}`}
        >
          {/* Price */}
          <p data-testid="property-price" className="font-bold text-xl text-[--color-accent]">
            {usdPrice}
          </p>
          {isNonUSLocale(locale) && (
            <p data-testid="property-price-eur" className="text-xs text-muted-foreground">
              ≈ {formatEUR(property.priceUsd, locale)}
            </p>
          )}

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
                <span>{t("specs.beds", { count: property.bedrooms ?? "-" })}</span>
                <span>·</span>
                <span>{t("specs.baths", { count: property.bathrooms ?? "-" })}</span>
                {(property.lotSizeM2 !== null || property.constructionM2 !== null) && (
                  <span>·</span>
                )}
              </>
            )}
            {property.lotSizeM2 !== null && (
              <span>
                {t("specs.lot", { size: convertArea(property.lotSizeM2, activeUnitSystem) })}
              </span>
            )}
            {property.constructionM2 !== null && (
              <>
                <span>·</span>
                <span>
                  {t("specs.built", {
                    size: convertArea(property.constructionM2, activeUnitSystem),
                  })}
                </span>
              </>
            )}
          </div>

          {/* ZMT badge */}
          {zmtVisual && property.zmtStatus && (
            <span
              data-testid="zmt-badge"
              className={`inline-flex w-fit items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${zmtVisual.classes}`}
            >
              <span aria-hidden="true">{zmtVisual.icon}</span>
              {t(`zmtStatus.${property.zmtStatus as "titled" | "concession" | "zmt_restricted"}`)}
            </span>
          )}
        </div>
      </Link>

      {/* Remove button — top-left overlay */}
      {onRemove && (
        <button
          type="button"
          data-testid={`remove-${property.id}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove(property.id);
          }}
          className="absolute left-2 top-2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-800 shadow-md hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
          aria-label={t("removeFromSaved")}
        >
          ✕
        </button>
      )}

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
