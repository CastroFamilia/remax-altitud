import * as dotenv from "dotenv";
dotenv.config({ path: "/Users/alejandracastro/Desktop/ALTITUD HUB/.env.local" });

import { db } from "../src/lib/db/client";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Fetching areas from DB...");
  const areas = await db.execute(sql`SELECT id, slug, name_en, region, property_count FROM areas`);
  console.log("Areas in DB:", JSON.stringify(areas, null, 2));

  console.log("Fetching unique property area slugs...");
  const propSlugs = await db.execute(sql`SELECT area_slug, COUNT(*) as count FROM properties GROUP BY area_slug`);
  console.log("Property area_slug counts:", JSON.stringify(propSlugs, null, 2));
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
