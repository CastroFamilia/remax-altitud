import "server-only";
import path from "node:path";
import { mkdirSync } from "node:fs";
import sharp from "sharp";
import type { OptimizedImage } from "@/types/images";

/** Responsive variant widths to generate per source image. */
const SIZES = [400, 800, 1600] as const;

/** Width (px) of the Low Quality Image Placeholder (blur hash). */
const LQIP_SIZE = 20;

/**
 * Hard timeout for a single source image download (ms). Prevents a single
 * hung Azure CDN connection from stalling the entire sync run.
 */
const FETCH_TIMEOUT_MS = 30_000;

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
      // Wrap fetch in an AbortController so a hung CDN connection cannot
      // stall the entire sync run (NFR15 guardrail).
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      let response: Response;
      try {
        response = await fetch(url, { signal: controller.signal });
      } finally {
        clearTimeout(timeoutId);
      }
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
    // Suffix with the index to avoid collisions when two source URLs share the
    // same basename (e.g. ".../v1/photo1.jpg" and ".../v2/photo1.jpg") which
    // would otherwise overwrite each other's variants under the apiId folder.
    let base: string;
    try {
      const pathname = new URL(url).pathname;
      const basename = path.basename(decodeURIComponent(pathname));
      base = basename.replace(/\.[^.]+$/, "");
    } catch {
      base = "";
    }
    if (!base) {
      base = `image-${i}`;
    } else {
      base = `${base}-${i}`;
    }

    // --- Encode + write variants + LQIP + metadata ---
    // Wrapped in a single try/catch so an encode/disk/metadata failure for one
    // source image is logged as a structured error rather than crashing the
    // entire sync run (AC #7 — pipeline continues with remaining images).
    try {
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
      // Guard against zero or undefined width to avoid division-by-zero
      // (e.g. corrupt image that decodes but reports 0×0 dimensions).
      const srcWidth = meta.width && meta.width > 0 ? meta.width : 1200;
      const srcHeight = meta.height ?? 800;
      const aspectRatio = srcHeight / srcWidth;
      const height = Math.round(SIZES[0] * aspectRatio);

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
        fallbackSrc: url,
      });
    } catch (err: unknown) {
      errors.push({
        apiId,
        imageIndex: i,
        url,
        error: err instanceof Error ? err.message : String(err),
      });
      continue;
    }
  }

  return { optimized, errors };
}

/** Absolute path to the Docker-volume public directory for community optimized images. */
const COMMUNITY_OUTPUT_BASE_DIR = path.join(process.cwd(), "public", "community-images");

/**
 * Downloads, converts to WebP at 3 responsive sizes, and generates an LQIP
 * for a single community image URL.
 *
 * @param communitySlug  - Community slug (used as folder name under public/community-images/)
 * @param url            - The image URL (can be a remote HTTP URL or local static path)
 * @param type           - "hero" | "sitemap" (used to name the variants)
 * @param communityName  - Community name for alt text template
 * @returns              - Promise<OptimizedImage | null>
 */
export async function optimizeCommunityImage(
  communitySlug: string,
  url: string,
  type: "hero" | "sitemap",
  communityName: string,
): Promise<OptimizedImage | null> {
  if (!url || url.trim() === "") {
    return null;
  }

  // Ensure output directory exists: public/community-images/${communitySlug}/${type}
  const dir = path.join(COMMUNITY_OUTPUT_BASE_DIR, communitySlug, type);
  mkdirSync(dir, { recursive: true });

  // --- Download or read file ---
  let buffer: Buffer;
  try {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      let response: Response;
      try {
        response = await fetch(url, { signal: controller.signal });
      } finally {
        clearTimeout(timeoutId);
      }
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} — non-2xx response`);
      }
      const arrayBuffer = await response.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else if (url.startsWith("/")) {
      const fs = await import("node:fs");
      const localPath = path.join(process.cwd(), "public", url);
      buffer = fs.readFileSync(localPath);
    } else {
      throw new Error(`Unsupported URL protocol for: ${url}`);
    }
  } catch (err: unknown) {
    console.error(`[optimizeCommunityImage] Failed to fetch or read community image ${url}:`, err);
    return null;
  }

  const base = `${type}`;

  try {
    const variants: { width: number; relUrl: string }[] = [];
    for (const width of SIZES) {
      const outPath = path.join(dir, `${base}-${width}w.webp`);
      await sharp(buffer)
        .resize(width, undefined, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(outPath);
      variants.push({
        width,
        relUrl: `/community-images/${communitySlug}/${type}/${base}-${width}w.webp`,
      });
    }

    const lqipBuf = await sharp(buffer)
      .resize(LQIP_SIZE, undefined, { fit: "inside" })
      .webp({ quality: 20 })
      .toBuffer();
    const blurDataUrl = `data:image/webp;base64,${lqipBuf.toString("base64")}`;

    const meta = await sharp(buffer).metadata();
    const srcWidth = meta.width && meta.width > 0 ? meta.width : 1200;
    const srcHeight = meta.height ?? 800;
    const aspectRatio = srcHeight / srcWidth;
    const height = Math.round(SIZES[0] * aspectRatio);

    const alt =
      type === "hero"
        ? `Hero photo of community ${communityName}`
        : `Site map layout of community ${communityName}`;

    const srcset = `${variants[0].relUrl} 400w, ${variants[1].relUrl} 800w, ${variants[2].relUrl} 1600w`;

    return {
      src: variants[0].relUrl,
      srcset,
      blurDataUrl,
      width: 400,
      height,
      alt,
      fallbackSrc: url,
    };
  } catch (err: unknown) {
    console.error(`[optimizeCommunityImage] Failed to optimize image ${url}:`, err);
    return null;
  }
}
