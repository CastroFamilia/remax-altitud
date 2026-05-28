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
      ilike(properties.titleEs, searchPattern)
    );
  }

  const countQuery = db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(properties);

  let total = 0;
  if (typeof (countQuery as any).where === "function") {
    const countResult = await (countQuery as any).where(whereClause);
    total = countResult[0]?.count ?? 0;
  }

  const data = await fetchShortlistAnalyticsData({
    search: searchVal,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
    limit,
    offset,
  });

  return {
    analytics: data,
    total,
    page,
    limit,
    hasMore: offset + limit < total,
  };
}
