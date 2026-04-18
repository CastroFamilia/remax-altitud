import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL environment variable is required. " +
      "Set it in .env.local (see .env.example for format).",
  );
}

// Disable prefetch for connection pooling compatibility
const client = postgres(connectionString, { prepare: false });

export const db = drizzle({ client });
