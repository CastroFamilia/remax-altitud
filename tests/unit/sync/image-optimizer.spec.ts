/**
 * ATDD Red-Phase Scaffolds — Story 2.4: Image Optimization Pipeline
 * Module: src/lib/sync/image-optimizer.ts
 *
 * Covers AC #1–#7, #10 (image download, WebP conversion, variant generation,
 * error handling, empty-image short-circuit) + alt text template.
 *
 * All external I/O is mocked — no disk writes or real network calls.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Hoisted mock primitives — vi.hoisted() ensures these are available when the
// vi.mock() factory runs (which is hoisted to the top of the compiled output).
// ---------------------------------------------------------------------------

const { mockToFile, mockToBuffer, mockMetadata, mockWebp, mockResize, mockSharpInstance } =
  vi.hoisted(() => {
    const mockToFile = vi.fn().mockResolvedValue(undefined);
    const mockToBuffer = vi.fn().mockResolvedValue(Buffer.from("fake-lqip-webp-bytes"));
    const mockMetadata = vi.fn().mockResolvedValue({ width: 1200, height: 800, format: "jpeg" });
    const mockWebp = vi.fn().mockReturnValue({ toFile: mockToFile, toBuffer: mockToBuffer });
    const mockResize = vi.fn().mockReturnValue({ webp: mockWebp });
    const mockSharpInstance = {
      resize: mockResize,
      webp: mockWebp,
      metadata: mockMetadata,
    };
    return { mockToFile, mockToBuffer, mockMetadata, mockWebp, mockResize, mockSharpInstance };
  });

// ---------------------------------------------------------------------------
// Mock sharp — returns a chainable builder for .resize().webp().toFile() / .toBuffer() / .metadata()
// ---------------------------------------------------------------------------

vi.mock("sharp", () => ({
  default: vi.fn().mockReturnValue(mockSharpInstance),
}));

// ---------------------------------------------------------------------------
// Mock node:fs — prevent any real disk I/O
// ---------------------------------------------------------------------------

vi.mock("node:fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs")>();
  return {
    ...actual,
    mkdirSync: vi.fn(),
  };
});

// ---------------------------------------------------------------------------
// Imports — resolved after mocks are hoisted
// ---------------------------------------------------------------------------

import { optimizePropertyImages } from "@/lib/sync/image-optimizer";
import { mkdirSync } from "node:fs";
import sharp from "sharp";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal fake fetch Response for a successful image download. */
function makeFetchResponse(ok = true, status = 200): Response {
  const fakeBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]); // JPEG magic bytes
  return {
    ok,
    status,
    arrayBuffer: vi.fn().mockResolvedValue(fakeBytes.buffer),
  } as unknown as Response;
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();

  // Re-wire mock chains after clearAllMocks resets all return values
  mockToFile.mockResolvedValue(undefined);
  mockToBuffer.mockResolvedValue(Buffer.from("fake-lqip"));
  mockMetadata.mockResolvedValue({ width: 1200, height: 800 });
  mockWebp.mockReturnValue({ toFile: mockToFile, toBuffer: mockToBuffer });
  mockResize.mockReturnValue({ webp: mockWebp });

  // Re-wire the sharp factory itself — clearAllMocks clears mockReturnValue too
  vi.mocked(sharp).mockReturnValue(mockSharpInstance as unknown as ReturnType<typeof sharp>);

  global.fetch = vi.fn().mockResolvedValue(makeFetchResponse());
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// AC #10 — Empty images array: short-circuit, no fetch, no error
// ---------------------------------------------------------------------------

describe("optimizePropertyImages — empty images array (AC #10)", () => {
  it(
    "[P0] given rawImageUrls=[] when called then returns {optimized:[], errors:[]} without calling fetch",
    async () => {
      const result = await optimizePropertyImages("API-001", [], "House", "Pérez Zeledón");

      expect(result.optimized).toEqual([]);
      expect(result.errors).toEqual([]);
      expect(global.fetch).not.toHaveBeenCalled();
      expect(sharp).not.toHaveBeenCalled();
      expect(mkdirSync).not.toHaveBeenCalled();
    },
  );
});

// ---------------------------------------------------------------------------
// AC #1 — Download: fetch called with the URL
// ---------------------------------------------------------------------------

describe("optimizePropertyImages — image download (AC #1)", () => {
  it(
    "[P0] given 1 valid image URL when optimizePropertyImages called then fetch is called with that URL",
    async () => {
      const url = "https://cdn.example.com/photo1.jpg";

      await optimizePropertyImages("API-001", [url], "House", "Pérez Zeledón");

      expect(global.fetch).toHaveBeenCalledOnce();
      expect(global.fetch).toHaveBeenCalledWith(url);
    },
  );

  it("[P0] given 1 valid image URL when download succeeds then sharp is called with the buffer", async () => {
    const url = "https://cdn.example.com/photo1.jpg";

    await optimizePropertyImages("API-001", [url], "House", "Pérez Zeledón");

    // sharp is called multiple times: 3 variant resizes + 1 LQIP + 1 metadata
    expect(sharp).toHaveBeenCalled();
  });

  it(
    "[P0] given 1 valid URL when called then mkdirSync is called with recursive:true to ensure output dir exists",
    async () => {
      const url = "https://cdn.example.com/photo1.jpg";

      await optimizePropertyImages("API-001", [url], "House", "Pérez Zeledón");

      expect(mkdirSync).toHaveBeenCalledWith(expect.stringContaining("API-001"), { recursive: true });
    },
  );
});

