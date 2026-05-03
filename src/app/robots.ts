/**
 * robots.txt via Next.js App Router — Task 6 (Story 4.4)
 *
 * Stub file created for ATDD red-phase test compilation.
 * Implementation is filled in during the dev phase.
 *
 * Next.js App Router convention: this file auto-serves at /robots.txt.
 */

import type { MetadataRoute } from "next";

/**
 * Returns the robots.txt configuration.
 * Allows all paths except /api/ and search pages (to avoid indexing query strings).
 *
 * TODO: Implement in Task 6 (Story 4.4)
 */
export default function robots(): MetadataRoute.Robots {
  // TODO: Implement — return rules allowing / and disallowing /api/, search pages
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [],
    },
    sitemap: "https://remax-altitud.cr/sitemap.xml",
  };
}
