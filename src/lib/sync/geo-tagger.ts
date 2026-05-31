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

  // Also correct/tag all properties to their closest area based on coordinate distance
  await db.execute(sql`
    UPDATE properties p
    SET area_id = sub.area_id,
        area_slug = sub.area_slug
    FROM (
      SELECT DISTINCT ON (p2.id)
        p2.id AS property_id,
        a.id AS area_id,
        a.slug AS area_slug
      FROM properties p2
      CROSS JOIN areas a
      WHERE p2.latitude IS NOT NULL 
        AND p2.longitude IS NOT NULL 
        AND a.latitude IS NOT NULL 
        AND a.longitude IS NOT NULL
      ORDER BY p2.id, ST_Distance(
        ST_SetSRID(ST_Point(p2.longitude, p2.latitude), 4326)::geography,
        ST_SetSRID(ST_Point(a.longitude, a.latitude), 4326)::geography
      ) ASC
    ) sub
    WHERE p.id = sub.property_id
  `);

  return result.count ?? 0;
}
