import 'dotenv/config';
import { db } from "../src/lib/db/client";
import { properties } from "../src/lib/db/schema/properties";
import { ilike, or } from "drizzle-orm";

async function run() {
  const res = await db.select({ id: properties.id, titleEn: properties.titleEn, areaSlug: properties.areaSlug, subLocation: properties.subLocation }).from(properties).where(
    or(
      ilike(properties.titleEn, '%rise%'),
      ilike(properties.descriptionEn, '%rise%')
    )
  );
  console.log(JSON.stringify(res, null, 2));
  process.exit(0);
}
run();
