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
import type { Community } from "@/lib/db/schema/communities";

interface BreadcrumbItem {
  name: string;
  href: string; // absolute URL
  position: number;
}

/**
 * Serialize a JSON-LD object for safe injection into an inline
 * <script type="application/ld+json"> tag.
 *
 * `JSON.stringify` alone does NOT escape `<`, `>`, or `&`, so a description
 * containing the literal substring `</script>` (or `<!--`, or `<![CDATA[`)
 * would allow the inline script to break out of its tag — even though the
 * source values originate from the RE/MAX CCA sync, property/agent text is
 * arbitrary free-form content.
 *
 * This helper escapes the dangerous HTML/JSON-script characters and the JS
 * line-terminator code points (U+2028, U+2029) as Unicode escapes. The
 * result is still valid JSON (parsers map `\u003c` back to `<`), but the
 * raw HTML cannot terminate the script tag or be parsed by the browser as
 * markup.
 */
const ESCAPES: Record<string, string> = {
  "<": "\\u003c",
  ">": "\\u003e",
  "&": "\\u0026",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029",
};

const ESCAPE_PATTERN = /[<>&\u2028\u2029]/g;

export function serializeJsonLd(value: object): string {
  return JSON.stringify(value).replace(ESCAPE_PATTERN, (ch) => ESCAPES[ch]);
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
    ...(area.latitude != null && area.longitude != null
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: area.latitude,
            longitude: area.longitude,
          },
        }
      : {}),
  };
}

/**
 * Generates Place JSON-LD structured data for community pages.
 * Returns Place schema with community's name, description, area context,
 * and containedInPlace relationship.
 * Used by community page (AC #12, Story 6.2).
 */
export function generateCommunityJsonLd(
  community: Community,
  area: Area,
  locale: string,
): Record<string, unknown> {
  const name = community.name;
  const description =
    locale === "es" ? community.descriptionEs : community.descriptionEn;
  const areaName = locale === "es" ? area.nameEs : area.nameEn;

  return {
    "@context": "https://schema.org",
    "@type": "Place",
    name,
    description: description?.slice(0, 300) || undefined,
    url: `${SITE_ORIGIN}/${locale}/areas/${area.slug}/communities/${community.slug}`,
    address: { "@type": "PostalAddress", addressCountry: "CR" },
    containedInPlace: {
      "@type": "Place",
      name: areaName,
      url: `${SITE_ORIGIN}/${locale}/areas/${area.slug}`,
    },
    ...(area.latitude != null && area.longitude != null
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: area.latitude,
            longitude: area.longitude,
          },
        }
      : {}),
  };
}
