import * as dotenv from "dotenv";
dotenv.config({ path: "/Users/alejandracastro/Desktop/ALTITUD HUB/.env.local" });

import { db } from "../src/lib/db/client";
import { sql } from "drizzle-orm";

async function main() {
  console.log("=== DB Property Types ===");
  const types = await db.execute(sql`SELECT property_type, COUNT(*) as count FROM properties GROUP BY property_type`);
  console.log(JSON.stringify(types, null, 2));

  console.log("=== DB Properties containing 'rio' or 'river' ===");
  const containingRio = await db.execute(sql`
    SELECT id, slug, title_en, title_es, property_type, lifestyle_tags, is_visible 
    FROM properties 
    WHERE title_en ILIKE '%river%' 
       OR title_es ILIKE '%rio%' 
       OR title_es ILIKE '%río%'
       OR description_en ILIKE '%river%'
       OR description_es ILIKE '%rio%'
       OR description_es ILIKE '%río%'
  `);
  console.log(`Found ${containingRio.length} properties:`);
  console.log(JSON.stringify(containingRio.slice(0, 10), null, 2));

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
