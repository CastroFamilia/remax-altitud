import { NextResponse, type NextRequest } from "next/server";
import { checkDatabaseHealth } from "@/lib/db/health-check";
import { searchProperties } from "@/app/actions/search-actions";

export async function GET(req: NextRequest) {
  const dbHealth = await checkDatabaseHealth();

  let searchResultPz: unknown = null;
  let searchResultWide: unknown = null;
  let errorMsg: string | null = null;

  try {
    // Pérez Zeledón bounds
    const pzBounds = {
      north: 9.5,
      south: 9.2,
      east: -83.5,
      west: -83.8,
    };
    searchResultPz = await searchProperties({}, 1, pzBounds);

    // Extremely wide bounds (should cover all of Costa Rica)
    const wideBounds = {
      north: 11.0,
      south: 8.0,
      east: -82.0,
      west: -86.0,
    };
    searchResultWide = await searchProperties({}, 1, wideBounds);
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : String(err);
  }

  const health = {
    status: dbHealth.connected ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    checks: {
      database: dbHealth,
    },
    diagnostics: {
      searchResultPz,
      searchResultWide,
      errorMsg,
    },
  };

  return NextResponse.json(health, {
    status: dbHealth.connected ? 200 : 503,
  });
}
