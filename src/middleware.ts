import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  // Detect paths of the form /<something>/... where <something> looks like a
  // locale code (2-5 lowercase chars) but is NOT one we support. Redirect
  // those to the default locale so visitors with a mistyped or unsupported
  // locale prefix land on a working page instead of a 404 (AC #6).
  const firstSegment = request.nextUrl.pathname.split("/")[1] ?? "";
  const looksLikeLocaleCode = /^[a-z]{2,5}(-[a-z]{2,4})?$/i.test(firstSegment);
  const isSupportedLocale = (routing.locales as readonly string[]).includes(firstSegment);

  if (looksLikeLocaleCode && !isSupportedLocale) {
    const url = request.nextUrl.clone();
    // Replace the invalid locale segment with the default locale while preserving the rest of the path
    const pathSegments = url.pathname.split("/");
    pathSegments[1] = routing.defaultLocale;
    url.pathname = pathSegments.join("/");
    return NextResponse.redirect(url);
  }

  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except:
  // - API routes (/api/...)
  // - Next.js internals (/_next/, /_vercel/)
  // - Static files (anything containing a dot, e.g. favicon.ico, robots.txt)
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
