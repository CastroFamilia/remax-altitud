import { db } from "../src/lib/db/client";
import { communities } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const result = await db.select().from(communities).where(eq(communities.slug, "rise-costa-rica"));
  console.log(result[0]?.heroImageUrl);
  process.exit(0);
}
main();
