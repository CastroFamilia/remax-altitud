import { buildAreaThumbnailMapUrl } from "@/lib/map/static-map";

interface CommunityCardProps {
  name: string;
  tagline?: string;
  heroImageUrl?: string | null;
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
}

/**
 * CommunityCard — Server Component (AC #6, #7)
 *
 * Gold-bordered card linking to community page.
 * Displays hero image, name, tagline, price range, listing count,
 * and optional thumbnail mini-map when coordinates are available (Story 6.3, AC #3).
 */
export function CommunityCard({
  name,
  tagline,
  heroImageUrl,
  href,
  locale,
  priceMin,
  priceMax,
  listingCount,
  latitude,
  longitude,
  geoFenceCoords,
}: CommunityCardProps) {
  const linkHref = href ?? `/${locale}/communities`;

  const priceRange =
    priceMin && priceMax
      ? `$${(priceMin / 1000).toFixed(0)}K–$${(priceMax / 1000).toFixed(0)}K`
      : null;

  // Build thumbnail mini-map URL when coordinates are available (Story 6.3, AC #3)
  const thumbnailMapUrl =
    latitude && longitude
      ? buildAreaThumbnailMapUrl({
          latitude,
          longitude,
          geoFenceCoords,
        })
      : null;

  return (
    <a
      href={linkHref}
      className="group flex flex-col overflow-hidden rounded-[var(--radius-lg,12px)] border-2 border-[var(--color-gold,#C2A661)] bg-[var(--color-bg-white,#fff)] shadow-[var(--shadow-sm)] transition-all hover:shadow-[var(--shadow-lg)]"
      data-testid="community-card"
    >
      {/* Hero image */}
      <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
        {heroImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroImageUrl}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, var(--color-navy, #000E35) 0%, var(--color-gold, #C2A661) 100%)",
            }}
          >
            <span className="text-2xl font-bold text-white">{name.charAt(0) || "?"}</span>
          </div>
        )}
      </div>

      {/* Thumbnail mini-map — Story 6.3 AC #3 */}
      {thumbnailMapUrl && (
        <div className="px-2 pt-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbnailMapUrl}
            alt={`Location of ${name}`}
            loading="lazy"
            decoding="async"
            className="w-full h-auto aspect-[3/2] rounded-md"
          />
        </div>
      )}

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-bold text-brand-navy">{name}</h3>
        {tagline && <p className="mt-1 text-sm text-text-muted line-clamp-2">{tagline}</p>}
        {priceRange && (
          <p className="mt-2 text-sm font-semibold text-[var(--color-gold,#C2A661)]">
            {priceRange}
          </p>
        )}
        {typeof listingCount === "number" && listingCount > 0 && (
          <p className="mt-1 text-xs text-text-muted">
            {listingCount}{" "}
            {listingCount === 1
              ? locale === "es"
                ? "propiedad"
                : "listing"
              : locale === "es"
                ? "propiedades"
                : "listings"}
          </p>
        )}
      </div>
    </a>
  );
}
