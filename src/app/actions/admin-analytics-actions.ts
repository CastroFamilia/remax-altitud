"use server";

import { verifyAdminAuth } from "@/lib/auth/admin";
import { fetchShortlistAnalyticsData } from "@/lib/db/queries/properties";
import { db } from "@/lib/db/client";
import { properties } from "@/lib/db/schema/properties";
import { or, ilike, sql } from "drizzle-orm";

export async function getShortlistAnalyticsAction(params: {
  search?: string;
  sortBy?: "saves30" | "savesAll" | "active" | "code";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}) {
  await verifyAdminAuth();

  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const offset = (page - 1) * limit;

  // Fetch count for pagination matching filters
  const searchVal = params.search?.trim();
  let whereClause = undefined;
  if (searchVal && searchVal !== "") {
    const searchPattern = `%${searchVal}%`;
    whereClause = or(
      ilike(properties.apiId, searchPattern),
      ilike(properties.titleEn, searchPattern),
      ilike(properties.titleEs, searchPattern),
    );
  }

  const countQuery = db.select({ count: sql<number>`cast(count(*) as integer)` }).from(properties);

  const countResult = whereClause ? await countQuery.where(whereClause) : await countQuery;
  const total = countResult[0]?.count ?? 0;

  const data = await fetchShortlistAnalyticsData({
    search: searchVal,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
    limit,
    offset,
  });

  const formattedData = data.map((row) => ({
    ...row,
    images: Array.isArray(row.images) ? (row.images as Array<{ src: string }>) : undefined,
  }));

  return {
    analytics: formattedData,
    total,
    page,
    limit,
    hasMore: offset + limit < total,
  };
}
