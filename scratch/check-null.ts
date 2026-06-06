import { config } from "dotenv";
config({ path: ".env.local" });
import { db } from "../src/lib/db/client";
import { properties } from "../src/lib/db/schema/properties";
import { isNull } from "drizzle-orm";

async function main() {
  const rows = await db.select({ id: properties.id }).from(properties).where(isNull(properties.latitude));
  console.log('Total NULL properties:', rows.length);
  process.exit(0);
}
main();
