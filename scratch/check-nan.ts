import { config } from "dotenv";
config({ path: ".env.local" });
import { db } from "../src/lib/db/client";
import { properties } from "../src/lib/db/schema/properties";

async function main() {
  const rows = await db.select({ id: properties.id, lat: properties.latitude, lng: properties.longitude }).from(properties);
  let nanCount = 0;
  for (const row of rows) {
    if (Number.isNaN(row.lat) || Number.isNaN(row.lng)) {
      nanCount++;
      console.log('Found NaN:', row);
    }
  }
  console.log('Total NaN properties:', nanCount);
  process.exit(0);
}
main();
