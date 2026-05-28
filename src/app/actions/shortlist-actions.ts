"use server";

import { db } from "@/lib/db/client";
import { properties } from "@/lib/db/schema/properties";
import { inArray, eq, and } from "drizzle-orm";
import { mapPropertyRowToSearchItem, propertySearchColumns } from "@/lib/db/queries/properties";
import type { PropertySearchItem } from "@/types/search";

/**
 * getShortlistProperties — Server Action for fetching properties on the shortlist page.
 * Maps database rows to PropertySearchItem objects.
 */
export async function getShortlistProperties(ids: string[]): Promise<PropertySearchItem[]> {
  if (!ids || ids.length === 0) return [];
  
  const rows = await db
    .select(propertySearchColumns)
    .from(properties)
    .where(
      and(
        inArray(properties.id, ids),
        eq(properties.isVisible, true)
      )
    );

  return rows.map(mapPropertyRowToSearchItem);
}
