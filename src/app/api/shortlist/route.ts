import { NextResponse } from "next/server";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";
import { createShortlistShare } from "@/app/actions/shortlist-actions";

const shortlistInputSchema = z.object({
  propertyIds: z.array(z.string().uuid("Invalid property ID format")).min(1, "Must select at least one property"),
  locale: z.enum(["en", "es"]),
});

export async function POST(request: Request) {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parseResult = shortlistInputSchema.safeParse(rawBody);
  if (!parseResult.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        issues: parseResult.error.issues,
      },
      { status: 400 },
    );
  }

  const { propertyIds, locale } = parseResult.data;

  try {
    const shareRecord = await createShortlistShare({ propertyIds, locale });
    
    // Construct absolute shareUrl
    const host = request.headers.get("host") ?? "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;
    const shareUrl = `${baseUrl}/${locale}/shortlist/${shareRecord.shareId}`;

    return NextResponse.json(
      {
        shareId: shareRecord.shareId,
        shareUrl,
      },
      { status: 201 },
    );
  } catch (error) {
    Sentry.captureException(error);
    const errorMessage = error instanceof Error ? error.message : "";
    if (errorMessage === "One or more properties are invalid or hidden") {
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create shortlist share" }, { status: 500 });
  }
}
