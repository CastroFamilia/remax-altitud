/**
 * ATDD Red-Phase Scaffolds — Story 2.3: Sync Pipeline Core
 * Module: differ.ts
 *
 * TDD RED PHASE — all tests are skipped until the module is implemented.
 * Covers AC #2, #4, #5, #6, #7 + Risk R-001 (diff correctness).
 *
 * To activate: remove `it.skip` → `it` after implementing src/lib/sync/differ.ts
 */

import { describe, expect, it } from "vitest";

// These imports will resolve once src/lib/sync/differ.ts is created.
import { computePropertyHash, diffProperties } from "@/lib/sync/differ";
import type { DiffResult } from "@/lib/sync/differ";
import type { RawProperty } from "@/lib/sync/parser";

// ---------------------------------------------------------------------------
// Minimal RawProperty factory — only fields relevant to the differ hash.
// ---------------------------------------------------------------------------
function makeRawProperty(overrides: Partial<RawProperty> = {}): RawProperty {
  return {
    apiId: "113149",
    apiKey: "400142400001",
    officeId: "FEA8746D-CC1D-41B8-89F3-D04AC98274AF",
    propertyTypeEn: "Lot/Land",
    propertyTypeEs: "Lote/Terreno",
    contractTypeEn: "Sale",
    contractTypeEs: "Venta",
    titleEn: "Mountain View Land",
    titleEs: "Terreno con vista",
    publicRemarksEn: "A great land parcel.",
    publicRemarksEs: "Un buen terreno.",
    apiStatus: "Active",
    priceUsd: 199000,
    latitude: 9.3549572,
    longitude: -83.6350214,
    bedrooms: null,
    bathrooms: null,
    lotSizeM2: 14757,
    constructionM2: 0,
    images: ["https://cdn.example.com/photo1.jpg"],
    amenities: {
      garage: false,
      garageSpaces: 0,
      maidRoom: false,
      cooling: false,
      pool: false,
      view: true,
      gatedCommunity: false,
      furnished: false,
    },
    slug: null,
    videoUrl: null,
    address: "San Francisco, Perez Zeledon",
    agentFirstName: "Emma",
    agentLastName: "Bennett",
    agentId: "2400",
    isExpired: false,
    lotSizeUnitWarning: false,
    apiRaw: {},
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// computePropertyHash
// ---------------------------------------------------------------------------
describe("computePropertyHash", () => {
  it.skip("[P0] returns the same SHA-256 hash for identical inputs", () => {
    // AC #2 — deterministic hash for diff tracking
    const raw = makeRawProperty();
    const hash1 = computePropertyHash(raw);
    const hash2 = computePropertyHash(raw);

    expect(typeof hash1).toBe("string");
    expect(hash1).toHaveLength(64); // SHA-256 hex = 64 chars
    expect(hash1).toBe(hash2);
  });

  it.skip("[P0] returns a different hash when priceUsd changes", () => {
    // AC #2, #4 — change detection for UPDATED records
    // Risk R-001: hash must detect changed mutable fields
    const original = makeRawProperty({ priceUsd: 199000 });
    const changed = makeRawProperty({ priceUsd: 210000 });

    const hashOriginal = computePropertyHash(original);
    const hashChanged = computePropertyHash(changed);

    expect(hashOriginal).not.toBe(hashChanged);
  });

  it.skip("[P1] returns a different hash when titleEn changes", () => {
    const a = makeRawProperty({ titleEn: "Mountain View Land" });
    const b = makeRawProperty({ titleEn: "Valley Land" });
    expect(computePropertyHash(a)).not.toBe(computePropertyHash(b));
  });

  it.skip("[P1] returns a different hash when images change", () => {
    const a = makeRawProperty({ images: ["https://cdn.example.com/photo1.jpg"] });
    const b = makeRawProperty({ images: ["https://cdn.example.com/photo2.jpg"] });
    expect(computePropertyHash(a)).not.toBe(computePropertyHash(b));
  });

  it.skip("[P1] produces the same hash regardless of images array order (sorted for stability)", () => {
    // Risk R-001: image order must not cause spurious UPDATED diffs
    const a = makeRawProperty({ images: ["photo-A.jpg", "photo-B.jpg"] });
    const b = makeRawProperty({ images: ["photo-B.jpg", "photo-A.jpg"] });
    expect(computePropertyHash(a)).toBe(computePropertyHash(b));
  });

  it.skip("[P2] does NOT include apiRaw in the hash (minor API field additions must not trigger updates)", () => {
    // Risk R-001: apiRaw changes should not trigger spurious UPDATED diffs
    const a = makeRawProperty({ apiRaw: { extra: "field1" } });
    const b = makeRawProperty({ apiRaw: { extra: "field1", newField: "value" } });
    // Same mutable fields → same hash despite different apiRaw
    expect(computePropertyHash(a)).toBe(computePropertyHash(b));
  });
});

// ---------------------------------------------------------------------------
// diffProperties
// ---------------------------------------------------------------------------

/** Snapshot shape expected by diffProperties for existing DB records */
type DbSnapshot = { apiId: string; apiHash: string | null; isVisible: boolean };

describe("diffProperties", () => {
  it.skip("[P0] classifies a new API record (not in DB) as NEW", () => {
    // AC #2, #3 — new records must be inserted
    const raw = makeRawProperty({ apiId: "999" });
    const result: DiffResult = diffProperties([raw], []);

    expect(result.new).toHaveLength(1);
    expect(result.new[0].apiId).toBe("999");
    expect(result.updated).toHaveLength(0);
    expect(result.unchanged).toHaveLength(0);
    expect(result.removed).toHaveLength(0);
  });

  it.skip("[P0] classifies a record with a changed hash as UPDATED", () => {
    // AC #2, #4 — changed fields must trigger an upsert
    // Risk R-001: diff must detect hash changes correctly
    const raw = makeRawProperty({ apiId: "113149", priceUsd: 210000 });
    const hash = computePropertyHash(makeRawProperty({ apiId: "113149", priceUsd: 199000 }));

    const dbRecords: DbSnapshot[] = [
      { apiId: "113149", apiHash: hash, isVisible: true },
    ];
    const result: DiffResult = diffProperties([raw], dbRecords);

    expect(result.updated).toHaveLength(1);
    expect(result.updated[0].apiId).toBe("113149");
    expect(result.new).toHaveLength(0);
    expect(result.unchanged).toHaveLength(0);
  });

  it.skip("[P0] classifies a record with same hash + is_visible=true as UNCHANGED", () => {
    // AC #4 — unchanged records must NOT produce DB writes (NFR15)
    const raw = makeRawProperty({ apiId: "113149" });
    const hash = computePropertyHash(raw);

    const dbRecords: DbSnapshot[] = [
      { apiId: "113149", apiHash: hash, isVisible: true },
    ];
    const result: DiffResult = diffProperties([raw], dbRecords);

    expect(result.unchanged).toHaveLength(1);
    expect(result.new).toHaveLength(0);
    expect(result.updated).toHaveLength(0);
    expect(result.removed).toHaveLength(0);
  });

  it.skip("[P0] classifies a DB-only record (absent from API) as REMOVED", () => {
    // AC #6 — listings removed from API → soft-delete (is_visible=false)
    // Risk R-001: removal must be detected by apiId absence
    const dbRecords: DbSnapshot[] = [
      { apiId: "113149", apiHash: "oldhash", isVisible: true },
    ];
    const result: DiffResult = diffProperties([], dbRecords);

    expect(result.removed).toContain("113149");
    expect(result.new).toHaveLength(0);
    expect(result.updated).toHaveLength(0);
  });

  it.skip("[P0] classifies a soft-deleted record (is_visible=false) with same hash as UPDATED (reactivation)", () => {
    // AC #7 — previously soft-deleted listing that reappears must be reactivated
    // Risk R-007: reactivation path
    const raw = makeRawProperty({ apiId: "113149" });
    const hash = computePropertyHash(raw);

    const dbRecords: DbSnapshot[] = [
      { apiId: "113149", apiHash: hash, isVisible: false },
    ];
    const result: DiffResult = diffProperties([raw], dbRecords);

    // Even though hash matches, is_visible=false means it needs an upsert to reactivate
    expect(result.updated).toHaveLength(1);
    expect(result.updated[0].apiId).toBe("113149");
    expect(result.unchanged).toHaveLength(0);
  });

  it.skip("[P0] treats an expired property (isExpired=true) as REMOVED even if present in API", () => {
    // AC #5 — expired listings flagged by parser → soft-delete
    const raw = makeRawProperty({ apiId: "113149", isExpired: true });
    const hash = computePropertyHash(raw);

    const dbRecords: DbSnapshot[] = [
      { apiId: "113149", apiHash: hash, isVisible: true },
    ];
    const result: DiffResult = diffProperties([raw], dbRecords);

    expect(result.removed).toContain("113149");
    expect(result.updated).toHaveLength(0);
    expect(result.unchanged).toHaveLength(0);
  });

  it.skip("[P1] handles a mixed batch: NEW, UPDATED, UNCHANGED, and REMOVED simultaneously", () => {
    // AC #2 — full diff scenario covering all four classifications
    const newRaw = makeRawProperty({ apiId: "NEW-1" });
    const unchangedRaw = makeRawProperty({ apiId: "SAME-1" });
    const unchangedHash = computePropertyHash(unchangedRaw);
    const updatedRaw = makeRawProperty({ apiId: "UPD-1", priceUsd: 300000 });
    const oldHash = computePropertyHash(makeRawProperty({ apiId: "UPD-1", priceUsd: 200000 }));

    const dbRecords: DbSnapshot[] = [
      { apiId: "SAME-1", apiHash: unchangedHash, isVisible: true },
      { apiId: "UPD-1", apiHash: oldHash, isVisible: true },
      { apiId: "GONE-1", apiHash: "irrelevant", isVisible: true },
    ];

    const result: DiffResult = diffProperties(
      [newRaw, unchangedRaw, updatedRaw],
      dbRecords,
    );

    expect(result.new.map((r) => r.apiId)).toContain("NEW-1");
    expect(result.unchanged.map((r) => r.apiId)).toContain("SAME-1");
    expect(result.updated.map((r) => r.apiId)).toContain("UPD-1");
    expect(result.removed).toContain("GONE-1");
  });

  it.skip("[P1] does not produce a DB write for 300 UNCHANGED records (incremental processing NFR15)", () => {
    // AC #4 — zero DB writes for unchanged records (performance requirement)
    const records = Array.from({ length: 300 }, (_, i) => makeRawProperty({ apiId: `ID-${i}` }));
    const dbRecords: DbSnapshot[] = records.map((r) => ({
      apiId: r.apiId,
      apiHash: computePropertyHash(r),
      isVisible: true,
    }));

    const result: DiffResult = diffProperties(records, dbRecords);

    expect(result.unchanged).toHaveLength(300);
    expect(result.new).toHaveLength(0);
    expect(result.updated).toHaveLength(0);
    expect(result.removed).toHaveLength(0);
  });

  it.skip("[P2] handles null apiHash in DB record (first sync after schema change) by treating it as UPDATED", () => {
    // Edge case: existing record with NULL api_hash should trigger a write to populate hash
    const raw = makeRawProperty({ apiId: "113149" });

    const dbRecords: DbSnapshot[] = [
      { apiId: "113149", apiHash: null, isVisible: true },
    ];
    const result: DiffResult = diffProperties([raw], dbRecords);

    // Null hash → cannot confirm unchanged → treat as updated
    expect(result.updated).toHaveLength(1);
    expect(result.unchanged).toHaveLength(0);
  });
});
