/**
 * Quick diagnostic: dump all distinct Location + LocationId values from apiRaw
 * to understand the RECONNECT API's location taxonomy.
 * Run: npx tsx src/lib/db/scripts/analyze-locations.ts
 */
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";

config({ path: ".env.local" });
config({ path: ".env.development.local" });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("No DATABASE_URL found in environment");
  process.exit(1);
}

const client = postgres(connectionString, { prepare: false, max: 1 });
const db = drizzle(client);

async function main() {
  console.log("🔍 RECONNECT API Location taxonomy analysis\n");

  const rows = await db.execute(sql`
    SELECT 
      api_raw->>'Location' AS location,
      api_raw->>'LocationId' AS location_id,
      api_raw->>'StateDepProv' AS state,
      api_raw->>'StateDepProvId' AS state_id,
      area_slug,
      COUNT(*) AS property_count
    FROM properties
    WHERE is_visible = true
    GROUP BY 
      api_raw->>'Location', 
      api_raw->>'LocationId',
      api_raw->>'StateDepProv',
      api_raw->>'StateDepProvId',
      area_slug
    ORDER BY area_slug, property_count DESC
  `);

  console.log(`Found ${rows.length} distinct Location combinations.\n`);
  console.log("─".repeat(120));
  console.log(
    "Location".padEnd(45) +
    "LocID".padEnd(8) +
    "State".padEnd(15) +
    "StID".padEnd(6) +
    "Current Area".padEnd(25) +
    "Count"
  );
  console.log("─".repeat(120));

  for (const row of rows) {
    const r = row as Record<string, unknown>;
    console.log(
      String(r.location ?? "(null)").padEnd(45) +
      String(r.location_id ?? "").padEnd(8) +
      String(r.state ?? "").padEnd(15) +
      String(r.state_id ?? "").padEnd(6) +
      String(r.area_slug ?? "").padEnd(25) +
      String(r.property_count)
    );
  }

  // Show LocationId → Location mapping (the API's own IDs)
  console.log("\n\n📋 LocationId → Location mapping (RECONNECT's IDs):\n");
  
  const idMap = await db.execute(sql`
    SELECT 
      api_raw->>'LocationId' AS location_id,
      api_raw->>'Location' AS location,
      COUNT(*) AS cnt
    FROM properties
    WHERE api_raw->>'LocationId' IS NOT NULL
    GROUP BY api_raw->>'LocationId', api_raw->>'Location'
    ORDER BY (api_raw->>'LocationId')::int
  `);

  for (const row of idMap) {
    const r = row as Record<string, unknown>;
    console.log(`  ID ${String(r.location_id).padEnd(6)} → ${String(r.location).padEnd(50)} (${r.cnt} properties)`);
  }

  await client.end();
  console.log("\n✨ Done!");
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
