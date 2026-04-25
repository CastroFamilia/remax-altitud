import "server-only";
import path from "node:path";
import { mkdirSync } from "node:fs";
import sharp from "sharp";
import type { OptimizedImage } from "@/types/images";

/** Responsive variant widths to generate per source image. */
const SIZES = [400, 800, 1600] as const;

/** Width (px) of the Low Quality Image Placeholder (blur hash). */
const LQIP_SIZE = 20;

/** Absolute path to the Docker-volume public directory for optimized images. */
const OUTPUT_BASE_DIR = path.join(process.cwd(), "public", "property-images");

/** Structured error record for a failed image download or encode. */
export interface ImageOptimizeError {
  apiId: string;
  imageIndex: number;
  url: string;
  error: string;
}

/**
 * Downloads, converts to WebP at 3 responsive sizes, and generates an LQIP
 * for each source image URL in `rawImageUrls`.
 *
 * URLs must already be URL-encoded (the parser calls `splitAndEncodeImages`
 * before this function — do NOT call it again here).
 *
 * AC #1–#7, #10 from Story 2.4.
 *
 * @param apiId          - Property API ID (used as folder name under public/property-images/)
 * @param rawImageUrls   - Pre-encoded image URLs from the property record
 * @param propertyType   - Human-readable property type for the alt text template
 * @param location       - Location string for the alt text template
 * @returns              - `{ optimized: OptimizedImage[], errors: ImageOptimizeError[] }`
 */
export async function optimizePropertyImages(
  apiId: string,
  rawImageUrls: string[],
  propertyType: string,
  location: string,
): Promise<{ optimized: OptimizedImage[]; errors: ImageOptimizeError[] }> {
  // AC #10 — short-circuit if no images
  if (rawImageUrls.length === 0) {
    return { optimized: [], errors: [] };
  }

  const optimized: OptimizedImage[] = [];
  const errors: ImageOptimizeError[] = [];

  // Ensure the output directory exists (idempotent, recursive)
  const dir = path.join(OUTPUT_BASE_DIR, apiId);
  mkdirSync(dir, { recursive: true });

  for (let i = 0; i < rawImageUrls.length; i++) {
    const url = rawImageUrls[i];

    // --- Download ---
    let buffer: Buffer;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        errors.push({
          apiId,
          imageIndex: i,
          url,
          error: `HTTP ${response.status} — non-2xx response`,
        });
        continue;
      }
      const arrayBuffer = await response.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } catch (err: unknown) {
      errors.push({
        apiId,
        imageIndex: i,
        url,
        error: err instanceof Error ? err.message : String(err),
      });
      continue;
    }

    // --- Derive filename base ---
    let base: string;
    try {
      const pathname = new URL(url).pathname;
      const basename = path.basename(pathname);
      base = basename.replace(/\.[^.]+$/, "");
    } catch {
      base = "";
    }
    if (!base) {
      base = `image-${i}`;
    }

    // --- Generate 3 responsive WebP variants ---
    const variants: { width: number; relUrl: string }[] = [];
    for (const width of SIZES) {
      const outPath = path.join(dir, `${base}-${width}w.webp`);
      await sharp(buffer)
        .resize(width, undefined, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(outPath);
      variants.push({
        width,
        relUrl: `/property-images/${apiId}/${base}-${width}w.webp`,
      });
    }

    // --- Generate LQIP (blur placeholder) ---
    const lqipBuf = await sharp(buffer)
      .resize(LQIP_SIZE, undefined, { fit: "inside" })
      .webp({ quality: 20 })
      .toBuffer();
    const blurDataUrl = `data:image/webp;base64,${lqipBuf.toString("base64")}`;

    // --- Extract dimensions for aspect-ratio-correct height ---
    const meta = await sharp(buffer).metadata();
    const aspectRatio = (meta.height ?? 800) / (meta.width ?? 1200);
    const height = Math.round(400 * aspectRatio);

    // --- Alt text ---
    const alt = `Photo ${i + 1} of ${rawImageUrls.length} — ${propertyType} in ${location}`;

    // --- srcset ---
    const srcset = `${variants[0].relUrl} 400w, ${variants[1].relUrl} 800w, ${variants[2].relUrl} 1600w`;

    optimized.push({
      src: variants[0].relUrl,
      srcset,
      blurDataUrl,
      width: 400,
      height,
      alt,
    });
  }

  return { optimized, errors };
}
