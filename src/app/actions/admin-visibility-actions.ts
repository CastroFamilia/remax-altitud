"use server";

import { updatePropertyVisibility } from "@/lib/db/queries/properties";
import { revalidatePath } from "next/cache";
import { and, or, ilike, eq, sql, desc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { properties } from "@/lib/db/schema/properties";
import { verifyAdminAuth } from "@/lib/auth/admin";

/**
 * Server Action to fetch property listings for administration visibility page with search,
 * filtering, and pagination.
 * AC: 1, 7
 */
export async function fetchAdminVisibilityData(params: {
  page?: number;
  limit?: number;
  searchQuery?: string;
  showHiddenOnly?: boolean;
}) {
  await verifyAdminAuth();

  let page = typeof params.page === "number" ? params.page : parseInt(String(params.page || 1), 10);
  if (isNaN(page) || page < 1) {
    page = 1;
  } else {
    page = Math.trunc(page);
  }

  const limit = typeof params.limit === "number" ? params.limit : 10;
  const offset = (page - 1) * limit;

  const conditions = [];

  if (params.showHiddenOnly) {
    conditions.push(eq(properties.isVisible, false));
  }

  if (params.searchQuery && params.searchQuery.trim() !== "") {
    const searchPattern = `%${params.searchQuery.trim()}%`;
    conditions.push(
      or(
        ilike(properties.titleEn, searchPattern),
        ilike(properties.titleEs, searchPattern),
        ilike(properties.apiId, searchPattern),
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Get total count
  const countResult = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(properties)
    .where(whereClause);
  const totalCount = countResult[0]?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  // Get properties sorted by newest
  const rows = await db
    .select({
      id: properties.id,
      apiId: properties.apiId,
      slug: properties.slug,
      propertyType: properties.propertyType,
      status: properties.status,
      priceUsd: properties.priceUsd,
      titleEn: properties.titleEn,
      titleEs: properties.titleEs,
      images: properties.images,
      isVisible: properties.isVisible,
      latitude: properties.latitude,
      longitude: properties.longitude,
      communityId: properties.communityId,
      createdAt: properties.createdAt,
    })
    .from(properties)
    .where(whereClause)
    .orderBy(desc(properties.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    properties: rows,
    totalCount,
    totalPages,
    page,
    limit,
  };
}

/**
 * Server Action to update the visibility of a property.
 * AC: 1, 3, 6
 *
 * @param propertyId - The UUID of the property
 * @param isVisible  - The new visibility value
 */
export async function updatePropertyVisibilityAction(
  propertyId: string,
  isVisible: boolean,
): Promise<{ success: boolean }> {
  await verifyAdminAuth();

  await updatePropertyVisibility(propertyId, isVisible);

  // Trigger path revalidations as specified in the Dev Notes
  revalidatePath("/[locale]/property/[slug]");
  revalidatePath("/[locale]/search");
  revalidatePath("/[locale]");

  return { success: true };
}
