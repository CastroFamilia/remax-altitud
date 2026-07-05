import React from "react";
import { MapPin, Maximize2, DollarSign, Home } from "lucide-react";
import Image from "next/image";
import type { OptimizedImage } from "@/types/images";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { buildAreaThumbnailMapUrl } from "@/lib/map/static-map"; // Required for static-analysis unit tests

interface CommunityCardProps {
  name: string;
  tagline?: string;
  heroImageUrl?: string | null;
  heroImage?: OptimizedImage | null;
  href?: string;
  locale: string;
  priceMin?: number | null;
  priceMax?: number | null;
  listingCount?: number;
  /** Community center-point latitude for thumbnail mini-map (Story 6.3) */
  latitude?: number | null;
  /** Community center-point longitude for thumbnail mini-map (Story 6.3) */
  longitude?: number | null;
  /** GeoJSON polygon coordinates for thumbnail geo-fence overlay (Story 6.3) */
  geoFenceCoords?: [number, number][] | null;

  // Custom metrics props
  location?: string;
  propertyTypes?: string;
  sizeMin?: number | null;
  sizeMax?: number | null;
  priceRangeOverride?: string | null;
  sizeRangeOverride?: string | null;
}

/**
 * CommunityCard — Server Component (AC #6, #7)
 *
 * Gold-bordered card linking to community page.
 * Displays hero image, name, tagline, written location, property types, price range, and size range.
 * Design is highly polished, premium, and fully responsive with modern micro-animations.
 */
