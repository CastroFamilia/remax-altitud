/**
 * JSON-LD structured data generator functions — Task 1 (Story 4.4)
 *
 * All generators run server-side only (RSC / page context).
 * SITE_ORIGIN is imported from constants.ts (single source of truth).
 */

import "server-only";

import { SITE_ORIGIN } from "@/lib/seo/constants";
import type { Property } from "@/lib/db/schema/properties";
import type { Agent } from "@/lib/db/schema/agents";
import type { Area } from "@/lib/db/schema/areas";

interface BreadcrumbItem {
  name: string;
  href: string; // absolute URL
  position: number;
}

/**
 * Generates RealEstateListing JSON-LD structured data for a property listing.
 * Required fields: @type, price, address, geo, image, description (AC #1, 4.4-UNIT-001)
 */
export function generateListingJsonLd(property: Property, locale: string): object {
  const title = locale === "es" ? property.titleEs : property.titleEn;
  const description = locale === "es" ? property.descriptionEs : property.descriptionEn;
  const images = (property.images as unknown as { src: string }[]) ?? [];

  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: title,
    description: description.slice(0, 500) || undefined,
    url: `${SITE_ORIGIN}/${locale}/property/${property.slug}`,
    image: images.slice(0, 5).map((img) => img.src),
    price: property.priceUsd,
    priceCurrency: "USD",
    // numberOfRooms uses bedrooms per Schema.org convention
    numberOfRooms: property.bedrooms ?? undefined,
    floorSize: property.constructionM2
      ? {
          "@type": "QuantitativeValue",
          value: property.constructionM2,
          unitCode: "MTK",
        }
      : undefined,
    geo:
      property.latitude != null && property.longitude != null
        ? {
            "@type": "GeoCoordinates",
            latitude: property.latitude,
            longitude: property.longitude,
          }
        : undefined,
    address: {
      "@type": "PostalAddress",
      addressCountry: "CR",
      addressRegion: property.areaSlug ?? undefined,
    },
  };
}

/**
 * Generates RealEstateAgent JSON-LD structured data for an agent profile.
 * Required fields: @type, name, image, telephone, areaServed (AC #2, 4.4-UNIT-002)
 *
 * `areaServedName` is the localized region label (e.g. "Southern Zone, Costa Rica"
 * for EN, "Zona Sur, Costa Rica" for ES). Defaults to the EN label so callers
 * that omit it remain backwards-compatible, but page integrations should pass
 * the translation from the `AgentAreaServed.name` namespace.
 */
export function generateAgentJsonLd(
  agent: Agent,
  locale: string,
  areaServedName: string = "Southern Zone, Costa Rica",
): object {
  const bio = locale === "es" ? agent.bioEs : agent.bioEn;

  return {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: agent.name,
    description: bio.slice(0, 300) || undefined,
    url: `${SITE_ORIGIN}/${locale}/agents/${agent.slug}`,
    image: agent.photoOptimizedUrl ?? agent.photoUrl ?? undefined,
    telephone: agent.phone ?? undefined,
    email: agent.email ?? undefined,
    areaServed: {
      "@type": "Place",
      name: areaServedName,
      addressCountry: "CR",
    },
  };
}

/**
 * Generates BreadcrumbList JSON-LD structured data.
 * Required fields: @type: BreadcrumbList, itemListElement with hierarchy (AC #4, 4.4-UNIT-005)
 */
export function generateBreadcrumbJsonLd(items: BreadcrumbItem[]): object {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item) => ({
      "@type": "ListItem",
      position: item.position,
      name: item.name,
      item: item.href,
    })),
  };
}

/**
 * Generates Place JSON-LD structured data for area guide pages.
 * Area pages are Epic 6 scope — this generator is created now so it's ready.
 * Do NOT add to area pages in this story (AC #3).
 */
export function generatePlaceJsonLd(area: Area, locale: string): object {
  const name = locale === "es" ? area.nameEs : area.nameEn;
  const description = locale === "es" ? area.descriptionEs : area.descriptionEn;

  return {
    "@context": "https://schema.org",
    "@type": "Place",
    name,
    description: description?.slice(0, 300) || undefined,
    url: `${SITE_ORIGIN}/${locale}/areas/${area.slug}`,
    address: { "@type": "PostalAddress", addressCountry: "CR" },
  };
}
