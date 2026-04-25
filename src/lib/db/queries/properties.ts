import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { properties } from "@/lib/db/schema/properties";
import { slugify } from "@/lib/sync/utils/slugify";
import type { RawProperty } from "@/types/remax-api";
import type { OptimizedImage } from "@/types/images";

/**
 * Upserts a single property into the database using Drizzle's
 * `onConflictDoUpdate` on the `api_id` unique constraint.
 * On a slug uniqueness conflict (different listing, same title), retries once
 * with the apiId appended as a suffix.
 *
 * AC #3, #4, #6, #7 — handles NEW, UPDATED, and reactivation cases.
 * Only mutable fields are included in the `set` clause (id, createdAt,
 * officeId, slug are frozen on first insert — not overwritten on update).
 *
 * @param raw      - Normalized property record from the parser
 * @param officeId - UUID of the office (resolved from offices table lookup)
 * @param agentId  - UUID of the agent (resolved from agents table lookup), or null
 * @param apiHash  - Pre-computed SHA-256 hash from differ.ts
 */
export async function upsertProperty(
  raw: RawProperty,
  officeId: string,
  agentId: string | null = null,
  apiHash: string = "",
): Promise<void> {
  const geo =
    raw.latitude != null && raw.longitude != null
      ? { lng: raw.longitude, lat: raw.latitude }
      : null;

  const baseSlug = slugify(raw.titleEn);
  const slugWithSuffix = slugify(raw.titleEn, raw.apiId);

  const values = {
    apiId: raw.apiId,
    officeId,
    slug: baseSlug || raw.apiId, // fallback to apiId if title produces empty slug
    propertyType: raw.propertyTypeEn,
    priceUsd: Math.round(raw.priceUsd),
    bedrooms: raw.bedrooms ?? null,
    bathrooms: raw.bathrooms ?? null,
    lotSizeM2: raw.lotSizeM2 ?? null,
    constructionM2: raw.constructionM2 ?? null,
    latitude: raw.latitude ?? null,
    longitude: raw.longitude ?? null,
    geo,
    titleEn: raw.titleEn,
    titleEs: raw.titleEs,
    descriptionEn: raw.publicRemarksEn ?? "",
    descriptionEs: raw.publicRemarksEs ?? "",
    amenities: raw.amenities,
    images: raw.images,
    youtubeUrl: raw.videoUrl ?? null,
    agentId,
    areaId: null,
    areaSlug: null,
    communityId: null,
    lifestyleTags: [],
    zmtStatus: "titled" as const,
    isVisible: true,
    apiHash,
    apiRaw: raw.apiRaw,
    syncedAt: new Date(),
  };

  const mutableSet = {
    propertyType: values.propertyType,
    priceUsd: values.priceUsd,
    bedrooms: values.bedrooms,
    bathrooms: values.bathrooms,
    lotSizeM2: values.lotSizeM2,
    constructionM2: values.constructionM2,
    latitude: values.latitude,
    longitude: values.longitude,
    geo: values.geo,
    titleEn: values.titleEn,
    titleEs: values.titleEs,
    descriptionEn: values.descriptionEn,
    descriptionEs: values.descriptionEs,
    amenities: values.amenities,
    images: values.images,
    youtubeUrl: values.youtubeUrl,
    agentId: values.agentId,
    areaId: null,
    areaSlug: null,
    communityId: null,
    isVisible: true, // reactivation: restore is_visible=true (AC #7)
    apiHash: values.apiHash,
    apiRaw: values.apiRaw,
    syncedAt: values.syncedAt,
    updatedAt: new Date(),
  };

  try {
    await db.insert(properties).values(values).onConflictDoUpdate({
      target: properties.apiId,
      set: mutableSet,
    });
  } catch (err: unknown) {
    // Slug uniqueness conflict (different listing, same English title) → retry with apiId suffix
    const isSlugConflict =
      err instanceof Error &&
      err.message.includes("unique") &&
      err.message.toLowerCase().includes("slug");

    if (isSlugConflict) {
      await db
        .insert(properties)
        .values({ ...values, slug: slugWithSuffix || raw.apiId })
        .onConflictDoUpdate({
          target: properties.apiId,
          set: mutableSet,
        });
    } else {
      throw err;
    }
  }
}

/**
 * Soft-deletes properties that are absent from the current API response
 * or have been flagged as expired. Sets `is_visible = false` on matching rows.
 * No hard deletes — slug and URL are preserved for SEO (FR53, AR3, AC #6).
 *
 * @param apiIds - Array of `api_id` values to soft-delete
 * @returns Count of rows actually updated (for sync_log `properties_removed`)
 */
