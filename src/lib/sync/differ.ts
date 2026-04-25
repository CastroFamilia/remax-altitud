import "server-only";
import { createHash } from "node:crypto";
import type { RawProperty } from "@/types/remax-api";

/** Classification of DB records versus the current API snapshot. */
export interface DiffResult {
  new: RawProperty[];
  updated: RawProperty[];
  unchanged: RawProperty[];
  removed: string[]; // apiIds of records absent from API or expired
}

/** Shape of an existing DB record needed for diffing — select only these columns. */
export interface DbPropertySnapshot {
  apiId: string;
  apiHash: string | null;
  isVisible: boolean;
}

/**
 * Computes a deterministic SHA-256 hash of a property's mutable content fields.
 * Hash is used to detect UPDATED records during sync (AC #2).
 *
 * Fields included: priceUsd (rounded), titleEn, titleEs, publicRemarksEn,
 * latitude, longitude, bedrooms, bathrooms, lotSizeM2, constructionM2,
 * images (sorted for stability), amenities (key-sorted for stability), apiStatus.
 *
 * Fields excluded: apiRaw (minor API additions would cause spurious updates),
 * agentApiId, officeApiId (structural), expirationDate (drives isExpired → REMOVED).
 */
export function computePropertyHash(raw: RawProperty): string {
  // Sort amenities keys to guarantee stable hash regardless of object key order.
  // JSON.stringify preserves insertion order, so unsorted keys would cause
  // spurious UPDATED diffs whenever upstream object construction varies.
  const amenitiesSorted: Record<string, unknown> = {};
  if (raw.amenities && typeof raw.amenities === "object") {
    const amenitiesObj = raw.amenities as Record<string, unknown>;
    for (const key of Object.keys(amenitiesObj).sort()) {
      amenitiesSorted[key] = amenitiesObj[key];
    }
  }

  const hashPayload = JSON.stringify({
    priceUsd: Math.round(raw.priceUsd),
    titleEn: raw.titleEn,
    titleEs: raw.titleEs,
    descriptionEn: raw.publicRemarksEn,
    latitude: raw.latitude,
    longitude: raw.longitude,
    bedrooms: raw.bedrooms,
    bathrooms: raw.bathrooms,
    lotSizeM2: raw.lotSizeM2,
    constructionM2: raw.constructionM2,
    images: [...raw.images].sort(), // sorted for stable hash regardless of API order
    amenities: amenitiesSorted,
    apiStatus: raw.apiStatus,
  });

  return createHash("sha256").update(hashPayload).digest("hex");
}

/**
 * Classifies each API record against the DB snapshot into NEW, UPDATED,
 * UNCHANGED, or REMOVED buckets (AC #2, #4, #5, #6, #7).
 *
 * Rules:
 * - NEW: apiId not in DB
 * - REMOVED: apiId in DB but not in API response; OR isExpired=true (AC #5)
 * - UPDATED: hash differs OR is_visible=false (reactivation AC #7) OR apiHash is null
 * - UNCHANGED: hash matches AND is_visible=true
 *
 * Expired records (isExpired=true) are appended to `removed` even when present
 * in the API response — they are never classified as NEW/UPDATED/UNCHANGED (AC #5).
 */
export function diffProperties(
  apiRecords: RawProperty[],
  dbRecords: DbPropertySnapshot[],
): DiffResult {
  const dbMap = new Map<string, DbPropertySnapshot>(dbRecords.map((r) => [r.apiId, r]));

  const result: DiffResult = {
    new: [],
    updated: [],
    unchanged: [],
    removed: [],
  };

  const seenApiIds = new Set<string>();

  for (const raw of apiRecords) {
    // Expired records are treated as REMOVED regardless of other factors (AC #5)
    if (raw.isExpired) {
      result.removed.push(raw.apiId);
      seenApiIds.add(raw.apiId);
      continue;
    }

    seenApiIds.add(raw.apiId);
    const db = dbMap.get(raw.apiId);

    if (!db) {
      // Not in DB → NEW
      result.new.push(raw);
      continue;
    }

    const currentHash = computePropertyHash(raw);

    // Reactivation (AC #7): was soft-deleted → must upsert to restore is_visible
    // Null apiHash: cannot confirm unchanged → treat as UPDATED
    if (!db.isVisible || db.apiHash === null || db.apiHash !== currentHash) {
      result.updated.push(raw);
    } else {
      result.unchanged.push(raw);
    }
  }

  // Records in DB but absent from API response → REMOVED (AC #6)
  for (const db of dbRecords) {
    if (!seenApiIds.has(db.apiId)) {
      result.removed.push(db.apiId);
    }
  }

  return result;
}
