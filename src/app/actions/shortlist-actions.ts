/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { db } from "@/lib/db/client";
import { properties } from "@/lib/db/schema/properties";
import { shortlistShares } from "@/lib/db/schema/shortlist-shares";
import { inArray, eq, and, or } from "drizzle-orm";
import { mapPropertyRowToSearchItem, propertySearchColumns } from "@/lib/db/queries/properties";
import type { PropertySearchItem } from "@/types/search";
import { randomBytes } from "crypto";
import { getAllAgents } from "@/lib/db/queries/agents";

/**
 * getShortlistProperties — Server Action for fetching properties on the shortlist page.
 * Maps database rows to PropertySearchItem objects.
 */
export async function getShortlistProperties(ids: string[]): Promise<PropertySearchItem[]> {
  if (!ids || ids.length === 0) return [];

  const uuids = ids.filter((id) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id),
  );
  const apiIds = ids.filter(
    (id) => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id),
  );

  const conditions = [];
  if (uuids.length > 0) conditions.push(inArray(properties.id, uuids));
  if (apiIds.length > 0) conditions.push(inArray(properties.apiId, apiIds));

  if (conditions.length === 0) return [];

  const rows = await db
    .select(propertySearchColumns)
    .from(properties)
    .where(and(or(...conditions), eq(properties.isVisible, true)));

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

  // Deduplicate property IDs to prevent false validation failures on duplicates
  const uniquePropertyIds = Array.from(new Set(propertyIds));

  // Validate all property IDs exist and are currently visible
  const existingProps = await db
    .select({ id: properties.id, isVisible: properties.isVisible })
    .from(properties)
    .where(and(inArray(properties.id, uniquePropertyIds), eq(properties.isVisible, true)));

  if (existingProps.length !== uniquePropertyIds.length) {
    throw new Error("One or more properties are invalid or hidden");
  }

  // Generate unique, short, URL-safe slug
  const shareId = randomBytes(4).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const result = await db
    .insert(shortlistShares)
    .values({
      shareId,
      propertyIds: uniquePropertyIds,
      locale,
      expiresAt,
    })
    .returning();

  if (result && Array.isArray(result) && result[0]) {
    return result[0];
  }

  return {
    shareId,
    propertyIds: uniquePropertyIds,
    locale,
    expiresAt,
  };
}

export async function getSharedShortlist(shareId: string) {
  const rows = await db.select().from(shortlistShares).where(eq(shortlistShares.shareId, shareId));

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

import { agents } from "@/lib/db/schema/agents";
import { normalizePropertyImages } from "@/lib/utils/normalize-images";

/**
 * getShortlistPropertiesWithAgents — Story 7.4
 * Fetch shortlist properties joined with their listing agent details.
 */
export async function getShortlistPropertiesWithAgents(ids: string[]): Promise<any[]> {
  if (!ids || ids.length === 0) return [];

  const uuids = ids.filter((id) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id),
  );
  const apiIds = ids.filter(
    (id) => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id),
  );

  const conditions = [];
  if (uuids.length > 0) conditions.push(inArray(properties.id, uuids));
  if (apiIds.length > 0) conditions.push(inArray(properties.apiId, apiIds));

  if (conditions.length === 0) return [];

  const rows = await db
    .select({
      properties: {
        id: properties.id,
        slug: properties.slug,
        titleEn: properties.titleEn,
        titleEs: properties.titleEs,
        priceUsd: properties.priceUsd,
        apiId: properties.apiId,
        agentId: properties.agentId,
        isVisible: properties.isVisible,
        images: properties.images,
        latitude: properties.latitude,
        longitude: properties.longitude,
      },
      agents: {
        id: agents.id,
        name: agents.name,
        photoUrl: agents.photoUrl,
        photoOptimizedUrl: agents.photoOptimizedUrl,
        email: agents.email,
        phone: agents.phone,
        whatsapp: agents.whatsapp,
        languages: agents.languages,
        listingCount: agents.listingCount,
      },
    })
    .from(properties)
    .leftJoin(agents, eq(properties.agentId, agents.id))
    .where(and(or(...conditions), eq(properties.isVisible, true)));

  return rows.map((row) => ({
    id: row.properties.id,
    slug: row.properties.slug,
    titleEn: row.properties.titleEn,
    titleEs: row.properties.titleEs,
    priceUsd: row.properties.priceUsd,
    apiId: row.properties.apiId,
    agentId: row.properties.agentId,
    isVisible: row.properties.isVisible,
    images: normalizePropertyImages(row.properties.images, row.properties.titleEn),
    latitude: row.properties.latitude,
    longitude: row.properties.longitude,
    agent: row.agents
      ? {
          id: row.agents.id,
          name: row.agents.name,
          photoUrl: row.agents.photoUrl,
          photoOptimizedUrl: row.agents.photoOptimizedUrl,
          email: row.agents.email,
          phone: row.agents.phone,
          whatsapp: row.agents.whatsapp,
          languages: Array.isArray(row.agents.languages)
            ? row.agents.languages.join(", ")
            : typeof row.agents.languages === "string"
              ? row.agents.languages
              : "",
          listingCount: row.agents.listingCount,
        }
      : null,
  }));
}

/**
 * getActiveAgentsList — Fetch all active agents for the shortlist contact form dropdown.
 */
export async function getActiveAgentsList(): Promise<any[]> {
  const rows = await getAllAgents();
  return rows.map((a) => ({
    id: a.id,
    name: a.name,
    photoUrl: a.photoUrl,
    photoOptimizedUrl: a.photoOptimizedUrl,
    email: a.email,
    phone: a.phone,
    whatsapp: a.whatsapp,
    languages: Array.isArray(a.languages)
      ? a.languages.join(", ")
      : typeof a.languages === "string"
        ? a.languages
        : "",
    listingCount: a.listingCount,
  }));
}
