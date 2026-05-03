import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { offices } from "@/lib/db/schema/offices";

/**
 * Fetches a single office by its UUID.
 * Used by the listing detail page to resolve the agent's office name.
 * Returns null if no office with that ID exists.
 *
 * Story 4.2, Task 5b.
 */
export async function getOfficeById(id: string) {
  const rows = await db.select().from(offices).where(eq(offices.id, id)).limit(1);
  return rows[0] ?? null;
}
