import { db } from "./src/lib/db/client";
import { agents } from "./src/lib/db/schema/agents";
import { eq } from "drizzle-orm";
async function main() {
  const allAgents = await db.select().from(agents);
  console.log("Total agents:", allAgents.length);
  const activeAgents = await db.select().from(agents).where(eq(agents.isActive, true));
  console.log("Active agents:", activeAgents.length);
  process.exit(0);
}
main().catch(console.error);
