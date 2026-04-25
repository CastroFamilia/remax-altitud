/**
 * ATDD Scaffolds — Story 2.4 + Story 2.6
 * Module: src/lib/db/queries/properties.ts
 *
 * Story 2.4 covers:
 *   AC #4 — updatePropertyImages() writes OptimizedImage[] to properties.images
 *
 * Story 2.5 covers:
 *   AC #8 — updatePropertyTranslations() writes titleEs/descriptionEs
 *
 * Story 2.6 covers (RED PHASE — it.skip):
 *   AC #7 — fetchPropertyLifestyleTags() batch-fetches existing tags from DB
 *   AC #7 — updatePropertyLifestyleTags() writes merged tags to properties.lifestyle_tags
 *
 * DB calls are mocked via vi.mock — no live DATABASE_URL required.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Hoisted mock primitives — vi.hoisted() ensures these are available when the
// vi.mock() factory runs (which is hoisted to the top of the compiled output).
// ---------------------------------------------------------------------------

const { mockWhere, mockSet, mockUpdate, mockFrom, mockSelect } = vi.hoisted(() => {
  const mockWhere = vi.fn().mockResolvedValue(undefined);
  const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
  const mockUpdate = vi.fn().mockReturnValue({ set: mockSet });
  // select chain: db.select().from().where()
  const mockFrom = vi.fn().mockResolvedValue([]);
  const mockSelect = vi.fn().mockReturnValue({ from: vi.fn().mockReturnValue({ where: mockFrom }) });
  return { mockWhere, mockSet, mockUpdate, mockFrom, mockSelect };
});

// ---------------------------------------------------------------------------
// Mock Drizzle client before any module under test is imported
// ---------------------------------------------------------------------------

vi.mock("@/lib/db/client", () => ({
  db: {
    update: mockUpdate,
    select: mockSelect,
  },
}));

// ---------------------------------------------------------------------------
// Imports — resolved after mocks are hoisted
// ---------------------------------------------------------------------------

import {
  updatePropertyImages,
  updatePropertyTranslations,
  fetchPropertyLifestyleTags,
  updatePropertyLifestyleTags,
} from "@/lib/db/queries/properties";
import type { OptimizedImage } from "@/types/images";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeOptimizedImage(overrides: Partial<OptimizedImage> = {}): OptimizedImage {
  return {
    src: "/property-images/API-001/photo1-400w.webp",
    srcset:
      "/property-images/API-001/photo1-400w.webp 400w, /property-images/API-001/photo1-800w.webp 800w, /property-images/API-001/photo1-1600w.webp 1600w",
    blurDataUrl: "data:image/webp;base64,abc123==",
    width: 400,
    height: 267,
    alt: "Photo 1 of 1 — House in Pérez Zeledón",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  // Re-wire the update chain after clearAllMocks resets return values
  mockSet.mockReturnValue({ where: mockWhere });
  mockUpdate.mockReturnValue({ set: mockSet });
  mockWhere.mockResolvedValue(undefined);
  // Re-wire the select chain for fetchPropertyLifestyleTags
  mockFrom.mockResolvedValue([]);
  mockSelect.mockReturnValue({ from: vi.fn().mockReturnValue({ where: mockFrom }) });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// AC #4 — updatePropertyImages sets properties.images JSONB
// ---------------------------------------------------------------------------

describe("updatePropertyImages — JSONB update (AC #4)", () => {
  it(
    "[P0] given apiId and OptimizedImage array when called then db.update is called on the properties table",
    async () => {
      const images = [makeOptimizedImage()];

      await updatePropertyImages("API-001", images);

      expect(mockUpdate).toHaveBeenCalledOnce();
    },
  );

  it(
    "[P0] given apiId='API-001' and 1 OptimizedImage when called then db.update().set() payload includes the images array",
    async () => {
      const images = [makeOptimizedImage()];

      await updatePropertyImages("API-001", images);

      expect(mockSet).toHaveBeenCalledOnce();
      const setPayload = mockSet.mock.calls[0][0];
      // The JSONB column must receive the optimized images array
      expect(setPayload).toMatchObject({ images: expect.arrayContaining([expect.objectContaining({ src: images[0].src })]) });
    },
  );

  it(
    "[P0] given any apiId when called then db.update().set().where() is called to scope the update to that apiId",
    async () => {
      const images = [makeOptimizedImage()];

      await updatePropertyImages("API-001", images);

      expect(mockWhere).toHaveBeenCalledOnce();
    },
  );

  it(
    "[P1] given apiId and empty OptimizedImage array when called then db.update().set() includes images:[]",
    async () => {
      await updatePropertyImages("API-001", []);

      expect(mockSet).toHaveBeenCalledOnce();
      const setPayload = mockSet.mock.calls[0][0];
      expect(setPayload).toMatchObject({ images: [] });
    },
  );

  it(
    "[P1] given apiId and OptimizedImage array when called then set() payload also includes syncedAt as a Date",
    async () => {
      const images = [makeOptimizedImage()];

      await updatePropertyImages("API-001", images);

      const setPayload = mockSet.mock.calls[0][0];
      expect(setPayload.syncedAt).toBeInstanceOf(Date);
    },
  );

  it(
    "[P1] given apiId and OptimizedImage array when called then set() payload also includes updatedAt as a Date",
    async () => {
      const images = [makeOptimizedImage()];

      await updatePropertyImages("API-001", images);

      const setPayload = mockSet.mock.calls[0][0];
      expect(setPayload.updatedAt).toBeInstanceOf(Date);
    },
  );

  it("[P2] given updatePropertyImages resolves successfully then the function returns void (undefined)", async () => {
    const images = [makeOptimizedImage()];

    const result = await updatePropertyImages("API-001", images);

    expect(result).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Story 2.5 ATDD — updatePropertyTranslations (AC #8, red-phase scaffolds)
// ---------------------------------------------------------------------------

describe("updatePropertyTranslations — DB update for translated fields (AC #8)", () => {
  it(
    "[P0] given apiId, titleEs, and descriptionEs when updatePropertyTranslations called then db.update is called on the properties table",
    async () => {
      // AC #8 — translated values are written to properties.title_es and properties.description_es
      await updatePropertyTranslations("API-001", "Título en español", "Descripción en español");

      expect(mockUpdate).toHaveBeenCalledOnce();
    },
  );

  it(
    "[P0] given apiId='API-001', titleEs='Título ES', descriptionEs='Descripción ES' when called then db.update().set() payload includes titleEs and descriptionEs",
    async () => {
      // AC #8 — the set() payload must contain the translated field values
      await updatePropertyTranslations("API-001", "Título ES", "Descripción ES");

      expect(mockSet).toHaveBeenCalledOnce();
      const setPayload = mockSet.mock.calls[0][0];
      expect(setPayload).toMatchObject({
        titleEs: "Título ES",
        descriptionEs: "Descripción ES",
      });
    },
  );

  it(
    "[P0] given any apiId when called then db.update().set().where() is called to scope the update to that apiId",
    async () => {
      // AC #8 — the update must be scoped to the specific property row
      await updatePropertyTranslations("API-001", "Título", "Descripción");

      expect(mockWhere).toHaveBeenCalledOnce();
    },
  );

  it(
    "[P1] given apiId and translated values when called then set() payload includes syncedAt as a Date",
    async () => {
      // Follows the same pattern as updatePropertyImages (Story 2.4)
      await updatePropertyTranslations("API-001", "Título ES", "Descripción ES");

      const setPayload = mockSet.mock.calls[0][0];
      expect(setPayload.syncedAt).toBeInstanceOf(Date);
    },
  );

  it(
    "[P1] given apiId and translated values when called then set() payload includes updatedAt as a Date",
    async () => {
      await updatePropertyTranslations("API-001", "Título ES", "Descripción ES");

      const setPayload = mockSet.mock.calls[0][0];
      expect(setPayload.updatedAt).toBeInstanceOf(Date);
    },
  );

  it(
    "[P1] given empty descriptionEs when called then set() payload contains descriptionEs as empty string",
    async () => {
      // descriptionEs can be empty string (e.g. no English remarks to translate)
      await updatePropertyTranslations("API-001", "Título ES", "");

      const setPayload = mockSet.mock.calls[0][0];
      expect(setPayload.descriptionEs).toBe("");
    },
  );

  it(
    "[P2] given updatePropertyTranslations resolves successfully then the function returns void (undefined)",
    async () => {
      const result = await updatePropertyTranslations("API-001", "Título ES", "Descripción ES");

      expect(result).toBeUndefined();
    },
  );
});

// ---------------------------------------------------------------------------
// Story 2.6 ATDD — fetchPropertyLifestyleTags (AC #7, RED PHASE)
// ---------------------------------------------------------------------------

describe("fetchPropertyLifestyleTags — batch fetch existing lifestyle tags (AC #7)", () => {
  it(
    "[P0] given apiIds=['API-001', 'API-002'] when fetchPropertyLifestyleTags called then db.select is called to fetch rows",
    async () => {
      // AC #7 — batch fetch: fetches existing lifestyle_tags for all given apiIds in one query
      // This prevents N+1 queries and enables O(1) lookup in the pipeline
      await fetchPropertyLifestyleTags(["API-001", "API-002"]);

      expect(mockSelect).toHaveBeenCalledOnce();
    },
  );

  it(
    "[P0] given apiIds=['API-001'] when fetchPropertyLifestyleTags called then result is a Map with 'API-001' as key",
    async () => {
      // AC #7 — result type: Map<apiId, string[]> for O(1) lookup in pipeline
      // Mock returns a row with apiId='API-001' and lifestyleTags=['Vacation Home']
      const mockFrom2 = vi.fn().mockResolvedValue([
        { apiId: "API-001", lifestyleTags: ["Vacation Home"] },
      ]);
      mockSelect.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({ where: mockFrom2 }),
      });

      const result = await fetchPropertyLifestyleTags(["API-001"]);

      expect(result).toBeInstanceOf(Map);
      expect(result.get("API-001")).toEqual(["Vacation Home"]);
    },
  );

  it(
    "[P0] given apiIds=[] (empty array) when fetchPropertyLifestyleTags called then returns empty Map without querying DB",
    async () => {
      // AC #7 boundary — guard: if apiIds is empty, return early without DB call
      const result = await fetchPropertyLifestyleTags([]);

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
      // DB must NOT be called for empty input
      expect(mockSelect).not.toHaveBeenCalled();
    },
  );

  it(
    "[P1] given apiIds=['API-001'] and DB returns no rows when called then result is an empty Map",
    async () => {
      // fetchPropertyLifestyleTags handles properties not found in DB (returns empty Map)
      const mockFrom2 = vi.fn().mockResolvedValue([]);
      mockSelect.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({ where: mockFrom2 }),
      });

      const result = await fetchPropertyLifestyleTags(["API-001"]);

      expect(result.size).toBe(0);
    },
  );

  it(
    "[P1] given apiIds=['API-001', 'API-002'] and DB returns rows for both when called then Map has 2 entries",
    async () => {
      // fetchPropertyLifestyleTags returns one Map entry per DB row
      const mockFrom2 = vi.fn().mockResolvedValue([
        { apiId: "API-001", lifestyleTags: ["Rental Potential"] },
        { apiId: "API-002", lifestyleTags: [] },
      ]);
      mockSelect.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({ where: mockFrom2 }),
      });

      const result = await fetchPropertyLifestyleTags(["API-001", "API-002"]);

      expect(result.size).toBe(2);
      expect(result.get("API-001")).toEqual(["Rental Potential"]);
      expect(result.get("API-002")).toEqual([]);
    },
  );
});

// ---------------------------------------------------------------------------
// Story 2.6 ATDD — updatePropertyLifestyleTags (AC #7, RED PHASE)
// ---------------------------------------------------------------------------

describe("updatePropertyLifestyleTags — write merged lifestyle tags to DB (AC #7)", () => {
  it(
    "[P0] given apiId and tags array when updatePropertyLifestyleTags called then db.update is called on the properties table",
    async () => {
      // AC #7 — follows same pattern as updatePropertyImages / updatePropertyTranslations
      await updatePropertyLifestyleTags("API-001", ["Rental Potential", "Vacation Home"]);

      expect(mockUpdate).toHaveBeenCalledOnce();
    },
  );

  it(
    "[P0] given apiId='API-001' and tags=['Rental Potential'] when called then db.update().set() payload includes lifestyleTags",
    async () => {
      // AC #7 — the set() payload must write the merged tags array to lifestyleTags column
      await updatePropertyLifestyleTags("API-001", ["Rental Potential"]);

      expect(mockSet).toHaveBeenCalledOnce();
      const setPayload = mockSet.mock.calls[0][0];
      expect(setPayload).toMatchObject({ lifestyleTags: ["Rental Potential"] });
    },
  );

  it(
    "[P0] given any apiId when called then db.update().set().where() is called to scope the update to that apiId",
    async () => {
      // AC #7 — scoped to the specific property row
      await updatePropertyLifestyleTags("API-001", ["Investment Property"]);

      expect(mockWhere).toHaveBeenCalledOnce();
    },
  );

  it(
    "[P1] given apiId and tags when called then set() payload includes syncedAt as a Date",
    async () => {
      // Follows updatePropertyImages / updatePropertyTranslations pattern
      await updatePropertyLifestyleTags("API-001", ["Retire"]);

      const setPayload = mockSet.mock.calls[0][0];
      expect(setPayload.syncedAt).toBeInstanceOf(Date);
    },
  );

  it(
    "[P1] given apiId and tags when called then set() payload includes updatedAt as a Date",
    async () => {
      await updatePropertyLifestyleTags("API-001", ["Retire"]);

      const setPayload = mockSet.mock.calls[0][0];
      expect(setPayload.updatedAt).toBeInstanceOf(Date);
    },
  );

  it(
    "[P1] given empty tags array when called then set() payload lifestyleTags is []",
    async () => {
      // updatePropertyLifestyleTags must accept empty array (no tags matched)
      await updatePropertyLifestyleTags("API-001", []);

      const setPayload = mockSet.mock.calls[0][0];
      expect(setPayload).toMatchObject({ lifestyleTags: [] });
    },
  );

  it(
    "[P2] given updatePropertyLifestyleTags resolves successfully then the function returns void (undefined)",
    async () => {
      const result = await updatePropertyLifestyleTags("API-001", ["Rental Potential"]);

      expect(result).toBeUndefined();
    },
  );
});
