import { db } from "../src/lib/db/client";
import { properties } from "../src/lib/db/schema/properties";
import { count, isNotNull } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function main() {
  console.log("DATABASE_URL:", process.env.DATABASE_URL);

  try {
    const totalCountRes = await db.select({ count: count() }).from(properties);
    console.log("Total properties in DB:", totalCountRes[0]?.count);

    const hasLatLongRes = await db
      .select({ count: count() })
      .from(properties)
      .where(isNotNull(properties.latitude));
    console.log("Properties with latitude in DB:", hasLatLongRes[0]?.count);

    const sampleProps = await db
      .select({
        id: properties.id,
        titleEn: properties.titleEn,
        latitude: properties.latitude,
        longitude: properties.longitude,
        geo: properties.geo,
      })
      .from(properties)
      .limit(5);
    console.log("Sample properties:");
    console.dir(sampleProps, { depth: null });
  } catch (error) {
    console.error("Error executing query:", error);
  }
}

main().then(() => process.exit(0));
