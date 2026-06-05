import { NextResponse } from "next/server";
import { trackQrScanInBackground } from "@/lib/services/tracking";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get("propertyId");
  const slug = searchParams.get("slug");
  const locale = (searchParams.get("locale") as "en" | "es") || "en";

  if (!propertyId || !slug) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
  }

  // Trigger QR scan tracking in the background
  trackQrScanInBackground({
    propertyId,
    slug,
    locale,
  });

  // Redirect to the property page
  // Assuming BASE_URL or absolute URL is needed, or just relative path if supported by redirect
  return NextResponse.redirect(new URL(`/${locale}/property/${slug}`, request.url));
}
