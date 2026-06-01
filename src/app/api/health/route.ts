import { NextResponse, type NextRequest } from "next/server";
import { checkDatabaseHealth } from "@/lib/db/health-check";
import { db } from "@/lib/db/client";
import { properties } from "@/lib/db/schema/properties";
import { count, isNotNull, and, gte, lte } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const dbHealth = await checkDatabaseHealth();

  const searchParams = req.nextUrl.searchParams;
  const north = searchParams.get("north") ? parseFloat(searchParams.get("north")!) : null;
  const south = searchParams.get("south") ? parseFloat(searchParams.get("south")!) : null;
  const east = searchParams.get("east") ? parseFloat(searchParams.get("east")!) : null;
  const west = searchParams.get("west") ? parseFloat(searchParams.get("west")!) : null;

  let totalCount = 0;
  let nonNullCoordsCount = 0;
  let sampleProperties: unknown[] = [];
  let queryCount = 0;
  let errorMsg: string | null = null;

  try {
    const countRes = await db.select({ count: count() }).from(properties);
    totalCount = countRes[0]?.count ?? 0;

    const coordsCountRes = await db
      .select({ count: count() })
      .from(properties)
      .where(isNotNull(properties.latitude));
    nonNullCoordsCount = coordsCountRes[0]?.count ?? 0;

    sampleProperties = await db
      .select({
        id: properties.id,
        titleEn: properties.titleEn,
        latitude: properties.latitude,
        longitude: properties.longitude,
      })
      .from(properties)
      .limit(5);

    if (north !== null && south !== null && east !== null && west !== null) {
      const qRes = await db
        .select({ count: count() })
        .from(properties)
        .where(
          and(
            gte(properties.latitude, south),
            lte(properties.latitude, north),
            gte(properties.longitude, west),
            lte(properties.longitude, east),
          )
        );
      queryCount = qRes[0]?.count ?? 0;
    }
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
      sampleProperties,
      queryCount,
      errorMsg,
    },
  };

  return NextResponse.json(health, {
    status: dbHealth.connected ? 200 : 503,
  });
}
