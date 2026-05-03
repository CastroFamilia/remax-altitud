/**
 * Lighthouse CI configuration — Task 14 (Story 4.4)
 *
 * Runs nightly via .github/workflows/lighthouse.yml.
 * NOT a PR gate — advisory only (NFR28 target: Lighthouse score ≥ 80).
 *
 * Pages audited: listing detail + agent profile pages (using seed slugs from staging).
 * Scores: performance ≥ 0.80 (warn), accessibility ≥ 0.80 (warn), SEO ≥ 0.90 (error).
 */

module.exports = {
  ci: {
    collect: {
      url: [
        "http://localhost:3000/en/property/test-property-slug",
        "http://localhost:3000/en/agents/test-agent-slug",
      ],
      numberOfRuns: 1,
    },
    assert: {
      preset: "lighthouse:recommended",
      assertions: {
        "categories:performance": ["warn", { minScore: 0.8 }],
        "categories:accessibility": ["warn", { minScore: 0.8 }],
        "categories:seo": ["error", { minScore: 0.9 }],
        // Relax third-party cookie warning (not in our control)
        "uses-http2": "off",
      },
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
};
