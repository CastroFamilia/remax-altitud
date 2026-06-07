import { NextResponse } from "next/server";
import { z } from "zod";
import { trackPropertyViewInBackground } from "@/lib/services/tracking";
import { db } from "@/lib/db/client";
import { propertyViews } from "@/lib/db/schema/property-views";

const viewInputSchema = z.object({
  propertyId: z.string().uuid("Invalid property ID format"),
  slug: z.string().min(1, "Slug is required"),
  locale: z.enum(["en", "es"]),
});

export async function POST(request: Request) {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  try {
    const parseResult = viewInputSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parseResult.error.issues },
        { status: 400 },
      );
    }

    const { propertyId, slug, locale } = parseResult.data;

    // 1. Insert into local property_views table for admin dashboard analytics
    await db.insert(propertyViews).values({
      propertyId,
      locale,
    });

    // 2. Trigger property view tracking in the background to Altitud Hub
    trackPropertyViewInBackground({
      propertyId,
      slug,
      locale,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to process view tracking" }, { status: 500 });
  }
}
