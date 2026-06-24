import "server-only";
import { and, asc, desc, eq, gte, not } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { communities } from "@/lib/db/schema/communities";
import { areas } from "@/lib/db/schema/areas";
import { properties } from "@/lib/db/schema/properties";
import { propertySearchColumns, mapPropertyRowToSearchItem } from "./properties";
import type { PropertySearchItem } from "@/types/search";
import type { NewCommunity, Community } from "@/lib/db/schema/communities";
import { sql } from "drizzle-orm";

/**
 * Fetches all communities ordered by name ascending.
 * Used by community index page (AC #10) and generateStaticParams.
 */
export async function getAllCommunities() {
  try {
    return await db.select().from(communities).orderBy(asc(communities.name));
  } catch (error) {
    console.error("Database query failed in getAllCommunities:", error);
    return [];
  }
}

/**
 * Fetches a single community by its slug and area slug.
 * Joins communities with areas to validate area-community relationship.
 * Returns null if not found.
 * Used by community page (AC #1).
 */
export async function getCommunityBySlugAndArea(communitySlug: string, areaSlug: string) {
  try {
    const rows = await db
      .select()
      .from(communities)
      .innerJoin(areas, eq(communities.areaId, areas.id))
      .where(and(eq(communities.slug, communitySlug), eq(areas.slug, areaSlug)))
      .limit(1);
    return rows[0]?.communities ?? null;
  } catch (error) {
    console.error("Database query failed in getCommunityBySlugAndArea:", error);
    return null;
  }
}

/**
 * Fetches all community-area slug pairs for SSG build-time generation.
 * Used by generateStaticParams (AC #9).
 */
export async function getAllCommunityParams() {
  try {
    const rows = await db
      .select({ community: communities.slug, slug: areas.slug })
      .from(communities)
      .innerJoin(areas, eq(communities.areaId, areas.id));
    return rows;
  } catch (error) {
    console.error("Database query failed in getAllCommunityParams:", error);
    return [];
  }
}

/**
 * Fetches visible properties filtered by community ID.
 * Returns PropertySearchItem[] compatible with PropertyCard.
 * Used by the Properties tab on community pages (AC #4).
 */
export async function getPropertiesByCommunityId(
  communityId: string,
): Promise<PropertySearchItem[]> {
  try {
    const rows = await db
      .select(propertySearchColumns)
      .from(properties)
      .where(and(eq(properties.communityId, communityId), eq(properties.isVisible, true)))
      .orderBy(desc(properties.syncedAt));
    return rows.map(mapPropertyRowToSearchItem);
  } catch (error) {
    console.error("Database query failed in getPropertiesByCommunityId:", error);
    return [];
  }
}

/**
 * Fetches communities in the same area, excluding current community.
 * Falls back to communities from other areas when none exist in the same area.
 * Used by SimilarCommunitiesSlider (AC #6).
 */
export async function getSimilarCommunities(areaId: string, excludeSlug: string) {
  try {
    const sameArea = await db
      .select()
      .from(communities)
      .where(and(eq(communities.areaId, areaId), not(eq(communities.slug, excludeSlug))))
      .orderBy(asc(communities.name));

    if (sameArea.length > 0) {
      return { communities: sameArea, isFallback: false, fallbackAreaMap: null };
    }

    // Fallback: show communities from other areas, joining to get area info
    const rows = await db
      .select({
        community: communities,
        areaSlug: areas.slug,
        areaNameEn: areas.nameEn,
        areaNameEs: areas.nameEs,
      })
      .from(communities)
      .innerJoin(areas, eq(communities.areaId, areas.id))
      .where(not(eq(communities.slug, excludeSlug)))
      .orderBy(asc(communities.name))
      .limit(6);

    // Build a map from community slug → { areaSlug, areaName }
    const fallbackAreaMap: Record<
      string,
      { areaSlug: string; areaNameEn: string; areaNameEs: string }
    > = {};
    for (const row of rows) {
      fallbackAreaMap[row.community.slug] = {
        areaSlug: row.areaSlug,
        areaNameEn: row.areaNameEn,
        areaNameEs: row.areaNameEs,
      };
    }

    return {
      communities: rows.map((r) => r.community),
      isFallback: true,
      fallbackAreaMap,
    };
  } catch (error) {
    console.error("Database query failed in getSimilarCommunities:", error);
    return { communities: [], isFallback: false, fallbackAreaMap: null };
  }
}

/**
 * Fetches top communities by listing count for homepage featured section.
 * Used by FeaturedCommunities (AC #8).
 */
export async function getFeaturedCommunities(limit = 3) {
  try {
    return await db
      .select()
      .from(communities)
      .where(gte(communities.listingCount, 0))
      .orderBy(desc(communities.listingCount), desc(communities.createdAt))
      .limit(limit);
  } catch (error) {
    console.error("Database query failed in getFeaturedCommunities:", error);
    return [];
  }
}

/**
 * Fetches communities belonging to an area.
 * Used by area guide page to populate community cards (AC #7).
 */
export async function getCommunitiesByAreaId(areaId: string) {
  try {
    return await db
      .select()
      .from(communities)
      .where(eq(communities.areaId, areaId))
      .orderBy(asc(communities.name));
  } catch (error) {
    console.error("Database query failed in getCommunitiesByAreaId:", error);
    return [];
  }
}

export async function createCommunity(data: NewCommunity) {
  const rows = await db.insert(communities).values(data).returning();
  return rows[0];
}

export async function updateCommunity(id: string, data: Partial<Community>) {
  const rows = await db
    .update(communities)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(communities.id, id))
    .returning();
  return rows[0];
}

export async function deleteCommunity(id: string) {
  return db.transaction(async (tx) => {
    await tx.update(properties).set({ communityId: null }).where(eq(properties.communityId, id));

    return tx.delete(communities).where(eq(communities.id, id));
  });
}

export async function getCommunityById(id: string) {
  try {
    const rows = await db.select().from(communities).where(eq(communities.id, id)).limit(1);
    return rows[0] ?? null;
  } catch (error) {
    console.error("Database query failed in getCommunityById:", error);
    return null;
  }
}

export async function getCommunityBySlug(slug: string) {
  try {
    const rows = await db.select().from(communities).where(eq(communities.slug, slug)).limit(1);
    return rows[0] ?? null;
  } catch (error) {
    console.error("Database query failed in getCommunityBySlug:", error);
    return null;
  }
}

/**
 * Updates the denormalized `listing_count` on every community row to reflect
 * the current count of active (is_visible=true) properties assigned to them.
 */
export async function updateCommunityListingCounts(): Promise<void> {
  await db.execute(
    sql`UPDATE communities
        SET listing_count = (
          SELECT count(*)::integer
          FROM properties
          WHERE properties.community_id = communities.id
            AND properties.is_visible = true
        )`,
  );
}

export { sortCommunitiesCustom } from "@/lib/community/sort";
