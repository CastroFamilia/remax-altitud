import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { properties } from "@/lib/db/schema/properties";
import { eq } from "drizzle-orm";

// Force dynamic rendering — this route must never be statically generated.
export const dynamic = "force-dynamic";

/**
 * Resolves listing type from raw API data and title heuristics.
 * Mirrors the logic in src/lib/sync/schemas/property.ts → resolveListingType()
 * but operates on the stored apiRaw JSONB column.
 */
function resolveListingTypeFromRaw(
  apiRaw: Record<string, unknown>,
  titleEn: string,
  titleEs: string,
): "Sale" | "Lease" {
  // 1. ContractType_en
  const ctEn = typeof apiRaw.ContractType_en === "string" ? apiRaw.ContractType_en.trim() : null;
  if (ctEn) {
    if (/lease|rent/i.test(ctEn)) return "Lease";
    if (/sale|sell/i.test(ctEn)) return "Sale";
  }

  // 2. ContractType_es
  const ctEs = typeof apiRaw.ContractType_es === "string" ? apiRaw.ContractType_es.trim() : null;
  if (ctEs) {
    if (/alquiler|arriendo|renta/i.test(ctEs)) return "Lease";
    if (/venta/i.test(ctEs)) return "Sale";
  }

  // 3. ListingContractType numeric ID
  const lcType = typeof apiRaw.ListingContractType === "number" ? apiRaw.ListingContractType : null;
  if (lcType === 2) return "Lease";
  if (lcType === 1) return "Sale";

  // 4. Title heuristic
  const titleText = `${titleEn} ${titleEs}`.toLowerCase();
  if (
    /\bfor rent\b|\bfor lease\b|\brental\b|\balquiler\b|\barriendo\b|\ben renta\b/.test(titleText)
  ) {
    return "Lease";
  }

  return "Sale";
}

/**
 * GET /api/retroactive-listing-type
 *
 * Retroactively fixes listing_type for all properties by re-evaluating
 * the raw API data and title heuristics. This fixes properties that were
 * incorrectly classified as "Sale" when they are actually rentals ("Lease").
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
    // Fetch all properties with their apiRaw data
    const allProperties = await db
      .select({
        id: properties.id,
        apiId: properties.apiId,
        titleEn: properties.titleEn,
        titleEs: properties.titleEs,
        listingType: properties.listingType,
        apiRaw: properties.apiRaw,
      })
      .from(properties);

    let fixedCount = 0;
    const fixes: Array<{ apiId: string; titleEn: string; oldType: string; newType: string }> = [];

    for (const p of allProperties) {
      const apiRaw = (p.apiRaw && typeof p.apiRaw === "object" ? p.apiRaw : {}) as Record<
        string,
        unknown
      >;
      const resolved = resolveListingTypeFromRaw(apiRaw, p.titleEn, p.titleEs);

      if (resolved !== p.listingType) {
        await db
          .update(properties)
          .set({
            listingType: resolved,
            updatedAt: new Date(),
          })
          .where(eq(properties.id, p.id));

        fixedCount++;
        fixes.push({
          apiId: p.apiId,
          titleEn: p.titleEn,
          oldType: p.listingType,
          newType: resolved,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      message: `Fixed listing_type for ${fixedCount} properties`,
      totalScanned: allProperties.length,
      fixes,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[retroactive-listing-type] Error:", msg);
    return NextResponse.json(
      {
        error: msg,
        detail: err instanceof Error && err.cause instanceof Error ? err.cause.message : undefined,
      },
      { status: 500 },
    );
  }
}
