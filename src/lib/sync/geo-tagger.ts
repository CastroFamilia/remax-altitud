import "server-only";
import { db } from "@/lib/db/client";
import { sql } from "drizzle-orm";

export async function autoTagCommunities(): Promise<number> {
  const result = await db.execute(sql`
    UPDATE properties p
    SET community_id = c.id,
        area_id = c.area_id,
        area_slug = a.slug
    FROM communities c
    JOIN areas a ON c.area_id = a.id
    WHERE ST_Within(p.geo::geometry, c.geo_fence::geometry)
      AND p.community_id IS NULL
      AND p.geo IS NOT NULL
  `);
  return result.count ?? 0;
}
