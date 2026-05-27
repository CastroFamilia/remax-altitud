/**
 * Shared test data factories for Community Page tests (Story 6.2).
 *
 * Follows the same pattern as area-factories.ts for consistency.
 * Used by community-queries.spec.ts and community-components.spec.tsx.
 */

export interface CommunityQuickFacts {
  elevation?: string;
  airportDistance?: string;
  internet?: string;
  amenities?: string;
  developer?: string;
  established?: string;
}

export function makeCommunity(overrides: Record<string, unknown> = {}) {
  return {
    id: "uuid-community-1",
    slug: "rise",
    areaId: "uuid-area-1",
    name: "RISE",
    taglineEn: "Elevated Living in the Mountains",
    taglineEs: "Vida Elevada en las Montañas",
    descriptionEn:
      "RISE is a premium mountain development in Pérez Zeledón offering sustainable luxury living. Set atop a scenic ridge at 1,200m elevation, the community features panoramic valley views, fiber optic internet, and world-class amenities including a pool, gym, and nature trails. Developed by EcoVillas CR, RISE combines modern comfort with ecological responsibility.",
    descriptionEs:
      "RISE es un desarrollo premium de montaña en Pérez Zeledón que ofrece vida de lujo sostenible. Ubicado en lo alto de una cresta escénica a 1.200m de elevación, la comunidad cuenta con vistas panorámicas del valle, internet de fibra óptica y comodidades de clase mundial.",
    heroImageUrl: "/images/communities/rise-hero.webp",
    priceMinUsd: 180000,
    priceMaxUsd: 650000,
    listingCount: 12,
    quickFacts: {
      elevation: "1,200m",
      airportDistance: "2.5 hours to SJO",
      internet: "Fiber optic available",
      amenities: "Pool, Gym, Trails",
      developer: "EcoVillas CR",
      established: "2023",
    } as CommunityQuickFacts,
    siteMapImageUrl: "/images/communities/rise-sitemap.webp",
    /** Community center-point latitude for mini-map pin (Story 6.3) */
    latitude: 9.35,
    /** Community center-point longitude for mini-map pin (Story 6.3) */
    longitude: -83.65,
    /** GeoJSON polygon coordinates for display-only geo-fence overlay (Story 6.3) */
    geoFenceCoords: [
      [-83.655, 9.345],
      [-83.645, 9.345],
      [-83.645, 9.355],
      [-83.655, 9.355],
      [-83.655, 9.345],
    ] as [number, number][],
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
  };
}

export function makeCommunity2(overrides: Record<string, unknown> = {}) {
  return makeCommunity({
    id: "uuid-community-2",
    slug: "santa-elena-hills",
    areaId: "uuid-area-1",
    name: "Santa Elena Hills",
    taglineEn: "Your Hilltop Retreat",
    taglineEs: "Tu Retiro en la Colina",
    descriptionEn:
      "Santa Elena Hills is a boutique hilltop community offering panoramic views and a tranquil lifestyle. Each lot is designed to maximize natural beauty while maintaining privacy.",
    descriptionEs:
      "Santa Elena Hills es una comunidad boutique en la colina que ofrece vistas panorámicas y un estilo de vida tranquilo.",
    heroImageUrl: "/images/communities/santa-elena-hero.webp",
    priceMinUsd: 120000,
    priceMaxUsd: 450000,
    listingCount: 8,
    quickFacts: {
      elevation: "900m",
      airportDistance: "3 hours to SJO",
      internet: "Starlink available",
      amenities: "Clubhouse, Trails",
      developer: "Mountain Homes CR",
      established: "2024",
    } as CommunityQuickFacts,
    siteMapImageUrl: null,
    latitude: 9.28,
    longitude: -83.78,
    geoFenceCoords: [
      [-83.785, 9.275],
      [-83.775, 9.275],
      [-83.775, 9.285],
      [-83.785, 9.285],
      [-83.785, 9.275],
    ] as [number, number][],
    ...overrides,
  });
}

export function makeCommunity3(overrides: Record<string, unknown> = {}) {
  return makeCommunity({
    id: "uuid-community-3",
    slug: "serena-del-mar",
    areaId: "uuid-area-2",
    name: "Serena del Mar",
    taglineEn: "Ocean Breeze Living",
    taglineEs: "Vida con Brisa del Océano",
    descriptionEn:
      "Serena del Mar is a coastal development near Dominical offering surf-lifestyle living with modern amenities. Steps from the beach, each home captures ocean breezes and sunset views.",
    descriptionEs:
      "Serena del Mar es un desarrollo costero cerca de Dominical que ofrece un estilo de vida surfista con comodidades modernas.",
    heroImageUrl: null,
    priceMinUsd: 250000,
    priceMaxUsd: 800000,
    listingCount: 5,
    quickFacts: {
      elevation: "50m",
      airportDistance: "3.5 hours to SJO",
      internet: "Fiber optic available",
      amenities: "Beach Club, Pool",
      developer: "Pacific Dev Group",
      established: "2025",
    } as CommunityQuickFacts,
    siteMapImageUrl: "/images/communities/serena-sitemap.webp",
    latitude: 9.17,
    longitude: -83.75,
    geoFenceCoords: [
      [-83.755, 9.165],
      [-83.745, 9.165],
      [-83.745, 9.175],
      [-83.755, 9.175],
      [-83.755, 9.165],
    ] as [number, number][],
    ...overrides,
  });
}

/**
 * Create a community with zero properties and no hero image for edge-case testing.
 */
export function makeCommunityEmpty(overrides: Record<string, unknown> = {}) {
  return makeCommunity({
    id: "uuid-community-empty",
    slug: "empty-community",
    name: "Empty Community",
    heroImageUrl: null,
    priceMinUsd: null,
    priceMaxUsd: null,
    listingCount: 0,
    siteMapImageUrl: null,
    quickFacts: {} as CommunityQuickFacts,
    ...overrides,
  });
}
