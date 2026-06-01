import { NextResponse, type NextRequest } from "next/server";
import { checkDatabaseHealth } from "@/lib/db/health-check";
import { db } from "@/lib/db/client";
import { properties } from "@/lib/db/schema/properties";
import { count, isNotNull } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const dbHealth = await checkDatabaseHealth();

  let totalCount = 0;
  let nonNullCoordsCount = 0;
  let allProperties: unknown[] = [];
  let errorMsg: string | null = null;

  try {
    const countRes = await db.select({ count: count() }).from(properties);
    totalCount = countRes[0]?.count ?? 0;

    const coordsCountRes = await db
      .select({ count: count() })
      .from(properties)
      .where(isNotNull(properties.latitude));
    nonNullCoordsCount = coordsCountRes[0]?.count ?? 0;

    allProperties = await db
      .select({
        id: properties.id,
        titleEn: properties.titleEn,
        latitude: properties.latitude,
        longitude: properties.longitude,
      })
      .from(properties);
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
      totalCount,
      nonNullCoordsCount,
      allProperties,
      errorMsg,
    },
  };

  return NextResponse.json(health, {
    status: dbHealth.connected ? 200 : 503,
  });
}
