#!/usr/bin/env tsx
import Module from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as dotenv from "dotenv";
import type { OptimizedImage } from "../src/types/images";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const originalResolve = (Module as any)._resolveFilename;
const shimPath = path.resolve(__dirname, "server-only-shim.js");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(Module as any)._resolveFilename = function (
  request: string,
  parent: unknown,
  isMain: boolean,
  options: unknown,
) {
  if (request === "server-only") {
    return shimPath;
  }
  return originalResolve.call(this, request, parent, isMain, options);
};

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") });
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

async function main() {
  console.log("Starting retroactive community image optimization...");

  const { db } = await import("../src/lib/db/client");
  const { communities } = await import("../src/lib/db/schema");
  const { optimizeCommunityImage } = await import("../src/lib/sync/image-optimizer");
  const { eq } = await import("drizzle-orm");

  try {
    const list = await db.select().from(communities);
    console.log(`Found ${list.length} communities to process.`);

    for (const comm of list) {
      console.log(`\nProcessing community: ${comm.name} (${comm.slug})`);

      const updates: {
        heroImage?: OptimizedImage;
        siteMapImage?: OptimizedImage;
      } = {};

      if (comm.heroImageUrl && !comm.heroImage) {
        console.log(`  Optimizing hero image: ${comm.heroImageUrl}`);
        const optimizedHero = await optimizeCommunityImage(
          comm.slug,
          comm.heroImageUrl,
          "hero",
          comm.name,
        );
        if (optimizedHero) {
          updates.heroImage = optimizedHero;
          console.log(`  Hero image optimized successfully!`);
        } else {
          console.warn(`  Failed to optimize hero image.`);
        }
      } else if (comm.heroImage) {
        console.log(`  Hero image already optimized.`);
      }

      if (comm.siteMapImageUrl && !comm.siteMapImage) {
        console.log(`  Optimizing sitemap image: ${comm.siteMapImageUrl}`);
        const optimizedSiteMap = await optimizeCommunityImage(
          comm.slug,
          comm.siteMapImageUrl,
          "sitemap",
          comm.name,
        );
        if (optimizedSiteMap) {
          updates.siteMapImage = optimizedSiteMap;
          console.log(`  Sitemap image optimized successfully!`);
        } else {
          console.warn(`  Failed to optimize sitemap image.`);
        }
      } else if (comm.siteMapImage) {
        console.log(`  Sitemap image already optimized.`);
      }

      if (Object.keys(updates).length > 0) {
        await db
          .update(communities)
          .set(updates)
          .where(eq(communities.id, comm.id));
        console.log(`  Database updated for ${comm.name}.`);
      }
    }

    console.log("\nRetroactive community image optimization complete!");
  } catch (err) {
    console.error("Migration script failed:", err);
  }
  process.exit(0);
}

main();
