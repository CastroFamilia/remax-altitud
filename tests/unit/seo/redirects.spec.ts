/**
 * Story 4.4: SEO Architecture & WordPress Redirects
 * Unit tests for WordPress static redirect map and URL pattern detection helpers
 *
 * TDD Phase: RED — all tests are it() until redirects.ts and
 * wordpress-redirect-middleware.ts are implemented.
 * Remove it() per test when implementing to verify green phase.
 *
 * Covers:
 *   4.4-UNIT-003 — WordPress 301 redirect data shape: /property/:id → correct destination (AC #7, R-001)
 *   4.4-UNIT-006 — WordPress redirect for /agent/:name → /en/agents/:slug data shape (AC #7, R-001)
 *   4.4-UNIT-008 — 301 redirect < 50ms (NFR26) — verified by E2E test suite (see seo-and-redirects.spec.ts)
 *
 * NOTE: These tests verify the DATA shape of static redirects, not actual HTTP responses.
 *       HTTP response code testing requires an integration test against the running server.
 *       See TODO: 4.4-UNIT-008 verified by E2E test suite.
 *
 * Environment: node (pure functions, no JSX, no jsdom)
 */

import { describe, it, expect } from "vitest";

// ---------------------------------------------------------------------------
// Module mocks — MUST appear BEFORE any imports of the module under test
// ---------------------------------------------------------------------------

// No mocks needed — testing pure functions and plain data exports
// These modules have no server-only or DB dependencies

// ---------------------------------------------------------------------------
// Imports — AFTER mocks
// ---------------------------------------------------------------------------

// imported AFTER mocks
import { staticRedirects, type RedirectEntry } from "@/lib/seo/redirects";
import {
  isWordPressPropertyUrl,
  isWordPressAgentUrl,
} from "@/lib/seo/wordpress-redirect-middleware";

// ---------------------------------------------------------------------------
// 4.4-UNIT-003: staticRedirects data shape (AC #7)
// ---------------------------------------------------------------------------

describe("staticRedirects data shape (4.4-UNIT-003)", () => {
  it(
    "[P0] 4.4-UNIT-003a: /contact entry has destination: '/en/contact' and permanent: true",
    () => {
      const entry = staticRedirects.find((r: RedirectEntry) => r.source === "/contact");
      expect(entry).toBeDefined();
      expect(entry?.destination).toBe("/en/contact");
      expect(entry?.permanent).toBe(true);
    },
  );

  it(
    "[P0] 4.4-UNIT-003b: /listings entry has destination: '/en/search' and permanent: true",
    () => {
      const entry = staticRedirects.find((r: RedirectEntry) => r.source === "/listings");
      expect(entry).toBeDefined();
      expect(entry?.destination).toBe("/en/search");
      expect(entry?.permanent).toBe(true);
    },
  );

  it(
    "[P0] 4.4-UNIT-003c: /agents entry has destination: '/en/agents' and permanent: true",
    () => {
      const entry = staticRedirects.find((r: RedirectEntry) => r.source === "/agents");
      expect(entry).toBeDefined();
      expect(entry?.destination).toBe("/en/agents");
      expect(entry?.permanent).toBe(true);
    },
  );

  it(
    "[P1] 4.4-UNIT-003d: all entries with permanent: true will result in HTTP 301 (Next.js convention)",
    () => {
      // All staticRedirects should have permanent: true (301)
      // Next.js maps permanent: true → HTTP 301, permanent: false → HTTP 302
      const permanentEntries = staticRedirects.filter((r: RedirectEntry) => r.permanent === true);
      expect(permanentEntries.length).toBeGreaterThan(0);
      // Every entry in staticRedirects should be permanent (301) — no temporary redirects here
      expect(permanentEntries.length).toBe(staticRedirects.length);
    },
  );

  it(
    "[P1] 4.4-UNIT-003e: /agentes entry redirects to '/es/agents'",
    () => {
      const entry = staticRedirects.find((r: RedirectEntry) => r.source === "/agentes");
      expect(entry).toBeDefined();
      expect(entry?.destination).toBe("/es/agents");
      expect(entry?.permanent).toBe(true);
    },
  );

  it(
    "[P1] 4.4-UNIT-003f: /contacto entry redirects to '/es/contact'",
    () => {
      const entry = staticRedirects.find((r: RedirectEntry) => r.source === "/contacto");
      expect(entry).toBeDefined();
      expect(entry?.destination).toBe("/es/contact");
      expect(entry?.permanent).toBe(true);
    },
  );

  it(
    "[P1] 4.4-UNIT-003g: /propiedades entry redirects to '/es/search'",
    () => {
      const entry = staticRedirects.find((r: RedirectEntry) => r.source === "/propiedades");
      expect(entry).toBeDefined();
      expect(entry?.destination).toBe("/es/search");
      expect(entry?.permanent).toBe(true);
    },
  );

  it(
    "[P2] 4.4-UNIT-003h: staticRedirects is a non-empty array",
    () => {
      expect(Array.isArray(staticRedirects)).toBe(true);
      expect(staticRedirects.length).toBeGreaterThan(0);
    },
  );

  it(
    "[P2] 4.4-UNIT-003i: each entry has required shape: source, destination, permanent",
    () => {
      for (const entry of staticRedirects as RedirectEntry[]) {
        expect(typeof entry.source).toBe("string");
        expect(typeof entry.destination).toBe("string");
        expect(typeof entry.permanent).toBe("boolean");
      }
    },
  );

  it(
    "[P2] 4.4-UNIT-003j: EN static page redirects cover all major legacy WP pages",
    () => {
      const sources = staticRedirects.map((r: RedirectEntry) => r.source);
      expect(sources).toContain("/about");
      expect(sources).toContain("/services");
      expect(sources).toContain("/join");
    },
  );

  it(
    "covers legacy WordPress city/area redirects",
    () => {
      const cityEntry = staticRedirects.find((r: RedirectEntry) => r.source === "/city/:slug*");
      expect(cityEntry).toBeDefined();
      expect(cityEntry?.destination).toBe("/en/areas/:slug*");
      expect(cityEntry?.permanent).toBe(true);

      const ciudadEntry = staticRedirects.find((r: RedirectEntry) => r.source === "/ciudad/:slug*");
      expect(ciudadEntry).toBeDefined();
      expect(ciudadEntry?.destination).toBe("/es/areas/:slug*");
      expect(ciudadEntry?.permanent).toBe(true);
    },
  );
});

