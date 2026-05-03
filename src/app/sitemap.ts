/**
 * Dynamic XML sitemap — Task 6 (Story 4.4)
 *
 * Stub file created for ATDD red-phase test compilation.
 * Implementation is filled in during the dev phase.
 *
 * Next.js App Router convention: this file auto-serves at /sitemap.xml.
 * Must be at src/app/sitemap.ts (NOT inside [locale] subfolder).
 */

import type { MetadataRoute } from "next";

// TODO: Implement getAllPropertySlugs and getAllAgentSlugs imports in Task 6
// import { getAllPropertySlugs } from "@/lib/db/queries/properties";
// import { getAllAgentSlugs } from "@/lib/db/queries/agents";

/**
 * Returns the full sitemap for all listing, agent, area, and static pages
 * in both EN and ES locales.
 *
 * TODO: Implement in Task 6 (Story 4.4)
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // TODO: Implement — query DB for slugs and build sitemap entries
  return [];
}
