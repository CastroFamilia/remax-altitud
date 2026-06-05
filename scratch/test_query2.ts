import 'dotenv/config';
import { db } from "../src/lib/db/client";
import { properties } from "../src/lib/db/schema/properties";
import { eq } from "drizzle-orm";

async function run() {
  const res = await db.select({ id: properties.id, apiRaw: properties.apiRaw, subLocation: properties.subLocation }).from(properties).where(eq(properties.id, 'bcfe26f6-e994-4a35-a109-405b50677ec7'));
  console.log(JSON.stringify(res, null, 2));
  process.exit(0);
}
run();
