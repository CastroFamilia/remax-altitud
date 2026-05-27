/**
 * Dynamic XML sitemap — Task 6 (Story 4.4)
 *
 * Next.js App Router convention: this file auto-serves at /sitemap.xml.
 * Must be at src/app/sitemap.ts (NOT inside [locale] subfolder).
 *
 * Sitemap includes all listing, agent, and static page URLs in both EN and ES locales.
 * Area/community entries are stubbed (empty array) until Epic 6 adds real queries.
 *
 * Performance: getAllPropertySlugs() and getAllAgentSlugs() run in Promise.all.
 * Next.js caches the sitemap at the CDN edge layer; revalidates on next request
 * after the sync pipeline finishes (NFR27).
 */

import type { MetadataRoute } from "next";
import { getAllPropertySlugs } from "@/lib/db/queries/properties";
import { getAllAgentSlugs } from "@/lib/db/queries/agents";
import { getAllAreaSlugs } from "@/lib/db/queries/areas";
import { getAllCommunityParams } from "@/lib/db/queries/communities";
import { SITE_ORIGIN, LOCALES } from "@/lib/seo/constants";

const staticRoutes = ["", "/search", "/about", "/contact", "/services", "/join"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const [propertySlugs, agentSlugs, areaSlugs, communityParams] = await Promise.all([
      getAllPropertySlugs(),
      getAllAgentSlugs(),
      getAllAreaSlugs(),
      getAllCommunityParams(),
    ]);

    const staticEntries: MetadataRoute.Sitemap = LOCALES.flatMap((locale) =>
      staticRoutes.map((route) => ({
        url: `${SITE_ORIGIN}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: route === "" ? 1.0 : 0.5,
      })),
    );

    const propertyEntries: MetadataRoute.Sitemap = LOCALES.flatMap((locale) =>
      propertySlugs.map((slug) => ({
        url: `${SITE_ORIGIN}/${locale}/property/${slug}`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 0.8,
      })),
    );

    const agentEntries: MetadataRoute.Sitemap = LOCALES.flatMap((locale) =>
      agentSlugs.map((slug) => ({
        url: `${SITE_ORIGIN}/${locale}/agents/${slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
    );

    const areaEntries: MetadataRoute.Sitemap = LOCALES.flatMap((locale) =>
      areaSlugs.map((slug) => ({
        url: `${SITE_ORIGIN}/${locale}/areas/${slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    );

    const communityEntries: MetadataRoute.Sitemap = LOCALES.flatMap((locale) =>
      communityParams.map((params) => ({
        url: `${SITE_ORIGIN}/${locale}/areas/${params.slug}/communities/${params.community}`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 0.7,
      })),
    );

    return [...staticEntries, ...propertyEntries, ...agentEntries, ...areaEntries, ...communityEntries];
  } catch {
    // Build continues; sitemap generates on-demand at runtime
    return [];
  }
}
