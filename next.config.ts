import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  output: "standalone",
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
        hostname: "*.blob.core.windows.net", // Azure Blob Storage fallback
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
