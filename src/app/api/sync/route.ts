import { NextResponse } from "next/server";
import { runSyncPipeline } from "@/lib/sync/pipeline";

// Force dynamic rendering — this route must never be statically generated.
export const dynamic = "force-dynamic";

/**
 * POST /api/sync
 *
 * Cron-triggered endpoint that runs the full RE/MAX CCA sync pipeline.
 * Auth: requires `Authorization: Bearer <CRON_SECRET>` header (AC #13, AR16).
 * Returns 200 + summary JSON on success; 401 if unauthorized; 500 on error.
 */
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  const provided = req.headers.get("authorization")?.replace("Bearer ", "") ?? "";

  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runSyncPipeline();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const cause =
      err instanceof Error && err.cause instanceof Error ? err.cause.message : undefined;
    console.error("[sync] Pipeline error:", cause ?? message);
    return NextResponse.json(
      { error: "Sync pipeline failed", detail: cause ?? "See server logs" },
      { status: 500 },
    );
  }
}
