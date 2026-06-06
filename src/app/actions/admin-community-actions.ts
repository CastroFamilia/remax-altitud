"use server";

import { revalidatePath } from "next/cache";
import { ilike, sql, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { communities } from "@/lib/db/schema/communities";
import { areas } from "@/lib/db/schema/areas";
import { verifyAdminAuth } from "@/lib/auth/admin";
import {
  createCommunity,
  updateCommunity,
  deleteCommunity,
  getCommunityById,
} from "@/lib/db/queries/communities";
import { updatePropertyCommunity, setCommunityProperties } from "@/lib/db/queries/properties";
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

export async function createCommunityAction(
  payload: NewCommunity & { associatedPropertyIds?: string[] },
): Promise<{ success: boolean; community?: Community; error?: string }> {
  try {
    await verifyAdminAuth();
    const { associatedPropertyIds, ...data } = payload;
    const community = await createCommunity(data as NewCommunity);
    if (associatedPropertyIds) {
      await setCommunityProperties(community.id, associatedPropertyIds);
    }
    triggerRevalidation();
    return { success: true, community };
  } catch (error) {
    console.error("Failed to create community:", error);
    const message = error instanceof Error ? error.message : String(error);
    if (
      message.includes("UNIQUE") ||
      message.includes("unique constraint") ||
      message.includes("slug")
    ) {
      return { success: false, error: "Slug already exists. Please choose a unique slug." };
    }
    return { success: false, error: message };
  }
}

export async function updateCommunityAction(
  id: string,
  payload: Partial<Community> & { associatedPropertyIds?: string[] },
): Promise<{ success: boolean; community?: Community; error?: string }> {
  try {
    await verifyAdminAuth();
    const { associatedPropertyIds, ...data } = payload;
    const community = await updateCommunity(id, data as Partial<Community>);
    if (associatedPropertyIds) {
      await setCommunityProperties(id, associatedPropertyIds);
    }
    triggerRevalidation();
    return { success: true, community };
  } catch (error) {
    console.error("Failed to update community:", error);
    const message = error instanceof Error ? error.message : String(error);
    if (
      message.includes("UNIQUE") ||
      message.includes("unique constraint") ||
      message.includes("slug")
    ) {
      return { success: false, error: "Slug already exists. Please choose a unique slug." };
    }
    return { success: false, error: message };
  }
}

export async function deleteCommunityAction(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await verifyAdminAuth();
    await deleteCommunity(id);
    triggerRevalidation();
    return { success: true };
  } catch (error) {
    console.error("Failed to delete community:", error);
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}

export async function updatePropertyCommunityAction(
  propertyId: string,
  communityId: string | null,
): Promise<{ success: boolean; error?: string }> {
  try {
    await verifyAdminAuth();
    if (communityId !== null) {
      const comm = await getCommunityById(communityId);
      if (!comm) {
        return { success: false, error: "Selected community does not exist." };
      }
    }
    await updatePropertyCommunity(propertyId, communityId);
    triggerRevalidation();
    return { success: true };
  } catch (error) {
    console.error("Failed to update property community override:", error);
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}
