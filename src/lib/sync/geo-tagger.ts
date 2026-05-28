import "server-only";
import { db } from "@/lib/db/client";
import { sql } from "drizzle-orm";

export async function autoTagCommunities(): Promise<number> {
  const result = await db.execute(sql`
    UPDATE properties p
    SET community_id = c.id
    FROM communities c
    WHERE ST_Within(p.geo::geometry, c.geo_fence::geometry)
      AND p.community_id IS NULL
      AND p.geo IS NOT NULL
  `);
  return result.count ?? 0;
}