// ---------------------------------------------------------------------------
// AC #2 — Variant sizes: exactly 3 widths (400, 800, 1600) in WebP
// ---------------------------------------------------------------------------

describe("optimizePropertyImages — 3 WebP variants at correct widths (AC #2)", () => {
  it(
    "[P0] given 1 valid image when generating variants then resize is called exactly 4 times (3 variants + 1 LQIP)",
    async () => {
      const url = "https://cdn.example.com/photo1.jpg";

      await optimizePropertyImages("API-001", [url], "House", "Pérez Zeledón");

      // 3 variant resizes + 1 LQIP resize = 4 calls to sharp().resize()
      expect(mockResize).toHaveBeenCalledTimes(4);
    },
  );

  it(
    "[P0] given 1 valid image when generating variants then resize is called for widths 400, 800, and 1600",
    async () => {
      const url = "https://cdn.example.com/photo1.jpg";

      await optimizePropertyImages("API-001", [url], "House", "Pérez Zeledón");

      const resizeWidths = mockResize.mock.calls.map((call) => call[0]);
      expect(resizeWidths).toContain(400);
      expect(resizeWidths).toContain(800);
      expect(resizeWidths).toContain(1600);
    },
  );

  it(
    "[P0] given 1 valid image when generating variants then all variant resize calls use fit:'inside' and withoutEnlargement:true",
    async () => {
      const url = "https://cdn.example.com/photo1.jpg";

      await optimizePropertyImages("API-001", [url], "House", "Pérez Zeledón");

      // Variant resizes (400, 800, 1600) should use these options
      const variantCalls = mockResize.mock.calls.filter((call) => [400, 800, 1600].includes(call[0]));
      for (const call of variantCalls) {
        expect(call[2]).toMatchObject({ fit: "inside", withoutEnlargement: true });
      }
    },
  );

  it(
    "[P1] given 1 valid image when generating variants then toFile is called 3 times (one per variant width)",
    async () => {
      const url = "https://cdn.example.com/photo1.jpg";

      await optimizePropertyImages("API-001", [url], "House", "Pérez Zeledón");

      expect(mockToFile).toHaveBeenCalledTimes(3);
    },
  );

  it(
    "[P1] given 1 valid image when generating variants then output paths match pattern public/property-images/{apiId}/{base}-{width}w.webp",
    async () => {
      const url = "https://cdn.example.com/photo1.jpg";

      await optimizePropertyImages("API-001", [url], "House", "Pérez Zeledón");

      const outPaths = mockToFile.mock.calls.map((call) => call[0] as string);
      expect(outPaths.some((p) => p.endsWith("photo1-400w.webp"))).toBe(true);
      expect(outPaths.some((p) => p.endsWith("photo1-800w.webp"))).toBe(true);
      expect(outPaths.some((p) => p.endsWith("photo1-1600w.webp"))).toBe(true);
    },
  );

  it(
    "[P1] given 1 valid image when generating LQIP then resize is called with width 20 for the blur placeholder",
    async () => {
      const url = "https://cdn.example.com/photo1.jpg";

      await optimizePropertyImages("API-001", [url], "House", "Pérez Zeledón");

      // LQIP resize must use width 20 (LQIP_SIZE constant) — the 4th resize call
      const resizeWidths = mockResize.mock.calls.map((call) => call[0]);
      expect(resizeWidths).toContain(20);
    },
  );

  it(
    "[P1] given 1 valid image when generating variants then webp() is called with quality ≤ 85 for all variant encodes",
    async () => {
      const url = "https://cdn.example.com/photo1.jpg";

      await optimizePropertyImages("API-001", [url], "House", "Pérez Zeledón");

      // All webp() calls should use quality ≤ 85 (AC #2 — NFR6)
      // mockWebp is called for each resize chain (3 variants + 1 LQIP = 4 calls)
      expect(mockWebp).toHaveBeenCalled();
      for (const call of mockWebp.mock.calls) {
        const opts = call[0] as { quality?: number } | undefined;
        if (opts?.quality !== undefined) {
          expect(opts.quality).toBeLessThanOrEqual(85);
        }
      }
    },
  );
});

// ---------------------------------------------------------------------------
// AC #5 — OptimizedImage shape (src, srcset, blurDataUrl, width:400, height, alt)
// ---------------------------------------------------------------------------

