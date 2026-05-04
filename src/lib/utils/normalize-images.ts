/**
 * Normalizes property images from the database to the OptimizedImage format.
 *
 * The `properties.images` JSONB column can contain two formats:
 * 1. **OptimizedImage[]** — after the image-optimization pipeline has run.
 *    Each item has { src, srcset, blurDataUrl, width, height, alt }.
 * 2. **string[]** — raw CDN URLs from the RE/MAX CCA API sync, before the
 *    image-optimization pipeline processes them.
 *
 * This utility detects the format at runtime and converts raw URL strings
 * into a compatible OptimizedImage shape so gallery components can render
 * them without crashing on missing `.src` or `.blurDataUrl` properties.
 */

import type { OptimizedImage } from "@/types/images";

/**
 * Converts raw DB image data (which may be string[] or OptimizedImage[])
 * into a safe OptimizedImage[] that gallery components can consume.
 *
 * @param dbImages - The raw `images` JSONB value from the properties table
 * @param fallbackAlt - Alt text to use for raw URL images (e.g. property title)
 * @returns Normalized OptimizedImage array (may be empty)
 */
export function normalizePropertyImages(
  dbImages: unknown,
  fallbackAlt: string = "Property photo",
): OptimizedImage[] {
  if (!dbImages || !Array.isArray(dbImages) || dbImages.length === 0) {
    return [];
  }

  return dbImages
    .map((item, index): OptimizedImage | null => {
      // Already an OptimizedImage object — use as-is (with defensive fallbacks)
      if (typeof item === "object" && item !== null && "src" in item) {
        const img = item as OptimizedImage;
        return {
          src: img.src || "",
          srcset: img.srcset || "",
          blurDataUrl: img.blurDataUrl || "",
          width: img.width || 400,
          height: img.height || 300,
          alt: img.alt || `${fallbackAlt} — Photo ${index + 1}`,
        };
      }

      // Raw URL string from API sync — convert to OptimizedImage shape
      if (typeof item === "string" && item.length > 0) {
        return {
          src: item,
          srcset: "",
          blurDataUrl: "",
          width: 400,
          height: 300,
          alt: `${fallbackAlt} — Photo ${index + 1}`,
        };
      }

      // Unknown format — skip (filtered out below)
      return null;
    })
    .filter((img): img is OptimizedImage => img !== null);
}