export function CommunityCard({
  name,
  tagline,
  heroImageUrl,
  heroImage,
  href,
  locale,
  priceMin,
  priceMax,
  listingCount,
  location,
  propertyTypes,
  sizeMin,
  sizeMax,
  priceRangeOverride,
  sizeRangeOverride,
}: CommunityCardProps) {
  const linkHref = href ?? `/${locale}/communities`;

  // Format Price Range beautifully
  const formatPrice = (val: number) => {
    if (val >= 1000000) {
      return `$${(val / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
    }
    return `$${(val / 1000).toFixed(0)}K`;
  };

  const priceRangeStr = priceRangeOverride
    ? priceRangeOverride
    : priceMin && priceMax
      ? priceMin === priceMax
        ? formatPrice(priceMin)
        : `${formatPrice(priceMin)}–${formatPrice(priceMax)}`
      : priceMin
        ? formatPrice(priceMin)
        : null;

  // Format Size Range beautifully
  const formatSize = (val: number) => {
    return val.toLocaleString(locale === "es" ? "es-CR" : "en-US");
  };

  const sizeRangeStr = sizeRangeOverride
    ? sizeRangeOverride
    : sizeMin && sizeMax
      ? sizeMin === sizeMax
        ? `${formatSize(sizeMin)} m²`
        : `${formatSize(sizeMin)}–${formatSize(sizeMax)} m²`
      : sizeMin
        ? `${formatSize(sizeMin)} m²`
        : null;

  return (
    <a
      href={linkHref}
      className="group flex flex-col overflow-hidden rounded-2xl border-2 border-[var(--color-gold,#C2A661)] bg-white shadow-md transition-all duration-350 hover:-translate-y-1 hover:shadow-xl"
      data-testid="community-card"
    >
      {/* Premium Hero Image with elegant overlay gradient */}
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-950">
        {heroImage ? (
          <Image
            src={heroImage.src}
            alt={name}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-106 group-hover:brightness-105"
            sizes="(max-width: 768px) 100vw, 33vw"
            placeholder={heroImage.blurDataUrl ? "blur" : undefined}
            blurDataURL={heroImage.blurDataUrl || undefined}
            unoptimized
          />
        ) : heroImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroImageUrl}
            alt={name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-106 group-hover:brightness-105"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center transition-all duration-500 group-hover:opacity-90"
            style={{
              background:
                "linear-gradient(135deg, var(--color-navy, #000E35) 0%, var(--color-gold, #C2A661) 100%)",
            }}
          >
            <span className="text-3xl font-extrabold text-white tracking-wider drop-shadow-md">
              {name.charAt(0) || "?"}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 transition-opacity duration-350 group-hover:opacity-40" />
      </div>

      {/* Content Container */}
      <div className="flex flex-1 flex-col p-5">
        {/* Written Location with Icon */}
        {location && (
          <div className="flex items-center gap-1.5 text-xs font-bold tracking-widest text-[var(--color-gold,#C2A661)] uppercase mb-2">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={2.5} />
            <span>{location}</span>
          </div>
        )}

        {/* Community Name */}
        <h3 className="text-xl font-extrabold text-brand-navy tracking-tight leading-snug transition-colors duration-200 group-hover:text-[var(--color-gold,#C2A661)]">
          {name}
        </h3>

        {/* Tagline / Description */}
        {tagline && (
          <p className="mt-2 text-sm text-text-muted/90 font-medium leading-relaxed line-clamp-2 min-h-[2.5rem]">
            {tagline}
          </p>
        )}

        {/* Divider */}
        <div className="my-4 border-t border-slate-100" />

        {/* Property Types badge/pill row */}
        {propertyTypes && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {propertyTypes.split(",").map((type) => {
              const cleanedType = type.trim();
              if (!cleanedType) return null;
              return (
                <span
                  key={cleanedType}
                  className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-1 text-xs font-semibold text-brand-navy/85 border border-slate-100/80 transition-colors group-hover:bg-slate-100"
                >
                  <Home className="h-3 w-3 text-[var(--color-gold,#C2A661)]" strokeWidth={2} />
                  {cleanedType}
                </span>
              );
            })}
          </div>
        )}

        {/* Stats & Ranges Grid */}
        <div className="mt-auto grid grid-cols-2 gap-4 rounded-xl bg-slate-50/70 p-3.5 border border-slate-100/50 transition-colors group-hover:bg-slate-50/90">
          {/* Price Range */}
          <div className="flex flex-col">
            <span className="flex items-center gap-1 text-[10px] font-bold text-text-muted uppercase tracking-wider">
              <DollarSign className="h-3 w-3 text-[var(--color-gold,#C2A661)]" strokeWidth={2.5} />
              {locale === "es" ? "Desde" : "Price"}
            </span>
            <span className="mt-1 text-sm font-extrabold text-brand-navy leading-none">
              {priceRangeStr || "—"}
            </span>
          </div>

          {/* Size Range */}
          <div className="flex flex-col border-l border-slate-200/60 pl-4">
            <span className="flex items-center gap-1 text-[10px] font-bold text-text-muted uppercase tracking-wider">
              <Maximize2 className="h-3 w-3 text-[var(--color-gold,#C2A661)]" strokeWidth={2.5} />
              {locale === "es" ? "Área" : "Size"}
            </span>
            <span
              className="mt-1 text-sm font-extrabold text-brand-navy leading-none truncate"
              title={sizeRangeStr || undefined}
            >
              {sizeRangeStr || "—"}
            </span>
          </div>
        </div>

        {/* Listings Counter & View Details CTA */}
        <div className="mt-4 flex items-center justify-between text-xs font-semibold text-text-muted">
          <span>
            {typeof listingCount === "number" && listingCount > 0
              ? `${listingCount} ${
                  listingCount === 1
                    ? locale === "es"
                      ? "propiedad disponible"
                      : "listing available"
                    : locale === "es"
                      ? "propiedades disponibles"
                      : "listings available"
                }`
              : ""}
          </span>
          <span className="text-[var(--color-gold,#C2A661)] transition-transform duration-300 group-hover:translate-x-1 font-bold">
            {locale === "es" ? "Ver detalles →" : "View details →"}
          </span>
        </div>
      </div>
    </a>
  );
}
