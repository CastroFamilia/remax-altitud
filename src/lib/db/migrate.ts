import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

config({ path: ".env.local" });
config({ path: ".env", override: false });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error(
    "DATABASE_URL is not set. Populate .env.local (see .env.example) before running migrations.",
  );
  process.exit(1);
}

async function main() {
  const client = postgres(connectionString!, { max: 1, prepare: false });
  const db = drizzle(client);

  try {
    // Belt-and-suspenders: migration 0000_enable_postgis.sql now owns the
    // extension, but keep an idempotent bootstrap here so the runner stays
    // safe when invoked against unfamiliar targets.
    console.log("Ensuring PostGIS extension is installed…");
    try {
      await client`CREATE EXTENSION IF NOT EXISTS postgis`;
    } catch (e) {
      console.warn(
        "Could not ensure PostGIS extension is enabled via direct query. " +
          "Proceeding in case it is already enabled by the database administrator:",
        e,
      );
    }

    console.log("Running migrations against database…");
    await migrate(db, { migrationsFolder: "src/lib/db/migrations" });
    console.log("Migrations applied successfully.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
