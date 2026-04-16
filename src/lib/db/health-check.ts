import postgres from "postgres";

/**
 * Verify database connectivity by running a simple query.
 * Used during startup validation and health checks.
 */
export async function checkDatabaseHealth(): Promise<{
  connected: boolean;
  latency_ms: number;
  error?: string;
}> {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    return {
      connected: false,
      latency_ms: 0,
      error: "DATABASE_URL is not configured",
    };
  }

  const client = postgres(connectionString, { prepare: false, max: 1 });

  try {
    const start = performance.now();
    await client`SELECT 1 AS health_check`;
    const latency = performance.now() - start;

    return {
      connected: true,
      latency_ms: Math.round(latency * 100) / 100,
    };
  } catch (err) {
    return {
      connected: false,
      latency_ms: 0,
      error: err instanceof Error ? err.message : "Unknown database error",
    };
  } finally {
    await client.end();
  }
}
