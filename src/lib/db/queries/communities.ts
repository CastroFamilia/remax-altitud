import "server-only";
import { and, asc, desc, eq, gt, not } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { communities } from "@/lib/db/schema/communities";
import { areas } from "@/lib/db/schema/areas";
import { properties } from "@/lib/db/schema/properties";
import { propertySearchColumns, mapPropertyRowToSearchItem } from "./properties";
import type { PropertySearchItem } from "@/types/search";

/**
 * Fetches all communities ordered by name ascending.
 * Used by community index page (AC #10) and generateStaticParams.
 */
export async function getAllCommunities() {
  return db.select().from(communities).orderBy(asc(communities.name));
}

/**
 * Fetches a single community by its slug and area slug.
 * Joins communities with areas to validate area-community relationship.
 * Returns null if not found.
 * Used by community page (AC #1).
 */
export async function getCommunityBySlugAndArea(communitySlug: string, areaSlug: string) {
  const rows = await db
    .select()
    .from(communities)
    .innerJoin(areas, eq(communities.areaId, areas.id))
    .where(and(eq(communities.slug, communitySlug), eq(areas.slug, areaSlug)))
    .limit(1);
  return rows[0]?.communities ?? null;
}

/**
 * Fetches all community-area slug pairs for SSG build-time generation.
 * Used by generateStaticParams (AC #9).
 */
export async function getAllCommunityParams() {
  const rows = await db
    .select({ community: communities.slug, slug: areas.slug })
    .from(communities)
    .innerJoin(areas, eq(communities.areaId, areas.id));
  return rows;
}

/**
 * Fetches visible properties filtered by community ID.
 * Returns PropertySearchItem[] compatible with PropertyCard.
 * Used by the Properties tab on community pages (AC #4).
 */
export async function getPropertiesByCommunityId(
  communityId: string,
): Promise<PropertySearchItem[]> {
  const rows = await db
    .select(propertySearchColumns)
    .from(properties)
    .where(and(eq(properties.communityId, communityId), eq(properties.isVisible, true)))
    .orderBy(desc(properties.syncedAt));
  return rows.map(mapPropertyRowToSearchItem);
}

/**
 * Fetches communities in the same area, excluding current community.
 * Used by SimilarCommunitiesSlider (AC #6).
 */
export async function getSimilarCommunities(areaId: string, excludeSlug: string) {
  return db
    .select()
    .from(communities)
    .where(and(eq(communities.areaId, areaId), not(eq(communities.slug, excludeSlug))))
    .orderBy(asc(communities.name));
}

/**
 * Fetches top communities by listing count for homepage featured section.
 * Used by FeaturedCommunities (AC #8).
 */
export async function getFeaturedCommunities(limit = 3) {
  return db
    .select()
    .from(communities)
    .where(gt(communities.listingCount, 0))
    .orderBy(desc(communities.listingCount))
    .limit(limit);
}

/**
 * Fetches communities belonging to an area.
 * Used by area guide page to populate community cards (AC #7).
 */
export async function getCommunitiesByAreaId(areaId: string) {
  return db
    .select()
    .from(communities)
    .where(eq(communities.areaId, areaId))
    .orderBy(asc(communities.name));
}
