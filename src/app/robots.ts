/**
 * robots.txt via Next.js App Router — Task 6 (Story 4.4)
 *
 * Next.js App Router convention: this file auto-serves at /robots.txt.
 * Disallows /api/ and search pages (to avoid indexing query string variations).
 */

import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/en/search", "/es/search"],
    },
    sitemap: "https://remax-altitud.cr/sitemap.xml",
  };
}
