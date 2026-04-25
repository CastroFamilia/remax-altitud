import { NextResponse } from "next/server";
import { checkDatabaseHealth } from "@/lib/db/health-check";

export async function GET() {
  const dbHealth = await checkDatabaseHealth();

  const health = {
    status: dbHealth.connected ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    checks: {
      database: dbHealth,
    },
  };

  return NextResponse.json(health, {
    status: dbHealth.connected ? 200 : 503,
  });
}
