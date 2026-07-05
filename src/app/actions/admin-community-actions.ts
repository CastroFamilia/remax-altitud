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
import { updatePropertyCommunity } from "@/lib/db/queries/properties";
import { updateCommunityListingCounts } from "@/lib/db/queries/communities";
import type { NewCommunity, Community } from "@/lib/db/schema/communities";
import { optimizeCommunityImage } from "@/lib/sync/image-optimizer";

async function triggerRevalidation(areaSlug?: string, communitySlug?: string) {
  revalidatePath("/[locale]/communities");
  revalidatePath("/[locale]/areas/[slug]/communities/[community]");
  revalidatePath("/[locale]/areas/[slug]");
  revalidatePath("/[locale]/search");
  revalidatePath("/[locale]/properties/[slug]");
  revalidatePath("/[locale]/property/[slug]");

  if (areaSlug && communitySlug) {
    revalidatePath(`/en/areas/${areaSlug}/communities/${communitySlug}`);
    revalidatePath(`/es/areas/${areaSlug}/communities/${communitySlug}`);
    revalidatePath(`/en/areas/${areaSlug}`);
    revalidatePath(`/es/areas/${areaSlug}`);
  }
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
  data: NewCommunity,
): Promise<{ success: boolean; community?: Community; error?: string }> {
  try {
    await verifyAdminAuth();

    // Optimize images if URLs are provided
    if (data.heroImageUrl) {
      const optimized = await optimizeCommunityImage(
        data.slug,
        data.heroImageUrl,
        "hero",
        data.name,
      );
      data.heroImage = optimized;
    }
    if (data.siteMapImageUrl) {
      const optimized = await optimizeCommunityImage(
        data.slug,
        data.siteMapImageUrl,
        "sitemap",
        data.name,
      );
      data.siteMapImage = optimized;
    }

    const community = await createCommunity(data);

    // Fetch area slug for precise revalidation
    const areaRows = await db
      .select({ slug: areas.slug })
      .from(areas)
      .where(eq(areas.id, community.areaId))
      .limit(1);
    const areaSlug = areaRows[0]?.slug;

    await triggerRevalidation(areaSlug, community.slug);
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
  data: Partial<Community>,
): Promise<{ success: boolean; community?: Community; error?: string }> {
  try {
    await verifyAdminAuth();

    // Fetch existing community to compare URLs
    const existing = await getCommunityById(id);
    if (!existing) {
      return { success: false, error: "Community not found" };
    }

    const name = data.name ?? existing.name;
    const slug = data.slug ?? existing.slug;

    // Check hero image changes
    if (data.heroImageUrl !== undefined) {
      if (data.heroImageUrl === null || data.heroImageUrl.trim() === "") {
        data.heroImage = null;
      } else if (data.heroImageUrl !== existing.heroImageUrl) {
        const optimized = await optimizeCommunityImage(slug, data.heroImageUrl, "hero", name);
        data.heroImage = optimized;
      }
    }

    // Check site map image changes
    if (data.siteMapImageUrl !== undefined) {
      if (data.siteMapImageUrl === null || data.siteMapImageUrl.trim() === "") {
        data.siteMapImage = null;
      } else if (data.siteMapImageUrl !== existing.siteMapImageUrl) {
        const optimized = await optimizeCommunityImage(slug, data.siteMapImageUrl, "sitemap", name);
        data.siteMapImage = optimized;
      }
    }

    const community = await updateCommunity(id, data);

    // Fetch area slug for precise revalidation
    const areaRows = await db
      .select({ slug: areas.slug })
      .from(areas)
      .where(eq(areas.id, community.areaId))
      .limit(1);
    const areaSlug = areaRows[0]?.slug;

    await triggerRevalidation(areaSlug, community.slug);
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

    // Fetch community and area slug before deletion for revalidation
    const community = await getCommunityById(id);
    let areaSlug: string | undefined;
    if (community) {
      const areaRows = await db
        .select({ slug: areas.slug })
        .from(areas)
        .where(eq(areas.id, community.areaId))
        .limit(1);
      areaSlug = areaRows[0]?.slug;
    }

    await deleteCommunity(id);

    if (community && areaSlug) {
      await triggerRevalidation(areaSlug, community.slug);
    } else {
      await triggerRevalidation();
    }
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
    let areaSlug: string | undefined;
    let communitySlug: string | undefined;

    if (communityId !== null) {
      const comm = await getCommunityById(communityId);
      if (!comm) {
        return { success: false, error: "Selected community does not exist." };
      }
      communitySlug = comm.slug;

      const areaRows = await db
        .select({ slug: areas.slug })
        .from(areas)
        .where(eq(areas.id, comm.areaId))
        .limit(1);
      areaSlug = areaRows[0]?.slug;
    }

    await updatePropertyCommunity(propertyId, communityId);
    await updateCommunityListingCounts();

    await triggerRevalidation(areaSlug, communitySlug);
    return { success: true };
  } catch (error) {
    console.error("Failed to update property community override:", error);
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}