describe("optimizePropertyImages — OptimizedImage shape (AC #5)", () => {
  it(
    "[P0] given 1 valid image when processed then returned OptimizedImage has width:400 and correct src pointing to 400w variant",
    async () => {
      const url = "https://cdn.example.com/photo1.jpg";

      const result = await optimizePropertyImages("API-001", [url], "House", "Pérez Zeledón");

      expect(result.optimized).toHaveLength(1);
      const img = result.optimized[0];
      expect(img.width).toBe(400);
      expect(img.src).toMatch(/\/property-images\/API-001\/photo1-400w\.webp$/);
    },
  );

  it(
    "[P0] given 1 valid image when processed then returned OptimizedImage has srcset with all 3 width descriptors",
    async () => {
      const url = "https://cdn.example.com/photo1.jpg";

      const result = await optimizePropertyImages("API-001", [url], "House", "Pérez Zeledón");

      const img = result.optimized[0];
      expect(img.srcset).toContain("400w");
      expect(img.srcset).toContain("800w");
      expect(img.srcset).toContain("1600w");
    },
  );

  it(
    "[P0] given 1 valid image when processed then returned OptimizedImage has blurDataUrl as base64 data URI",
    async () => {
      const url = "https://cdn.example.com/photo1.jpg";

      const result = await optimizePropertyImages("API-001", [url], "House", "Pérez Zeledón");

      const img = result.optimized[0];
      expect(img.blurDataUrl).toMatch(/^data:image\/webp;base64,/);
    },
  );

  it(
    "[P0] given 1 valid image and 1200×800 source when processed then returned OptimizedImage has correct aspect-ratio height for 400w",
    async () => {
      // source is 1200×800 → aspect = 800/1200 ≈ 0.6667 → height at 400w = Math.round(400 × 0.6667) = 267
      mockMetadata.mockResolvedValue({ width: 1200, height: 800 });
      const url = "https://cdn.example.com/photo1.jpg";

      const result = await optimizePropertyImages("API-001", [url], "House", "Pérez Zeledón");

      const img = result.optimized[0];
      expect(img.height).toBe(267);
    },
  );

  it(
    "[P0] given 2 images, propertyType='House', location='Pérez Zeledón' when processed then first OptimizedImage.alt matches template",
    async () => {
      const urls = [
        "https://cdn.example.com/photo1.jpg",
        "https://cdn.example.com/photo2.jpg",
      ];

      const result = await optimizePropertyImages("API-001", urls, "House", "Pérez Zeledón");

      expect(result.optimized[0].alt).toBe("Photo 1 of 2 — House in Pérez Zeledón");
      expect(result.optimized[1].alt).toBe("Photo 2 of 2 — House in Pérez Zeledón");
    },
  );
});

// ---------------------------------------------------------------------------
// AC #6 — Pre-encoded URLs: optimizer receives them ready (no re-encoding)
// ---------------------------------------------------------------------------

describe("optimizePropertyImages — pre-encoded URLs (AC #6)", () => {
  it(
    "[P1] given URLs already encoded (no spaces) when called then fetch is called with the URL as-is (no re-encoding)",
    async () => {
      // The pipeline parser calls splitAndEncodeImages() before calling the optimizer.
      // The optimizer must NOT call it again — URLs arrive clean.
      const encodedUrl = "https://cdn.example.com/photo%201.jpg";

      await optimizePropertyImages("API-001", [encodedUrl], "House", "Pérez Zeledón");

      // fetch should receive the already-encoded URL unchanged
      expect(global.fetch).toHaveBeenCalledWith(encodedUrl);
    },
  );
});

// ---------------------------------------------------------------------------
// AC #7 — Error handling: non-2xx → log error, continue, no throw
// ---------------------------------------------------------------------------

describe("optimizePropertyImages — download failure handling (AC #7)", () => {
  it(
    "[P0] given fetch returns 404 when called then error is in errors array with apiId/imageIndex/url/error fields",
    async () => {
      const url = "https://cdn.example.com/missing.jpg";
      vi.mocked(global.fetch).mockResolvedValue(makeFetchResponse(false, 404));

      const result = await optimizePropertyImages("API-001", [url], "House", "Pérez Zeledón");

      expect(result.optimized).toEqual([]);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        apiId: "API-001",
        imageIndex: 0,
        url,
      });
      expect(result.errors[0].error).toBeTruthy();
    },
  );

  it(
    "[P0] given fetch throws a network error when called then error is in errors array and pipeline continues",
    async () => {
      const url = "https://cdn.example.com/broken.jpg";
      vi.mocked(global.fetch).mockRejectedValue(new Error("ECONNREFUSED"));

      const result = await optimizePropertyImages("API-001", [url], "House", "Pérez Zeledón");

      expect(result.optimized).toEqual([]);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain("ECONNREFUSED");
    },
  );

  it(
    "[P1] given 2 URLs where first fails and second succeeds when called then optimized has 1 entry and errors has 1 entry",
    async () => {
      const failUrl = "https://cdn.example.com/broken.jpg";
      const okUrl = "https://cdn.example.com/photo1.jpg";

      vi.mocked(global.fetch)
        .mockResolvedValueOnce(makeFetchResponse(false, 500)) // first fails
        .mockResolvedValueOnce(makeFetchResponse(true, 200)); // second succeeds

      const result = await optimizePropertyImages("API-001", [failUrl, okUrl], "House", "Pérez Zeledón");

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].url).toBe(failUrl);
      expect(result.optimized).toHaveLength(1);
    },
  );
});
