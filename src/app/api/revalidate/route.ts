import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

// Force dynamic rendering — this route must never be statically generated.
export const dynamic = "force-dynamic";

/**
 * POST /api/revalidate
 *
 * Internal endpoint called by the sync pipeline to trigger ISR revalidation.
 * Auth: requires `x-api-secret` header matching `process.env.API_SECRET` (AC #14, AR6).
 * Accepts optional `{ tags: string[] }` body; defaults to revalidating
 * the `properties` and `agents` Next.js cache tags.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.API_SECRET;
  const provided = req.headers.get("x-api-secret") ?? "";

  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let tags: string[] = ["properties", "agents"];
  try {
    const body = await req.json();
    if (Array.isArray(body?.tags)) {
      tags = body.tags as string[];
    }
  } catch {
    // No body or invalid JSON → use defaults
  }

  for (const tag of tags) {
    revalidateTag(tag);
  }

  return NextResponse.json({ revalidated: true, tags });
}
