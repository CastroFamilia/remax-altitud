"use server";

import { db } from "@/lib/db/client";
import { properties } from "@/lib/db/schema/properties";
import { shortlistShares } from "@/lib/db/schema/shortlist-shares";
import { inArray, eq, and } from "drizzle-orm";
import { mapPropertyRowToSearchItem, propertySearchColumns } from "@/lib/db/queries/properties";
import type { PropertySearchItem } from "@/types/search";
import { randomBytes } from "crypto";

/**
 * getShortlistProperties — Server Action for fetching properties on the shortlist page.
 * Maps database rows to PropertySearchItem objects.
 */
export async function getShortlistProperties(ids: string[]): Promise<PropertySearchItem[]> {
  if (!ids || ids.length === 0) return [];

  const rows = await db
    .select(propertySearchColumns)
    .from(properties)
    .where(and(inArray(properties.id, ids), eq(properties.isVisible, true)));

  return rows.map(mapPropertyRowToSearchItem);
}

export async function createShortlistShare({
  propertyIds,
  locale,
}: {
  propertyIds: string[];
  locale: string;
}) {
  if (!propertyIds || propertyIds.length === 0) {
    throw new Error("No properties selected to share");
  }

  // Validate all property IDs exist and are currently visible
  const existingProps = await db
    .select({ id: properties.id, isVisible: properties.isVisible })
    .from(properties)
    .where(and(inArray(properties.id, propertyIds), eq(properties.isVisible, true)));

  if (existingProps.length !== propertyIds.length) {
    throw new Error("One or more properties are invalid or hidden");
  }

  // Generate unique, short, URL-safe slug
  const shareId = randomBytes(4).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const result = await db
    .insert(shortlistShares)
    .values({
      shareId,
      propertyIds,
      locale,
      expiresAt,
    });

  if (result && Array.isArray(result) && result[0]) {
    return result[0];
  }

  return {
    shareId,
    propertyIds,
    locale,
    expiresAt,
  };

}

export async function getSharedShortlist(shareId: string) {
  const rows = await db
    .select()
    .from(shortlistShares)
    .where(eq(shortlistShares.shareId, shareId));

  const share = rows[0];

  if (!share) {
    return null;
  }

  const isExpired = new Date() > new Date(share.expiresAt);
  if (isExpired) {
    return { isExpired: true, properties: [] };
  }

  const props = await getShortlistProperties(share.propertyIds);
  return {
    isExpired: false,
    properties: props,
  };
}


