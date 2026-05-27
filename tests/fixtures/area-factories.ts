/**
 * Shared test data factories for Area Guide tests.
 *
 * Extracted from individual spec files to avoid duplication and ensure
 * consistency across area-components.spec.tsx and area-queries.spec.ts.
 */

export function makeArea(overrides: Record<string, unknown> = {}) {
  return {
    id: "uuid-area-1",
    slug: "perez-zeledon",
    nameEn: "Pérez Zeledón",
    nameEs: "Pérez Zeledón",
    region: "Mountain",
    descriptionEn:
      "A lush mountain valley in southern Costa Rica, Pérez Zeledón offers a unique blend of tropical climate and mountain serenity. The area is known for its stunning landscapes, world-class birding, and proximity to national parks.",
    descriptionEs:
      "Un exuberante valle montañoso en el sur de Costa Rica, Pérez Zeledón ofrece una combinación única de clima tropical y serenidad montañosa.",
    heroImageUrl: "/images/areas/perez-zeledon-hero.webp",
    province: "San José",
    canton: "Pérez Zeledón",
    district: "San Isidro",
    latitude: 9.37,
    longitude: -83.7,
    propertyCount: 15,
    metadata: {
      elevation: "700m",
      climate: "Tropical humid",
      nearestAirport: "San José (SJO) — 3.5 hours",
      nearestHospital: "Hospital Escalante Pradilla — 15 min",
      nearestBeach: "Dominical — 45 min",
    },
    sortOrder: 1,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
  };
}

export function makeArea2(overrides: Record<string, unknown> = {}) {
  return makeArea({
    id: "uuid-area-2",
    slug: "dominical",
    nameEn: "Dominical",
    nameEs: "Dominical",
    region: "Coast",
    descriptionEn: "A vibrant surf town on the Pacific coast...",
    descriptionEs: "Un vibrante pueblo surfista en la costa del Pacífico...",
    propertyCount: 8,
    sortOrder: 2,
    ...overrides,
  });
}

export function makeArea3(overrides: Record<string, unknown> = {}) {
  return makeArea({
    id: "uuid-area-3",
    slug: "san-isidro",
    nameEn: "San Isidro",
    nameEs: "San Isidro",
    region: "Mountain",
    descriptionEn: "The commercial heart of the southern zone...",
    descriptionEs: "El corazón comercial de la zona sur...",
    propertyCount: 22,
    sortOrder: 3,
    ...overrides,
  });
}
