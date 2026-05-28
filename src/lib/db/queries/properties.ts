import "server-only";
import { and, asc, desc, eq, gte, inArray, lte, not, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { properties } from "@/lib/db/schema/properties";
import { slugify } from "@/lib/sync/utils/slugify";
import type { RawProperty } from "@/types/remax-api";
import type { OptimizedImage } from "@/types/images";
import type { PropertySearchItem } from "@/types/search";
import { normalizePropertyImages } from "@/lib/utils/normalize-images";

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
    communityId: sql`CASE 
      WHEN ${properties.latitude} IS DISTINCT FROM ${values.latitude} 
        OR ${properties.longitude} IS DISTINCT FROM ${values.longitude} 
      THEN NULL 
      ELSE ${properties.communityId} 
    END`,
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
    // Slug uniqueness conflict (different listing, same English title) → retry with apiId suffix.
    // Drizzle (postgres-js) wraps the postgres error in err.cause, so we must check both
    // err.message (the "Failed query: ..." wrapper) and err.cause.message (the real PG error).
    const errMsg = err instanceof Error ? err.message : "";
    const causeMsg = err instanceof Error && err.cause instanceof Error ? err.cause.message : "";
    const isSlugConflict =
      (errMsg.toLowerCase().includes("slug") || causeMsg.toLowerCase().includes("slug")) &&
      (errMsg.toLowerCase().includes("unique") || causeMsg.toLowerCase().includes("unique"));

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

/**
 * Updates the lifestyle tags array column for a specific property id.
 * AC: 1, 2, 3
 *
 * @param id   - The property's UUID
 * @param tags - The new array of lifestyle tags
 */
export async function updatePropertyTags(id: string, tags: string[]): Promise<void> {
  await db
    .update(properties)
    .set({
      lifestyleTags: tags,
      updatedAt: new Date(),
    })
    .where(eq(properties.id, id));
}


/**
 * Fetches all slugs for visible properties.
 * Used by `generateStaticParams` for SSG build-time generation (Story 4.1, Task 1).
 *
 * AC #10, NFR25 — called at build time; returns all visible property slugs.
 */
export async function getAllPropertySlugs(): Promise<string[]> {
  const rows = await db
    .select({ slug: properties.slug })
    .from(properties)
    .where(eq(properties.isVisible, true));
  return rows.map((r) => r.slug);
}

/**
 * Fetches a single property by its URL slug, including soft-deleted records.
 * Does NOT filter by `is_visible` — the page component decides rendering based on
 * the value: isVisible=false → "No longer available" UI; null result → 404.
 *
 * AC #3 (FR53, Story 2.7): Removed listings must have a graceful unavailable page.
 *
 * @param slug - The property's URL slug
 * @returns Property record (visible or soft-deleted), or null if never existed
 */
export async function getPropertyBySlug(slug: string) {
  const rows = await db.select().from(properties).where(eq(properties.slug, slug)).limit(1);
  return rows[0] ?? null;
}

/**
 * Maps DB property rows to PropertySearchItem shape.
 * Handles normalization of images (Story 3.5 transition).
 */
export function mapPropertyRowToSearchItem(row: {
  id: string;
  slug: string;
  titleEn: string;
  titleEs: string;
  priceUsd: number;
  bedrooms: number | null;
  bathrooms: number | null;
  lotSizeM2: number | null;
  constructionM2: number | null;
  zmtStatus: string | null;
  propertyType: string;
  status: string;
  areaSlug: string | null;
  images: unknown;
  latitude: number | null;
  longitude: number | null;
}): PropertySearchItem {
  return {
    id: row.id,
    slug: row.slug,
    titleEn: row.titleEn,
    titleEs: row.titleEs,
    priceUsd: row.priceUsd,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    lotSizeM2: row.lotSizeM2,
    constructionM2: row.constructionM2,
    zmtStatus: row.zmtStatus ?? "titled",
    propertyType: row.propertyType,
    status: row.status,
    areaSlug: row.areaSlug,
    images: normalizePropertyImages(row.images, row.titleEn),
    latitude: row.latitude,
    longitude: row.longitude,
  };
}

/** Columns to select for PropertySearchItem queries */
export const propertySearchColumns = {
  id: properties.id,
  slug: properties.slug,
  titleEn: properties.titleEn,
  titleEs: properties.titleEs,
  priceUsd: properties.priceUsd,
  bedrooms: properties.bedrooms,
  bathrooms: properties.bathrooms,
  lotSizeM2: properties.lotSizeM2,
  constructionM2: properties.constructionM2,
  zmtStatus: properties.zmtStatus,
  propertyType: properties.propertyType,
  status: properties.status,
  areaSlug: properties.areaSlug,
  images: properties.images,
  latitude: properties.latitude,
  longitude: properties.longitude,
} as const;

/**
 * Returns similar properties ranked by: same area (priority 1) →
 * similar price range ±20% (priority 2) → same property type (priority 3).
 * Excludes the current property. Returns up to `limit` results.
 * Used by SimilarProperties carousel on the listing detail page (Story 4.5).
 *
 * Algorithm:
 *   STEP 1 — Same area, same type, similar price (±20%)
 *   STEP 2 — Same area, similar price (type relaxed)
 *   STEP 3 — Same area (price relaxed)
 *   STEP 4 — Any visible (area relaxed, final fallback)
 *
 * Max 4 DB round-trips total; each step short-circuits if limit is reached.
 */
export async function getSimilarPropertiesRanked(opts: {
  excludeSlug: string;
  areaSlug: string | null;
  priceUsd: number;
  propertyType: string;
  limit?: number;
}): Promise<PropertySearchItem[]> {
  const limit = opts.limit ?? 4;
  const priceLow = Math.round(opts.priceUsd * 0.8);
  const priceHigh = Math.round(opts.priceUsd * 1.2);

  const results: PropertySearchItem[] = [];

  // STEP 1 — Same area, same type, similar price (±20%)
  if (results.length < limit && opts.areaSlug) {
    const step1Rows = await db
      .select(propertySearchColumns)
      .from(properties)
      .where(
        and(
          eq(properties.isVisible, true),
          not(eq(properties.slug, opts.excludeSlug)),
          eq(properties.areaSlug, opts.areaSlug),
          eq(properties.propertyType, opts.propertyType),
          gte(properties.priceUsd, priceLow),
          lte(properties.priceUsd, priceHigh),
        ),
      )
      .orderBy(asc(sql`ABS(${properties.priceUsd} - ${opts.priceUsd})`))
      .limit(limit - results.length);
    results.push(...step1Rows.map(mapPropertyRowToSearchItem));
  }

  if (results.length >= limit) return results;

  // STEP 2 — Same area, similar price (type relaxed)
  if (opts.areaSlug) {
    const collectedSlugs = results.map((r) => r.slug);
    const step2Rows = await db
      .select(propertySearchColumns)
      .from(properties)
      .where(
        and(
          eq(properties.isVisible, true),
          not(eq(properties.slug, opts.excludeSlug)),
          ...(collectedSlugs.length > 0 ? [not(inArray(properties.slug, collectedSlugs))] : []),
          eq(properties.areaSlug, opts.areaSlug),
          gte(properties.priceUsd, priceLow),
          lte(properties.priceUsd, priceHigh),
        ),
      )
      .orderBy(asc(sql`ABS(${properties.priceUsd} - ${opts.priceUsd})`))
      .limit(limit - results.length);
    results.push(...step2Rows.map(mapPropertyRowToSearchItem));
  }

  if (results.length >= limit) return results;

  // STEP 3 — Same area (price relaxed)
  if (opts.areaSlug) {
    const collectedSlugs = results.map((r) => r.slug);
    const step3Rows = await db
      .select(propertySearchColumns)
      .from(properties)
      .where(
        and(
          eq(properties.isVisible, true),
          not(eq(properties.slug, opts.excludeSlug)),
          ...(collectedSlugs.length > 0 ? [not(inArray(properties.slug, collectedSlugs))] : []),
          eq(properties.areaSlug, opts.areaSlug),
        ),
      )
      .orderBy(desc(properties.syncedAt))
      .limit(limit - results.length);
    results.push(...step3Rows.map(mapPropertyRowToSearchItem));
  }

  if (results.length >= limit) return results;

  // STEP 4 — Any visible (fallback, area relaxed)
  const collectedSlugs = results.map((r) => r.slug);
  const step4Rows = await db
    .select(propertySearchColumns)
    .from(properties)
    .where(
      and(
        eq(properties.isVisible, true),
        not(eq(properties.slug, opts.excludeSlug)),
        ...(collectedSlugs.length > 0 ? [not(inArray(properties.slug, collectedSlugs))] : []),
      ),
    )
    .orderBy(desc(properties.syncedAt))
    .limit(limit - results.length);
  results.push(...step4Rows.map(mapPropertyRowToSearchItem));

  return results;
}

/**
 * Fetches up to `limit` visible properties in the same area, excluding the given slug.
 * Used by the "No longer available" page to display similar properties.
 *
 * Filters: isVisible=true, areaSlug match (if provided), excludes the current slug.
 * Order: syncedAt DESC (most recently synced first).
 * Returns only display-necessary columns (AC #3, Story 2.7).
 *
 * @param areaSlug    - Area slug to match similar properties; falls back to any visible if null
 * @param excludeSlug - Slug of the unavailable property to exclude from results
 * @param limit       - Maximum number of results (default 3)
 */
export async function getSimilarProperties(
  areaSlug: string | null,
  excludeSlug: string,
  limit = 3,
) {
  const whereClause = areaSlug
    ? and(
        eq(properties.isVisible, true),
        eq(properties.areaSlug, areaSlug),
        not(eq(properties.slug, excludeSlug)),
      )
    : and(eq(properties.isVisible, true), not(eq(properties.slug, excludeSlug)));

  return db
    .select({
      slug: properties.slug,
      titleEn: properties.titleEn,
      titleEs: properties.titleEs,
      priceUsd: properties.priceUsd,
      propertyType: properties.propertyType,
      images: properties.images,
    })
    .from(properties)
    .where(whereClause)
    .orderBy(desc(properties.syncedAt))
    .limit(limit);
}
