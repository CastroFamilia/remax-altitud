import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

function createDb() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL environment variable is required. " +
        "Set it in .env.local (see .env.example for format).",
    );
  }

  // Disable prefetch for connection pooling compatibility
  const client = postgres(connectionString, { prepare: false });
  return drizzle({ client });
}

// Lazy singleton — defers connection until first use so the build succeeds
// without DATABASE_URL (the error is thrown at runtime, not at module load time)
let _db: ReturnType<typeof createDb> | undefined;

export const db = new Proxy({} as ReturnType<typeof createDb>, {
  get(_target, prop) {
    if (!_db) _db = createDb();
    return (_db as unknown as Record<string | symbol, unknown>)[prop];
  },
});
