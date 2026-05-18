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

  // - prepare: false → required for pgBouncer / connection-pooler compat
  // - max: 3 → prevents "too many clients" during `next build` parallel prerendering
  //   (multiple build workers each create a postgres instance; 10 × N workers can
  //    exceed PostgreSQL's max_connections, typically 100)
  const client = postgres(connectionString, { prepare: false, max: 3 });
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
