/**
 * CommunityMiniMap — Server Component (Story 6.3)
 *
 * Renders a Mapbox Static Images API <img> showing:
 * - Community center pin marker
 * - Geo-fence polygon overlay (when geoFenceCoords is present)
 *
 * IMPORTANT: This is a Server Component — no "use client" directive.
 * Must NOT import interactive Mapbox GL libraries or any interactive map component.
 * The static <img> approach avoids the ~230KB interactive map bundle on community pages.
 *
 * @see _bmad-output/implementation-artifacts/6-3-community-mini-map-and-geo-fence-display.md
 */

import { getTranslations } from "next-intl/server";
import { buildCommunityMiniMapUrl } from "@/lib/map/static-map";
import type { Community } from "@/lib/db/schema/communities";

interface CommunityMiniMapProps {
  community: Community;
  areaName: string;
  locale: string;
}

/**
 * CommunityMiniMap — renders a static Mapbox map image for a community.
 *
 * Returns null when latitude/longitude are missing (graceful degradation).
 * Uses native <img> since the Mapbox CDN URL is an external image source.
 */
export async function CommunityMiniMap({ community, areaName, locale }: CommunityMiniMapProps) {
  // Graceful handling: if coordinates are missing, render nothing
  if (!community.latitude || !community.longitude) {
    return null;
  }

  const t = await getTranslations({ locale, namespace: "CommunityPage" });

  const staticMapUrl = buildCommunityMiniMapUrl({
    latitude: community.latitude,
    longitude: community.longitude,
    geoFenceCoords: community.geoFenceCoords as [number, number][] | null | undefined,
    communityName: community.name,
  });

  const altText = t("miniMap.alt", {
    community: community.name,
    area: areaName,
  });

  return (
    <section className="py-8 px-4 sm:px-6 lg:px-8">
      <figure
        data-testid="community-mini-map"
        className="mx-auto max-w-2xl overflow-hidden rounded-lg"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={staticMapUrl}
          alt={altText}
          loading="lazy"
          decoding="async"
          className="w-full h-auto aspect-[3/2]"
        />
        {!!community.geoFenceCoords && (
          <span
            data-testid="geo-fence-overlay"
            className="sr-only"
            aria-label={t("miniMap.geoFenceLabel")}
          >
            {t("miniMap.geoFenceLabel")}
          </span>
        )}
        <figcaption className="text-sm text-text-muted text-center mt-2">
          {t("miniMap.heading")}
        </figcaption>
      </figure>
    </section>
  );
}
