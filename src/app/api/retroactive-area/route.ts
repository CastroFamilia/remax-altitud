import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { properties } from "@/lib/db/schema/properties";
import { resolveAreaSlug } from "@/lib/db/queries/properties";
import { eq } from "drizzle-orm";

// Force dynamic rendering — this route must never be statically generated.
export const dynamic = "force-dynamic";

/**
 * GET /api/retroactive-area
 *
 * Retroactively classifies all existing properties in the database into their
 * correct areas (perez-zeledon, dominical, uvita, ojochal, tinamastes-platanillo)
 * using their community or office guid and location/title/description keywords.
 *
 * Auth: requires CRON_SECRET if set in the environment.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const url = new URL(req.url);
  const provided =
    url.searchParams.get("secret") ??
    req.headers.get("authorization")?.replace("Bearer ", "") ??
    "";

  if (secret && provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { areas } = await import("@/lib/db/schema/areas");
    const { communities } = await import("@/lib/db/schema/communities");

    // Fetch all areas to build slug mapping
    const allAreas = await db.select().from(areas);
    const areaMap = new Map(allAreas.map((a) => [a.slug, a.id]));

    // Fetch communities to build community -> area mapping
    const allCommunities = await db
      .select({ id: communities.id, areaId: communities.areaId, areaSlug: areas.slug })
      .from(communities)
      .innerJoin(areas, eq(communities.areaId, areas.id));
    const communityMap = new Map(allCommunities.map((c) => [c.id, c]));

    // Fetch all properties
    const allProperties = await db
      .select({
        id: properties.id,
        officeId: properties.officeId,
        titleEn: properties.titleEn,
        titleEs: properties.titleEs,
        descriptionEn: properties.descriptionEn,
        descriptionEs: properties.descriptionEs,
        communityId: properties.communityId,
        apiRaw: properties.apiRaw,
      })
      .from(properties);

    let updatedCount = 0;
    const stats: Record<string, number> = {};

    for (const p of allProperties) {
      let resolvedAreaSlug: string | null = null;
      let resolvedAreaId: string | null = null;

      // 1. If property is inside a community, inherit from community
      if (p.communityId && communityMap.has(p.communityId)) {
        const comm = communityMap.get(p.communityId)!;
        resolvedAreaSlug = comm.areaSlug;
        resolvedAreaId = comm.areaId;
      } else {
        // 2. Otherwise use the office and keyword resolver
        let officeApiId = 218; // default to Dominical
        let location: string | null = null;

        if (p.apiRaw && typeof p.apiRaw === "object") {
          const raw = p.apiRaw as Record<string, unknown>;
          if (typeof raw.OfficeID === "number") {
            officeApiId = raw.OfficeID;
          }
          if (typeof raw.Location === "string") {
            location = raw.Location;
          }
        }

        resolvedAreaSlug = resolveAreaSlug({
          officeApiId,
          location,
          titleEn: p.titleEn,
          titleEs: p.titleEs,
          publicRemarksEn: p.descriptionEn,
          publicRemarksEs: p.descriptionEs,
        });
        resolvedAreaId = areaMap.get(resolvedAreaSlug) ?? null;
      }

      if (resolvedAreaSlug && resolvedAreaId) {
        await db
          .update(properties)
          .set({
            areaId: resolvedAreaId,
            areaSlug: resolvedAreaSlug,
            updatedAt: new Date(),
          })
          .where(eq(properties.id, p.id));

        updatedCount++;
        stats[resolvedAreaSlug] = (stats[resolvedAreaSlug] || 0) + 1;
      }
    }

    return NextResponse.json({
      ok: true,
      message: `Successfully tagged ${updatedCount} properties with areaSlug and areaId`,
      stats,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[retroactive-area] Error:", msg);
    return NextResponse.json({ error: msg, detail: err instanceof Error && err.cause instanceof Error ? err.cause.message : undefined }, { status: 500 });
  }
}
