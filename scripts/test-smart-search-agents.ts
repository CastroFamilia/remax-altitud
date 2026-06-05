import puppeteer from "puppeteer";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("❌ GEMINI_API_KEY is not set in .env.local.");
  process.exit(1);
}

// Initialize the official Google GenAI client
const ai = new GoogleGenAI({ apiKey });

const personas = [
  {
    id: "luxury_buyer",
    description: "Luxury buyer looking for ocean views in Dominical",
    query: "luxury home with ocean view in Dominical",
  },
  {
    id: "budget_investor",
    description: "Investor looking for cheap lots in Perez Zeledon",
    query: "cheap lot in Perez Zeledon under 50k",
  },
  {
    id: "family_home",
    description: "Family looking for a 3-bedroom house",
    query: "3 bedroom house",
  }
];

async function evaluateResultsWithGemini(persona: typeof personas[0], pageText: string) {
  const prompt = `
You are an AI testing agent acting as the following persona:
Persona: ${persona.description}

You went to a real estate website and typed the following into the Smart Search bar:
"${persona.query}"

Below is the text extracted from the search results page.
Please review the properties listed. 
1. Do the properties match the search criteria? (Note: In real estate, if someone asks for a "3 bedroom house", returning a house with 3 OR MORE bedrooms is considered a MATCH, as long as it fits their other criteria).
2. Give a brief summary of what was found.
3. End your response with a final verdict on a new line: "VERDICT: PASS" or "VERDICT: FAIL".

--- PAGE TEXT EXTRACT ---
${pageText.substring(0, 8000)} // Truncating to avoid context overload if there are too many properties
--- END PAGE TEXT ---
  `;

  const response = await ai.models.generateContent({
    model: "gemini-flash-latest",
    contents: prompt,
  });

  return response.text;
}

async function runAgent(persona: typeof personas[0]) {
  console.log(`\n🤖 Starting agent: [${persona.id}] - ${persona.description}`);
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    // 1. Set viewport to desktop to ensure desktop search renders
    await page.setViewport({ width: 1280, height: 800 });
    
    // 2. Go to homepage
    await page.goto("https://dev.remax-altitud.cr/en", { waitUntil: "networkidle2" });
    
    // 3. Find the smart search input
    const searchInputSelector = 'input[type="search"]';
    await page.waitForSelector(searchInputSelector, { timeout: 10000 });
    
    // 4. Type the query
    await page.type(searchInputSelector, persona.query, { delay: 50 });
    
    // 5. Hit Enter to submit the search
    await page.keyboard.press('Enter');
    
    // Wait for the results to load (Next.js does client-side routing, so we wait for network idle manually)
    await new Promise((resolve) => setTimeout(resolve, 5000));
    
    // 6. Extract the text of the main content area
    const pageText = await page.evaluate(() => {
      const main = document.querySelector('main') || document.body;
      return main.innerText;
    });

    // 7. Pass the extracted text to Gemini for evaluation
    const evaluation = await evaluateResultsWithGemini(persona, pageText);
    
    console.log(`\n✅ Agent [${persona.id}] evaluation complete:`);
    console.log(`\n--- Result for ${persona.id} ---\n`);
    console.log(evaluation?.trim());
    console.log(`\n---------------------------------\n`);

  } catch (error) {
    console.error(`\n❌ Agent [${persona.id}] encountered an error:`, error);
    await page.screenshot({ path: `error-${persona.id}.png` });
  } finally {
    await browser.close();
  }
}

async function main() {
  console.log("🚀 Starting Multi-Agent Smart Search Test Suite (Powered by Gemini)\n");
  
  // Run tests sequentially to avoid overloading the local dev server and Gemini rate limits
  for (const persona of personas) {
    await runAgent(persona);
  }
  
  console.log("\n🎉 All agent tests completed.");
}

main().catch((error) => {
  console.error("Test suite failed:", error);
  process.exit(1);
});
