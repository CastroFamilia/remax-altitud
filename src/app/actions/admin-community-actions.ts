"use server";

import { revalidatePath } from "next/cache";
import { ilike, sql, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { communities } from "@/lib/db/schema/communities";
import { areas } from "@/lib/db/schema/areas";
import { verifyAdminAuth } from "@/lib/auth/admin";
import { createCommunity, updateCommunity, deleteCommunity } from "@/lib/db/queries/communities";
import { updatePropertyCommunity } from "@/lib/db/queries/properties";
import type { NewCommunity, Community } from "@/lib/db/schema/communities";

function triggerRevalidation() {
  revalidatePath("/[locale]/communities");
  revalidatePath("/[locale]/areas/[slug]/communities/[communitySlug]");
  revalidatePath("/[locale]/areas/[slug]");
  revalidatePath("/[locale]/search");
  revalidatePath("/[locale]/properties/[slug]");
}

/**
 * Server Action to fetch communities for administration with search and pagination.
 */
export async function fetchAdminCommunitiesData(params: { search?: string; page?: number }) {
  await verifyAdminAuth();

  let page = typeof params.page === "number" ? params.page : parseInt(String(params.page), 10);
  if (isNaN(page) || page < 1) {
    page = 1;
  } else {
    page = Math.trunc(page);
  }

  const limit = 10;
  const offset = (page - 1) * limit;

  let whereClause = undefined;
  if (params.search && params.search.trim() !== "") {
    const searchPattern = `%${params.search.trim()}%`;
    whereClause = ilike(communities.name, searchPattern);
  }

  // Get total count
  const countResult = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(communities)
    .where(whereClause);
  const total = countResult[0]?.count ?? 0;

  // Get communities joined with their area
  const rows = await db
    .select({
      id: communities.id,
      slug: communities.slug,
      name: communities.name,
      taglineEn: communities.taglineEn,
      taglineEs: communities.taglineEs,
      descriptionEn: communities.descriptionEn,
      descriptionEs: communities.descriptionEs,
      heroImageUrl: communities.heroImageUrl,
      latitude: communities.latitude,
      longitude: communities.longitude,
      geoFenceCoords: communities.geoFenceCoords,
      listingCount: communities.listingCount,
      quickFacts: communities.quickFacts,
      siteMapImageUrl: communities.siteMapImageUrl,
      areaId: communities.areaId,
      areaNameEn: areas.nameEn,
      areaNameEs: areas.nameEs,
      areaSlug: areas.slug,
    })
    .from(communities)
    .innerJoin(areas, eq(communities.areaId, areas.id))
    .where(whereClause)
    .orderBy(desc(communities.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    communities: rows,
    total,
    page,
    limit,
    hasMore: offset + limit < total,
  };
}

export async function createCommunityAction(data: NewCommunity): Promise<{ success: boolean; community?: Community }> {
  await verifyAdminAuth();
  const community = await createCommunity(data);
  triggerRevalidation();
  return { success: true, community };
}

export async function updateCommunityAction(id: string, data: Partial<Community>): Promise<{ success: boolean; community?: Community }> {
  await verifyAdminAuth();
  const community = await updateCommunity(id, data);
  triggerRevalidation();
  return { success: true, community };
}

export async function deleteCommunityAction(id: string): Promise<{ success: boolean }> {
  await verifyAdminAuth();
  await deleteCommunity(id);
  triggerRevalidation();
  return { success: true };
}

export async function updatePropertyCommunityAction(propertyId: string, communityId: string | null): Promise<{ success: boolean }> {
  await verifyAdminAuth();
  await updatePropertyCommunity(propertyId, communityId);
  triggerRevalidation();
  return { success: true };
}