export async function softDeleteProperties(apiIds: string[]): Promise<number> {
  if (apiIds.length === 0) return 0;

  const result = await db
    .update(properties)
    .set({ isVisible: false, updatedAt: new Date() })
    .where(and(inArray(properties.apiId, apiIds), eq(properties.isVisible, true)))
    .returning({ id: properties.id });

  return result.length;
}

/**
 * Fetches a minimal snapshot of all properties from the DB for diff computation.
 * Only selects `api_id`, `api_hash`, `is_visible` — avoids loading full JSONB
 * `api_raw` for hundreds of listings (NFR15 anti-pattern guardrail).
 */
export async function fetchPropertySnapshot(): Promise<
  { apiId: string; apiHash: string | null; isVisible: boolean }[]
> {
  const rows = await db
    .select({
      apiId: properties.apiId,
      apiHash: properties.apiHash,
      isVisible: properties.isVisible,
    })
    .from(properties);

  return rows;
}

/**
 * Fetches a map of agentApiId → agentUuid from the agents table.
 * Used by the pipeline to resolve agent FK before upserting properties.
 * Returns a Map<agentApiId (string), agentUuid (string)>.
 */
export async function fetchAgentIdMap(): Promise<Map<string, string>> {
  const { agents } = await import("@/lib/db/schema/agents");
  const rows = await db.select({ apiId: agents.apiId, id: agents.id }).from(agents);

  return new Map(rows.map((r) => [r.apiId, r.id]));
}

/**
 * Fetches a map of officeApiGuid → officeUuid from the offices table.
 * Cached once per pipeline run (only 2 offices exist).
 */
export async function fetchOfficeIdMap(): Promise<Map<string, string>> {
  const { offices } = await import("@/lib/db/schema/offices");
  const rows = await db.select({ apiGuid: offices.apiGuid, id: offices.id }).from(offices);

  return new Map(rows.map((r) => [r.apiGuid, r.id]));
}

/**
 * Overwrites the `properties.images` JSONB column with `OptimizedImage[]` objects
 * generated by the image-optimization pipeline (Story 2.4).
 * Also updates `synced_at` and `updated_at` timestamps.
 *
 * AC #4 — called after `optimizePropertyImages` for each new/updated property.
 *
 * @param apiId  - The property's `api_id` value
 * @param images - Array of `OptimizedImage` objects (may be empty if all images failed)
 */
export async function updatePropertyImages(apiId: string, images: OptimizedImage[]): Promise<void> {
  await db
    .update(properties)
    .set({
      images: images as unknown as string[],
      syncedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(properties.apiId, apiId));
}

/**
 * Writes translated Spanish title and description directly to
 * `properties.title_es` and `properties.description_es` columns (AC #8, Story 2.5).
 * Also updates `synced_at` and `updated_at` timestamps.
 *
 * Translation values are NOT stored in a separate translations table —
 * they are written directly to the properties row (Architecture §5 guardrail).
 *
 * @param apiId       - The property's `api_id` value
 * @param titleEs     - Translated Spanish title from DeepL
 * @param descriptionEs - Translated Spanish description from DeepL (may be empty string)
 */
export async function updatePropertyTranslations(
  apiId: string,
  titleEs: string,
  descriptionEs: string,
): Promise<void> {
  await db
    .update(properties)
    .set({
      titleEs,
      descriptionEs,
      syncedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(properties.apiId, apiId));
}

/**
 * Batch-fetches `{ apiId, lifestyleTags }` for all given apiIds in a single query.
 * Returns a Map<apiId, string[]> for O(1) lookup in the pipeline.
 * Used to load existing tags BEFORE merging with auto-tagged results (AC #7, FR49).
 *
 * @param apiIds - Array of property api_id values to fetch tags for
 * @returns      Map<apiId, string[]> — empty map if apiIds is empty
 */
export async function fetchPropertyLifestyleTags(apiIds: string[]): Promise<Map<string, string[]>> {
  if (apiIds.length === 0) return new Map();

  const rows = await db
    .select({ apiId: properties.apiId, lifestyleTags: properties.lifestyleTags })
    .from(properties)
    .where(inArray(properties.apiId, apiIds));

  return new Map(rows.map((r) => [r.apiId, r.lifestyleTags ?? []]));
}

/**
 * Writes merged lifestyle tags to `properties.lifestyle_tags` (text[] column).
 * Follows the exact same Drizzle update pattern as updatePropertyImages and
 * updatePropertyTranslations (Story 2.4 / 2.5).
 * Also updates `synced_at` and `updated_at` timestamps (AC #7, Story 2.6).
 *
 * @param apiId - The property's `api_id` value
 * @param tags  - Merged deduplicated lifestyle tags array
 */
export async function updatePropertyLifestyleTags(apiId: string, tags: string[]): Promise<void> {
  await db
    .update(properties)
    .set({
      lifestyleTags: tags,
      syncedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(properties.apiId, apiId));
}
