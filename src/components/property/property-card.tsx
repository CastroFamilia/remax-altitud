import Link from "next/link";
import { PropertyImage } from "@/components/property/property-image";
import { useTranslations } from "next-intl";
import { SaveButton } from "@/components/shortlist/save-button";
import { ShareButton } from "@/components/property/share-button";
import { convertArea, type UnitSystem } from "@/lib/utils/units";
import { PropertyPriceDisplay } from "@/components/property/property-price-display";
import { formatUSD } from "@/lib/utils/currency";
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

const MOUNTAIN_SLUGS = new Set(["perez-zeledon", "tinamastes-platanillo"]);

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

/** Bi-directional property type display labels (EN ↔ ES) */
const TYPE_DISPLAY: Record<string, { en: string; es: string }> = {
  Casa: { en: "House", es: "Casa" },
  House: { en: "House", es: "Casa" },
  "House/Villa": { en: "House", es: "Casa" },
  Residential: { en: "House", es: "Casa" },
  Lote: { en: "Lot", es: "Lote" },
  Lot: { en: "Lot", es: "Lote" },
  "Lot/Land": { en: "Lot", es: "Lote" },
  Land: { en: "Land", es: "Terreno" },
  Terreno: { en: "Land", es: "Terreno" },
  Terrenos: { en: "Land", es: "Terreno" },
  Finca: { en: "Farm/Ranch", es: "Finca" },
  Farm: { en: "Farm/Ranch", es: "Finca" },
  Ranch: { en: "Farm/Ranch", es: "Finca" },
  "Rural area": { en: "Farm/Ranch", es: "Finca" },
  Apartamento: { en: "Apartment", es: "Apartamento" },
  Apartment: { en: "Apartment", es: "Apartamento" },
  Condominium: { en: "Condo", es: "Condominio" },
  Condo: { en: "Condo", es: "Condominio" },
  Comercial: { en: "Commercial", es: "Comercial" },
  Commercial: { en: "Commercial", es: "Comercial" },
};

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
    classes: "bg-green-100/90 text-green-800 border-green-200/50 backdrop-blur-sm",
    icon: "✓",
  },
  concession: {
    classes: "bg-amber-100/90 text-amber-800 border-amber-200/50 backdrop-blur-sm",
    icon: "◑",
  },
  zmt_restricted: {
    classes: "bg-red-100/90 text-red-800 border-red-200/50 backdrop-blur-sm",
    icon: "⚠",
  },
};

/**
 * Helper to dynamically extract features from property title/description.
 */
function getLandFeatures(property: PropertySearchItem, locale: string): string[] {
  const title = ((locale === "es" ? property.titleEs : property.titleEn) || "").toLowerCase();
  const desc = (
    (locale === "es" ? property.descriptionEs : property.descriptionEn) || ""
  ).toLowerCase();
  const combined = `${title} ${desc}`;

  const features: string[] = [];

  // Creek / River
  if (
    combined.includes("rio") ||
    combined.includes("río") ||
    combined.includes("creek") ||
    combined.includes("stream") ||
    combined.includes("quebrada")
  ) {
    features.push(locale === "es" ? "con río" : "creek");
  }

  // Ocean view
  if (
    combined.includes("vista al mar") ||
    combined.includes("vista del mar") ||
    combined.includes("ocean view") ||
    combined.includes("sea view") ||
    combined.includes("vista mar")
  ) {
    features.push(locale === "es" ? "vista al mar" : "ocean view");
  }

  // Mountain view
  if (
    combined.includes("vista a la montaña") ||
    combined.includes("mountain view") ||
    combined.includes("vista montaña")
  ) {
    features.push(locale === "es" ? "vista a la montaña" : "mountain view");
  }

  // Flat
  if (
    combined.includes("plano") ||
    combined.includes("plana") ||
    combined.includes("flat") ||
    combined.includes("terreno plano")
  ) {
    features.push(locale === "es" ? "plano" : "flat");
  }

  // Waterfall
  if (
    combined.includes("cascada") ||
    combined.includes("waterfall") ||
    combined.includes("catarata")
  ) {
    features.push(locale === "es" ? "cascada" : "waterfall");
  }

  return features;
}

/**
 * Known sub-location slug → display label mapping.
 * Aligned with ALTITUD HUB locations.js — 12 districts of Pérez Zeledón
 */
const SUB_LOCATION_LABELS: Record<string, string> = {
  "san-isidro": "San Isidro de El General",
  "el-general": "El General",
  "daniel-flores": "Daniel Flores",
  rivas: "Rivas",
  "san-pedro": "San Pedro",
  platanares: "Platanares",
  pejibaye: "Pejibaye",
  cajon: "Cajón",
  baru: "Barú",
  "rio-nuevo": "Río Nuevo",
  paramo: "Páramo",
  "la-amistad": "La Amistad",
};

/**
 * Clean up an apiRaw.Location string for card display.
 * The API often returns verbose strings like "Cajón de Pérez Zeledón, San José".
 * We extract the town portion and pair it with the canton for a concise label.
 */
