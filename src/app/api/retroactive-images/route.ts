import { NextResponse } from "next/server";
import { runSyncPipeline } from "@/lib/sync/pipeline";

// Force dynamic rendering — this route must never be statically generated.
export const dynamic = "force-dynamic";

/**
 * GET /api/retroactive-images
 *
 * Temporary endpoint to run the full sync pipeline with the new image check.
 * Accessible locally to trigger the fix.
 */
export async function GET(req: Request) {
  try {
    console.log("[retroactive-images] Triggering sync pipeline...");
    const result = await runSyncPipeline();
    console.log("[retroactive-images] Sync pipeline finished:", result);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[retroactive-images] Sync pipeline failed:", message);
    return NextResponse.json(
      { error: "Sync pipeline failed", detail: message },
      { status: 500 },
    );
  }
}
