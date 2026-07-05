import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import createNextIntlPlugin from "next-intl/plugin";
import { staticRedirects } from "./src/lib/seo/redirects";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  output: "standalone",
  // Pin workspace root so Turbopack doesn't walk up to stray lockfiles
  // in parent directories (e.g. accidental npm install in ~/)
  turbopack: {
    root: __dirname,
  },
  // images.remotePatterns — Task 0, Story 4.1
  // Property images are stored locally as WebP files at relative /property-images/... paths
  // and do NOT need remotePatterns (same-origin static files).
  // Azure CDN entries are added here in case any component references original CDN URLs
  // (e.g., map popups from Story 3.2, agent photos from the REMAX CCA API).
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.azurefd.net", // Azure Front Door CDN — REMAX CCA API photos
      },
      {
        protocol: "https",
        hostname: "*.azureedge.net", // Azure CDN edge — REMAX CCA raw property images
      },
      {
        protocol: "https",
        hostname: "*.blob.core.windows.net", // Azure Blob Storage fallback
      },
      {
        protocol: "https",
        hostname: "balloon.remax-cca.com", // REMAX CCA user-uploaded content (agent photos)
      },
      {
        protocol: "https",
        hostname: "*.remax-altitud.cr", // Dev/staging and custom subdomains
      },
      {
        protocol: "https",
        hostname: "remax-altitud.cr", // Production apex domain
      },
    ],
  },
  // sharp is a native module — opt it out of Server Component bundling so
  // Next.js uses the native Node.js require() path instead of Webpack bundling.
  // `serverExternalPackages` is the stable key in Next.js 15+ (was
  // `experimental.serverComponentsExternalPackages` before v15.0.0).
  // Note: sharp is also on Next.js's built-in auto-opt-out list, so this is
  // belt-and-suspenders but explicit is better than implicit.
  serverExternalPackages: ["sharp"],

  async headers() {
    // ── Content Security Policy ──────────────────────────────────────
    // Whitelists all third-party domains the app legitimately loads from.
    // Launched as Report-Only so violations are logged (in browser console)
    // without breaking the site. Once confirmed clean, rename the header
    // key to "Content-Security-Policy" to enforce.
    const cspDirectives = [
      // Base fallback — block everything not explicitly allowed
      "default-src 'self'",

      // Scripts: Next.js inline scripts + GA4 inline snippet require unsafe-inline/eval.
      // When you add Meta Pixel later, add https://connect.facebook.net here.
      `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com`,

      // Styles: Next.js injects inline <style> tags; Mapbox GL CSS is loaded from CDN
      `style-src 'self' 'unsafe-inline' https://api.mapbox.com`,

      // Images: property photos (local), Azure CDN agent photos, REMAX CCA, Mapbox static tiles
      `img-src 'self' data: blob: https://*.azurefd.net https://*.azureedge.net https://*.blob.core.windows.net https://balloon.remax-cca.com https://api.mapbox.com`,

      // Fonts: Google Fonts (Montserrat loaded via next/font proxies through self, but allow direct too)
      `font-src 'self' https://fonts.gstatic.com`,

      // API calls (fetch/XHR): Sentry telemetry, Mapbox tiles/events, Google Translate, GA4
      `connect-src 'self' https://*.ingest.sentry.io https://*.mapbox.com https://api.mapbox.com https://events.mapbox.com https://tiles.mapbox.com https://translate.googleapis.com https://www.google-analytics.com https://www.googletagmanager.com`,

      // Web workers: Mapbox GL uses blob: workers for tile decoding
      `worker-src 'self' blob:`,

      // Child frames — deny all iframes
      `frame-src 'none'`,

      // Object/embed — deny Flash/plugins
      `object-src 'none'`,

      // Form targets — only allow same-origin form submissions
      `form-action 'self'`,

      // Base URI — prevent <base> tag hijacking
      `base-uri 'self'`,

      // Prevent the site from being embedded as a frame elsewhere
      `frame-ancestors 'none'`,
    ];

    const cspValue = cspDirectives.join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          // CSP in report-only mode — flip to "Content-Security-Policy" once verified
          {
            key: "Content-Security-Policy-Report-Only",
            value: cspValue,
          },
          // HSTS — force HTTPS for 1 year; includeSubDomains for full coverage
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Permissions-Policy — restrict browser features not used by the app
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self), payment=()",
          },
        ],
      },
    ];
  },

  // Task 5 (Story 4.4): WordPress static URL redirects — edge-level, < 10ms
  // Uses static import at top of file (./src/lib/seo/redirects) — Next.js 15
  // transpiles next.config.ts including its imports. Static import is simpler
  // and more reliable than dynamic import for config-time use.
  // Performance (NFR26): matched at CDN/proxy layer before Node.js handles request.
  async redirects() {
    return staticRedirects;
  },
};

export default withNextIntl(
  withSentryConfig(nextConfig, {
    // For all available options, see:
    // https://www.npmjs.com/package/@sentry/webpack-plugin#options

    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,

    // Only print logs for uploading source maps in CI
    silent: !process.env.CI,

    // Disable source map upload until SENTRY_AUTH_TOKEN is configured
    sourcemaps: {
      disable: !process.env.SENTRY_AUTH_TOKEN,
    },
  }),
);
