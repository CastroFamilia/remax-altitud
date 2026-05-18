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
  // (e.g., map popups from Story 3.2, agent photos from the RE/MAX CCA API).
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.azurefd.net", // Azure Front Door CDN — RE/MAX CCA API photos
      },
      {
        protocol: "https",
        hostname: "*.azureedge.net", // Azure CDN edge — RE/MAX CCA raw property images
      },
      {
        protocol: "https",
        hostname: "*.blob.core.windows.net", // Azure Blob Storage fallback
      },
      {
        protocol: "https",
        hostname: "balloon.remax-cca.com", // RE/MAX CCA user-uploaded content (agent photos)
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
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
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
