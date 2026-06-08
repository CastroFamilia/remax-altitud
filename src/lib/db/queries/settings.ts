import "server-only";
import { db } from "@/lib/db/client";
import { settings } from "@/lib/db/schema/settings";
import { eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";

/**
 * Fetches a setting value from the database and caches it using Next.js unstable_cache.
 * This prevents hitting the database on every layout render path request.
 */
export const getCachedSetting = unstable_cache(
  async (key: string): Promise<string | null> => {
    try {
      const result = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
      return result[0]?.value || null;
    } catch (error) {
      console.error(`Failed to fetch setting "${key}" from DB:`, error);
      return null;
    }
  },
  ["admin-settings-cache"],
  {
    tags: ["settings"],
  },
);
