"use server";

import { updatePropertyTags } from "@/lib/db/queries/properties";
import { revalidatePath } from "next/cache";
import { or, ilike, sql, desc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { properties } from "@/lib/db/schema/properties";
import { verifyAdminAuth } from "@/lib/auth/admin";

/**
 * Server Action to fetch property listings for administration with search and pagination.
 * AC: 1, 7
 */
export async function fetchAdminPropertiesData(params: {
  search?: string;
  page?: number;
}) {
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
    whereClause = or(
      ilike(properties.titleEn, searchPattern),
      ilike(properties.titleEs, searchPattern),
      ilike(properties.apiId, searchPattern)
    );
  }

  // Get total count
  const countResult = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(properties)
    .where(whereClause);
  const total = countResult[0]?.count ?? 0;

  // Get properties sorted by newest
  const rows = await db
    .select({
      id: properties.id,
      apiId: properties.apiId,
      slug: properties.slug,
      propertyType: properties.propertyType,
      status: properties.status,
      priceUsd: properties.priceUsd,
      lifestyleTags: properties.lifestyleTags,
      titleEn: properties.titleEn,
      titleEs: properties.titleEs,
      images: properties.images,
      isVisible: properties.isVisible,
    })
    .from(properties)
    .where(whereClause)
    .orderBy(desc(properties.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    properties: rows,
    total,
    page,
    limit,
    hasMore: offset + limit < total,
  };
}

/**
 * Server Action to update lifestyle tags for a specific property.
 * AC: 2, 3, 4, 6
 *
 * @param propertyId - The UUID of the property
 * @param tags       - The array of lifestyle tags to assign
 */
export async function updatePropertyTagsAction(
  propertyId: string,
  tags: string[]
): Promise<{ success: boolean }> {
  await verifyAdminAuth();
  
  await updatePropertyTags(propertyId, tags);

  // Trigger path revalidations as specified in the Dev Notes
  revalidatePath("/[locale]/properties/[slug]");
  revalidatePath("/[locale]/search");
  revalidatePath("/[locale]");

  return { success: true };
}
