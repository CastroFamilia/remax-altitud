import postgres from "postgres";

async function main() {
  const sql = postgres(process.env.DATABASE_URL as string);
  
  const rows = await sql`SELECT slug, title_en, images, api_id, price_usd FROM properties WHERE price_usd IN (160000, 110000, 96000) LIMIT 5`;
  
  for (const row of rows) {
    console.log(`\nProperty: ${row.title_en} (${row.api_id}) - Slug: ${row.slug} - Price: ${row.price_usd}`);
    console.log("Images (first 1):", JSON.stringify(row.images[0], null, 2));
  }
  
  await sql.end();
}

main().catch(console.error).finally(() => process.exit(0));
