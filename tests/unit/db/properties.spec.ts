/**
 * ATDD Red-Phase Scaffolds — Story 2.4: Image Optimization Pipeline
 * Module: src/lib/db/queries/properties.ts → updatePropertyImages()
 *
 * TDD RED PHASE — all tests are skipped until the function is implemented.
 * Covers AC #4 (properties.images JSONB overwritten with OptimizedImage[]).
 *
 * DB calls are mocked via vi.mock — no live DATABASE_URL required.
 *
 * To activate: change `it.skip` → `it` after implementing updatePropertyImages().
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mock Drizzle client before any module under test is imported
// ---------------------------------------------------------------------------

const mockWhere = vi.fn().mockResolvedValue(undefined);
const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
const mockUpdate = vi.fn().mockReturnValue({ set: mockSet });

vi.mock("@/lib/db/client", () => ({
  db: {
    update: mockUpdate,
  },
}));

// ---------------------------------------------------------------------------
// Imports — resolved after mocks are hoisted
// ---------------------------------------------------------------------------

import { updatePropertyImages } from "@/lib/db/queries/properties";
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
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// AC #4 — updatePropertyImages sets properties.images JSONB
// ---------------------------------------------------------------------------

describe("updatePropertyImages — JSONB update (AC #4)", () => {
  it.skip(
    "[P0] given apiId and OptimizedImage array when called then db.update is called on the properties table",
    async () => {
      // THIS TEST WILL FAIL — updatePropertyImages not implemented yet
      const images = [makeOptimizedImage()];

      await updatePropertyImages("API-001", images);

      expect(mockUpdate).toHaveBeenCalledOnce();
    },
  );

  it.skip(
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

  it.skip(
    "[P0] given any apiId when called then db.update().set().where() is called to scope the update to that apiId",
    async () => {
      const images = [makeOptimizedImage()];

      await updatePropertyImages("API-001", images);

      expect(mockWhere).toHaveBeenCalledOnce();
    },
  );

  it.skip(
    "[P1] given apiId and empty OptimizedImage array when called then db.update().set() includes images:[]",
    async () => {
      await updatePropertyImages("API-001", []);

      expect(mockSet).toHaveBeenCalledOnce();
      const setPayload = mockSet.mock.calls[0][0];
      expect(setPayload).toMatchObject({ images: [] });
    },
  );

  it.skip(
    "[P1] given apiId and OptimizedImage array when called then set() payload also includes syncedAt as a Date",
    async () => {
      const images = [makeOptimizedImage()];

      await updatePropertyImages("API-001", images);

      const setPayload = mockSet.mock.calls[0][0];
      expect(setPayload.syncedAt).toBeInstanceOf(Date);
    },
  );

  it.skip(
    "[P1] given apiId and OptimizedImage array when called then set() payload also includes updatedAt as a Date",
    async () => {
      const images = [makeOptimizedImage()];

      await updatePropertyImages("API-001", images);

      const setPayload = mockSet.mock.calls[0][0];
      expect(setPayload.updatedAt).toBeInstanceOf(Date);
    },
  );

  it.skip("[P2] given updatePropertyImages resolves successfully then the function returns void (undefined)", async () => {
    const images = [makeOptimizedImage()];

    const result = await updatePropertyImages("API-001", images);

    expect(result).toBeUndefined();
  });
});
