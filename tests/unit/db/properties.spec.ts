/**
 * ATDD Scaffolds — Story 2.4: Image Optimization Pipeline
 * Module: src/lib/db/queries/properties.ts → updatePropertyImages()
 *
 * Covers AC #4 (properties.images JSONB overwritten with OptimizedImage[]).
 *
 * DB calls are mocked via vi.mock — no live DATABASE_URL required.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Hoisted mock primitives — vi.hoisted() ensures these are available when the
// vi.mock() factory runs (which is hoisted to the top of the compiled output).
// ---------------------------------------------------------------------------

const { mockWhere, mockSet, mockUpdate } = vi.hoisted(() => {
  const mockWhere = vi.fn().mockResolvedValue(undefined);
  const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
  const mockUpdate = vi.fn().mockReturnValue({ set: mockSet });
  return { mockWhere, mockSet, mockUpdate };
});

// ---------------------------------------------------------------------------
// Mock Drizzle client before any module under test is imported
// ---------------------------------------------------------------------------

vi.mock("@/lib/db/client", () => ({
  db: {
    update: mockUpdate,
  },
}));

// ---------------------------------------------------------------------------
// Imports — resolved after mocks are hoisted
// ---------------------------------------------------------------------------

import { updatePropertyImages, updatePropertyTranslations } from "@/lib/db/queries/properties";
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
  // Re-wire the chain after clearAllMocks resets return values
  mockSet.mockReturnValue({ where: mockWhere });
  mockUpdate.mockReturnValue({ set: mockSet });
  mockWhere.mockResolvedValue(undefined);
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
