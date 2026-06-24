import { getAllAgents } from "./src/lib/db/queries/agents";
async function main() {
  const agents = await getAllAgents();
  console.log("Agents count:", agents.length);
  process.exit(0);
}
main().catch(console.error);
