import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { shortlistEvents } from "@/lib/db/schema/shortlist-events";
import { eq } from "drizzle-orm";
import { properties } from "@/lib/db/schema/properties";

const eventInputSchema = z.object({
  propertyId: z.string().uuid("Invalid property ID format"),
  action: z.enum(["save", "unsave"]),
  locale: z.enum(["en", "es"]),
});

export async function POST(request: Request) {
  let rawBody: any;
  try {
    rawBody = await request.json();
  } catch (err) {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  try {
    const parseResult = eventInputSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json({ error: "Validation failed", issues: parseResult.error.issues }, { status: 400 });
    }

    const { propertyId, action, locale } = parseResult.data;

    // Verify property exists
    const propExists = await db.select({ id: properties.id }).from(properties).where(eq(properties.id, propertyId)).limit(1);
    if (propExists.length === 0) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    await db.insert(shortlistEvents).values({
      propertyId,
      action,
      locale,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to record event" }, { status: 500 });
  }
}