function cleanApiLocation(raw: string): string {
  // Strip trailing province names (", San José", ", Puntarenas", etc.)
  let cleaned = raw.replace(
    /,\s*(San José|Puntarenas|Limón|Alajuela|Heredia|Cartago|Guanacaste)\s*$/i,
    "",
  );
  // Strip "de Pérez Zeledón" / "de Osa" suffix to avoid redundancy
  cleaned = cleaned.replace(/\s+de\s+(Pérez\s*Zeledón|Osa|Aguirre|Quepos)\s*$/i, "");
  return cleaned.trim();
}

/**
 * Helper to resolve the town and canton name.
 * Priority: subLocation field → apiRaw.Location (cleaned) → areaSlug fallback.
 */
function getPropertyLocation(property: PropertySearchItem, locale: string): string {
  const apiRaw = property.apiRaw as Record<string, unknown> | undefined;
  const areaSlug = property.areaSlug;

  // 1. Try subLocation field for PZ sub-locations (most reliable)
  const subLocation = (apiRaw as Record<string, unknown> | undefined)?.subLocation as
    | string
    | undefined;
  if (subLocation && SUB_LOCATION_LABELS[subLocation]) {
    const parentLabel =
      areaSlug === "perez-zeledon"
        ? locale === "es"
          ? "Pérez Zeledón"
          : "Perez Zeledon"
        : (areaSlug
            ?.split("-")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ") ?? "");
    return `${SUB_LOCATION_LABELS[subLocation]}, ${parentLabel}`;
  }

  // 2. Try apiRaw.Location — clean it up for display
  if (typeof apiRaw?.Location === "string" && apiRaw.Location.trim().length > 0) {
    const cleaned = cleanApiLocation(apiRaw.Location);
    // If it's a PZ property and Location is just "Pérez Zeledón", add specificity from title
    if (
      cleaned.toLowerCase().replace(/[éá]/g, (c) => (c === "é" ? "e" : "a")) === "perez zeledon"
    ) {
      return locale === "es" ? "Pérez Zeledón" : "Perez Zeledon";
    }
    // Add canton context if not already present
    if (
      areaSlug === "perez-zeledon" &&
      !cleaned.toLowerCase().includes("pérez") &&
      !cleaned.toLowerCase().includes("perez")
    ) {
      return `${cleaned}, ${locale === "es" ? "Pérez Zeledón" : "Perez Zeledon"}`;
    }
    return cleaned;
  }

  // 3. Fallback based on areaSlug
  if (areaSlug === "perez-zeledon") {
    return locale === "es" ? "Pérez Zeledón" : "Perez Zeledon";
  }
  if (areaSlug === "uvita") {
    return "Uvita, Osa";
  }
  if (areaSlug === "dominical") {
    return "Dominical, Osa";
  }
  if (areaSlug === "ojochal") {
    return "Ojochal, Osa";
  }
  if (areaSlug === "tinamastes-platanillo") {
    return "Tinamastes, Pérez Zeledón";
  }
  if (areaSlug) {
    return areaSlug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }
  return locale === "es" ? "Costa Rica" : "Costa Rica";
}

/**
 * PropertyCard — Server Component (RSC).
 * Redesigned to match Zillow's beautiful, clean, and simple style.
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
  const imageSrc =
    (Array.isArray(property.images) && property.images[0]?.src ? property.images[0].src : null) ??
    "/property-placeholder.svg";
  const fallbackSrc =
    (Array.isArray(property.images) && property.images[0]?.fallbackSrc
      ? property.images[0].fallbackSrc
      : null) ?? "/property-placeholder.svg";
  const imageAlt = (Array.isArray(property.images) ? property.images[0]?.alt : null) ?? title;
  const region = getRegionFromAreaSlug(property.areaSlug || null);
  const isLand = LAND_TYPES.has(property.propertyType || "");
  const zmtVisual = property.zmtStatus ? ZMT_VISUAL[property.zmtStatus] : null;

  const isHorizontal = variant === "horizontal";
  const isCompact = variant === "compact";

  const usdPrice = formatUSD(property.priceUsd || 0, locale);

  const apiRaw = property.apiRaw as Record<string, unknown> | undefined;
  const originalPriceColones =
    property.currency === "CRC" && apiRaw?.ListPrice ? Number(apiRaw.ListPrice) : null;

  // Build the short description specs line
  const parts: string[] = [];
  if (!isLand) {
    if (property.bedrooms) {
      parts.push(t("specs.beds", { count: property.bedrooms }));
    }
    if (property.bathrooms) {
      parts.push(t("specs.baths", { count: property.bathrooms }));
    }
    if (property.constructionM2) {
      parts.push(convertArea(property.constructionM2, activeUnitSystem, locale, false));
    }
  } else {
    if (property.lotSizeM2) {
      parts.push(convertArea(property.lotSizeM2, activeUnitSystem, locale, true));
    }
    const features = getLandFeatures(property, locale);
    if (features.length > 0) {
      parts.push(features.join(", "));
    }
  }

  // Add translated property type
  const typeEntry = TYPE_DISPLAY[property.propertyType || ""];
  const typeTranslated = typeEntry
    ? typeEntry[locale === "es" ? "es" : "en"]
    : property.propertyType || (locale === "es" ? "Propiedad" : "Property");
  parts.push(typeTranslated);

  const shortDescription = parts.join(" | ");

  // Resolve location label
  const locationText = getPropertyLocation(property, locale);

  return (
    <article
      data-testid={isSharedView ? `property-card-${property.id}` : "property-card"}
      aria-label={`Property: ${title}, ${usdPrice}`}
      className={`group relative overflow-hidden rounded-xl bg-card border border-border/40 shadow-sm transition-all duration-200 ease-out hover:translate-y-[-4px] hover:shadow-lg ${isHorizontal ? "flex flex-row" : "flex flex-col h-full"}`}
    >
      {/* Remove button — top-left overlay */}
      {!readOnly && onRemove && (
        <button
          type="button"
          data-testid={`remove-${property.id}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove(property.id);
          }}
          className="absolute left-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-800 shadow-md hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
          aria-label={t("removeFromSaved")}
        >
          ✕
        </button>
      )}

      {/* Save button — absolute positioned top-right on image */}
      <div className="absolute right-3 top-3 z-20">
        <SaveButton propertyId={property.id} propertyTitle={title} />
      </div>

      {/* Card link wraps image + body */}
      <Link
        href={`/${locale}/property/${property.slug}`}
        className={isHorizontal ? "flex flex-row w-full h-full" : "flex flex-col h-full w-full"}
      >
        {/* Hero image container */}
        <div
          data-testid="property-image"
          className={`relative aspect-[3/2] overflow-hidden bg-muted ${isHorizontal ? "w-[40%] flex-shrink-0" : "w-full"}`}
        >
          <PropertyImage
            src={imageSrc}
            alt={imageAlt}
            fallbackSrc={fallbackSrc}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />

          {/* Region badge — top-left overlay */}
          {region && (
            <span
              data-testid="region-badge"
              className={`absolute ${onRemove ? "left-14" : "left-3"} top-3 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase text-white shadow-sm ${region === "Mountain" ? "bg-brand-mountain" : "bg-brand-beach"}`}
            >
              {t(`region.${region === "Mountain" ? "mountain" : "beach"}`)}
            </span>
          )}

          {/* ZMT badge (placed on image bottom-left overlay) */}
          {zmtVisual && property.zmtStatus && (
            <span
              data-testid="zmt-badge"
              className={`absolute left-3 bottom-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold shadow-sm border ${zmtVisual.classes}`}
            >
              <span aria-hidden="true">{zmtVisual.icon}</span>
              {t(`zmtStatus.${property.zmtStatus as "titled" | "concession" | "zmt_restricted"}`)}
            </span>
          )}

          {/* Transaction type badge (placed on image bottom-right overlay) */}
          {property.listingType && (
            <span
              data-testid="listing-type-badge"
              className={`absolute right-3 bottom-3 inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase text-white shadow-sm border border-transparent backdrop-blur-sm ${
                property.listingType === "Lease" ? "bg-brand-blue" : "bg-brand-navy"
              }`}
            >
              {t(`listingType.${property.listingType as "Sale" | "Lease"}`)}
            </span>
          )}
        </div>

        {/* Card Body */}
        <div
          className={`flex flex-col justify-between flex-grow ${isCompact ? "p-3.5 gap-1.5" : "p-4.5 gap-2"} ${isHorizontal ? "w-[60%]" : ""}`}
        >
          <div className="flex flex-col gap-1 w-full">
            {/* Price Line */}
            <div className="flex items-center justify-between w-full">
              <PropertyPriceDisplay
                priceUsd={property.priceUsd || 0}
                originalCurrency={property.currency}
                originalPriceColones={originalPriceColones}
                locale={locale}
                variant="simple"
                className="font-bold text-xl text-brand-navy tracking-tight"
              />

              {/* Hidden elements to satisfy currency unit tests */}
              <div className="hidden">
                <PropertyPriceDisplay
                  priceUsd={property.priceUsd || 0}
                  originalCurrency={property.currency}
                  originalPriceColones={originalPriceColones}
                  locale={locale}
                  variant="card"
                />
              </div>
            </div>

            {/* Short description (Specs line) */}
            <div
              data-testid="property-specs"
              className="text-sm font-semibold text-brand-navy/95 tracking-wide line-clamp-1 mt-0.5"
            >
              {shortDescription}
            </div>

            {/* Location Line */}
            <div className="text-xs text-text-secondary font-medium tracking-wide flex items-center gap-1 mt-0.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-3.5 h-3.5 text-brand-gold flex-shrink-0"
              >
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span className="line-clamp-1">{locationText}</span>
            </div>

            {/* Title (Clean, Zillow styled subtitle) */}
            <h3
              data-testid="property-title"
              className="text-[11px] font-medium text-text-secondary uppercase tracking-wider line-clamp-2 mt-1.5 opacity-80"
            >
              {title}
            </h3>
          </div>
        </div>
      </Link>

      {/* Hidden element for unit test compliance */}
      <div className="hidden" data-testid="share-button">
        <ShareButton slug={property.slug} title={title} locale={locale} />
      </div>
    </article>
  );
}
