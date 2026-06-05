import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

// Define our buyer personas and their specific search criteria
const personas = [
  {
    id: "luxury_buyer",
    description: "Luxury buyer looking for ocean views",
    instruction: "Go to http://localhost:3000. Find the smart search input (usually in the navigation bar or hero section). Type exactly 'luxury home with ocean view in Dominical' and hit Enter. Wait for the page to load the search results. Look at the first 2 property cards. Summarize what properties you see and determine if they match the criteria of being a luxury home in Dominical with an ocean view.",
  },
  {
    id: "budget_investor",
    description: "Investor looking for cheap lots",
    instruction: "Go to http://localhost:3000. Find the smart search input. Type exactly 'cheap lot in Perez Zeledon under 50k' and hit Enter. Wait for the page to load the search results. Look at the first 2 property cards. Summarize what properties you see and determine if they match the criteria of being a lot in Perez Zeledon.",
  },
  {
    id: "family_home",
    description: "Family looking for a 3-bedroom house",
    instruction: "Go to http://localhost:3000. Find the smart search input. Type exactly '3 bedroom house for family' and hit Enter. Wait for the page to load the search results. Look at the first 2 property cards. Summarize what properties you see and determine if they match the criteria of being a house with at least 3 bedrooms.",
  }
];

async function runAgentForPersona(persona: typeof personas[0]) {
  console.log(`\n🤖 Starting agent: [${persona.id}] - ${persona.description}...`);
  
  try {
    // Run agent-browser in quiet mode, passing the persona ID as the session
    // We use the --json flag if we want structured output, but for now simple stdout is fine
    const cmd = `AGENT_BROWSER_SESSION=${persona.id} npx agent-browser -q chat "${persona.instruction}"`;
    
    // We increase maxBuffer in case the output is long
    const { stdout } = await execPromise(cmd, { maxBuffer: 1024 * 1024 * 10 });
    
    console.log(`\n✅ Agent [${persona.id}] finished successfully.`);
    console.log(`\n--- Result for ${persona.id} ---\n`);
    console.log(stdout.trim());
    console.log(`\n---------------------------------\n`);
    
  } catch (error: unknown) {
    console.error(`\n❌ Agent [${persona.id}] failed.`);
    const err = error as { stdout?: string; stderr?: string };
    if (err.stdout) {
      console.log(`\n--- Partial Output for ${persona.id} ---\n`);
      console.log(err.stdout.trim());
    }
    if (err.stderr) {
      console.error(`\n--- Error Details for ${persona.id} ---\n`);
      console.error(err.stderr.trim());
    }
  }
}

async function main() {
  console.log("🚀 Starting Multi-Agent Smart Search Test Suite\n");
  console.log(`Spawning ${personas.length} parallel agent browsers...\n`);
  
  // Run all personas concurrently
  const promises = personas.map(runAgentForPersona);
  await Promise.all(promises);
  
  console.log("\n🎉 All agent tests completed.");
}

main().catch((error) => {
  console.error("Test suite failed:", error);
  process.exit(1);
});