// ---------------------------------------------------------------------------
// 4.4-UNIT-006: WordPress URL pattern detection — isWordPressPropertyUrl
// ---------------------------------------------------------------------------

describe("isWordPressPropertyUrl (4.4-UNIT-006 — property URL detection)", () => {
  it(
    "[P0] 4.4-UNIT-006a: /property/123 returns '123'",
    () => {
      expect(isWordPressPropertyUrl("/property/123")).toBe("123");
    },
  );

  it(
    "[P0] 4.4-UNIT-006b: /listing/beautiful-home-123 returns 'beautiful-home-123'",
    () => {
      expect(isWordPressPropertyUrl("/listing/beautiful-home-123")).toBe(
        "beautiful-home-123",
      );
    },
  );

  it(
    "[P0] 4.4-UNIT-006c: /en/property/valid-slug returns null (new URL — not WP)",
    () => {
      // New-platform URLs start with /en/ or /es/ — should NOT be matched as WP URLs
      expect(isWordPressPropertyUrl("/en/property/valid-slug")).toBeNull();
    },
  );

  it(
    "[P1] 4.4-UNIT-006d: /propiedad/456 returns '456' (Spanish WP pattern)",
    () => {
      expect(isWordPressPropertyUrl("/propiedad/456")).toBe("456");
    },
  );

  it(
    "[P1] 4.4-UNIT-006e: /search returns null (not a property URL)",
    () => {
      expect(isWordPressPropertyUrl("/search")).toBeNull();
    },
  );

  it(
    "[P1] 4.4-UNIT-006f: empty string returns null",
    () => {
      expect(isWordPressPropertyUrl("")).toBeNull();
    },
  );

  it(
    "[P2] 4.4-UNIT-006g: /property/123/extra-segment returns null (too many segments)",
    () => {
      // WP URLs are /property/:id (exactly one segment) — not /property/id/extra
      expect(isWordPressPropertyUrl("/property/123/extra")).toBeNull();
    },
  );

  it(
    "[P2] 4.4-UNIT-006h: trailing slash /property/123/ is handled (returns '123')",
    () => {
      // Optional trailing slash — return the ID segment
      const result = isWordPressPropertyUrl("/property/123/");
      expect(result).toBe("123");
    },
  );
});

// ---------------------------------------------------------------------------
// isWordPressAgentUrl — AC #7 (agent URL pattern detection)
// ---------------------------------------------------------------------------

describe("isWordPressAgentUrl (AC #7 — agent URL detection)", () => {
  it(
    "[P0] /agent/john-doe returns 'john-doe'",
    () => {
      expect(isWordPressAgentUrl("/agent/john-doe")).toBe("john-doe");
    },
  );

  it(
    "[P0] /agente/juan-garcia returns 'juan-garcia'",
    () => {
      expect(isWordPressAgentUrl("/agente/juan-garcia")).toBe("juan-garcia");
    },
  );

  it(
    "[P0] /en/agents/emma-smith returns null (new URL — not WP)",
    () => {
      // New-platform URLs start with /en/ or /es/ — should NOT be matched as WP URLs
      expect(isWordPressAgentUrl("/en/agents/emma-smith")).toBeNull();
    },
  );

  it(
    "[P1] /agents returns null (index page — not a single agent URL)",
    () => {
      expect(isWordPressAgentUrl("/agents")).toBeNull();
    },
  );

  it(
    "[P1] /property/123 returns null (not an agent URL)",
    () => {
      expect(isWordPressAgentUrl("/property/123")).toBeNull();
    },
  );

  it(
    "[P2] /agent/123/extra-segment returns null (too many segments)",
    () => {
      expect(isWordPressAgentUrl("/agent/123/extra")).toBeNull();
    },
  );
});

// ---------------------------------------------------------------------------
// TODO: 4.4-UNIT-008 — redirect response time (NFR26 < 50ms)
// ---------------------------------------------------------------------------
// The < 50ms constraint is verified by the E2E test suite, not unit tests.
// See tests/e2e/seo-and-redirects.spec.ts → "[P2] 4.4-E2E-006: 301 redirect returns < 50ms"
//
// Rationale: Static redirects in next.config.ts are matched at the CDN/proxy layer
// before the Node.js app handles the request (typically 1-5ms). Verifying this
// timing in a unit test would require mocking the network stack, which adds
// no meaningful signal over the E2E timing measurement.
