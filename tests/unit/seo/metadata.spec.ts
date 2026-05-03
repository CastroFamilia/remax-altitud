/**
 * Story 4.4: SEO Architecture & WordPress Redirects
 * Unit tests for hreflang and canonical URL helpers in src/lib/seo/metadata.ts
 *
 * TDD Phase: RED — all tests are it.skip() until metadata.ts is implemented.
 * Remove it.skip() per test when implementing to verify green phase.
 *
 * Covers:
 *   4.4-UNIT-004 — generateAlternateLanguages() produces correct hreflang for EN + ES (AC #5, R-007)
 *   (generateCanonicalUrl, buildAlternatesMetadata — AC #8)
 *
 * Environment: node (no JSX — .spec.ts runs in node environment by default)
 */

import { vi, describe, it, expect } from "vitest";

// ---------------------------------------------------------------------------
// Module mocks — MUST appear BEFORE any imports of the module under test
// ---------------------------------------------------------------------------

// Mock server-only to avoid "This module cannot be imported in a client context"
vi.mock("server-only", () => ({}));

// Mock SEO constants module
vi.mock("@/lib/seo/constants", () => ({
  SITE_ORIGIN: "https://remax-altitud.cr",
  LOCALES: ["en", "es"],
}));

// ---------------------------------------------------------------------------
// Imports — AFTER mocks
// ---------------------------------------------------------------------------

// imported AFTER mocks
import {
  generateAlternateLanguages,
  generateCanonicalUrl,
  buildAlternatesMetadata,
} from "@/lib/seo/metadata";

// ---------------------------------------------------------------------------
// 4.4-UNIT-004: generateAlternateLanguages
// ---------------------------------------------------------------------------

describe("generateAlternateLanguages (4.4-UNIT-004)", () => {
  it.skip(
    "[P0] 4.4-UNIT-004a: returns array with 2 entries (en + es)",
    () => {
      const result = generateAlternateLanguages("/property/beautiful-mountain-home");
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
    },
  );

  it.skip(
    "[P0] 4.4-UNIT-004b: EN entry has hrefLang: 'en' and href containing '/en/property/beautiful-mountain-home'",
    () => {
      const result = generateAlternateLanguages("/property/beautiful-mountain-home");
      const enEntry = result.find((e) => e.hrefLang === "en");
      expect(enEntry).toBeDefined();
      expect(enEntry?.href).toContain("/en/property/beautiful-mountain-home");
    },
  );

  it.skip(
    "[P0] 4.4-UNIT-004c: ES entry has hrefLang: 'es' and href containing '/es/property/beautiful-mountain-home'",
    () => {
      const result = generateAlternateLanguages("/property/beautiful-mountain-home");
      const esEntry = result.find((e) => e.hrefLang === "es");
      expect(esEntry).toBeDefined();
      expect(esEntry?.href).toContain("/es/property/beautiful-mountain-home");
    },
  );

  it.skip(
    "[P1] 4.4-UNIT-004d: all hrefs start with 'https://remax-altitud.cr'",
    () => {
      const result = generateAlternateLanguages("/property/beautiful-mountain-home");
      for (const entry of result) {
        expect(entry.href).toMatch(/^https:\/\/remax-altitud\.cr\//);
      }
    },
  );

  it.skip(
    "[P1] 4.4-UNIT-004e: path is appended correctly with no double slashes",
    () => {
      const result = generateAlternateLanguages("/property/beautiful-mountain-home");
      for (const entry of result) {
        expect(entry.href).not.toContain("//en/");
        expect(entry.href).not.toContain("//es/");
        expect(entry.href).not.toMatch(/remax-altitud\.cr\/\//);
      }
    },
  );

  it.skip(
    "[P1] 4.4-UNIT-004f: works correctly for agent slug paths",
    () => {
      const result = generateAlternateLanguages("/agents/emma-smith");
      const enEntry = result.find((e: { hrefLang: string; href: string }) => e.hrefLang === "en");
      const esEntry = result.find((e: { hrefLang: string; href: string }) => e.hrefLang === "es");
      expect(enEntry?.href).toBe("https://remax-altitud.cr/en/agents/emma-smith");
      expect(esEntry?.href).toBe("https://remax-altitud.cr/es/agents/emma-smith");
    },
  );

  it.skip(
    "[P1] 4.4-UNIT-004g: each entry has both hrefLang and href properties",
    () => {
      const result = generateAlternateLanguages("/property/test-slug");
      for (const entry of result) {
        expect(entry).toHaveProperty("hrefLang");
        expect(entry).toHaveProperty("href");
        expect(typeof entry.hrefLang).toBe("string");
        expect(typeof entry.href).toBe("string");
      }
    },
  );
});

// ---------------------------------------------------------------------------
// generateCanonicalUrl — AC #8
// ---------------------------------------------------------------------------

describe("generateCanonicalUrl (AC #8)", () => {
  it.skip(
    "[P0] returns correct canonical URL for locale='en' and property path",
    () => {
      const result = generateCanonicalUrl("en", "/property/beautiful-mountain-home");
      expect(result).toBe(
        "https://remax-altitud.cr/en/property/beautiful-mountain-home",
      );
    },
  );

  it.skip(
    "[P1] returns correct URL for ES locale",
    () => {
      const result = generateCanonicalUrl("es", "/property/beautiful-mountain-home");
      expect(result).toBe(
        "https://remax-altitud.cr/es/property/beautiful-mountain-home",
      );
    },
  );

  it.skip(
    "[P1] returns correct URL for agent path",
    () => {
      const result = generateCanonicalUrl("en", "/agents/emma-smith");
      expect(result).toBe("https://remax-altitud.cr/en/agents/emma-smith");
    },
  );

  it.skip(
    "[P1] URL starts with the SITE_ORIGIN constant",
    () => {
      const result = generateCanonicalUrl("en", "/search");
      expect(result).toMatch(/^https:\/\/remax-altitud\.cr\//);
    },
  );

  it.skip(
    "[P2] URL has no double slashes between origin and path",
    () => {
      const result = generateCanonicalUrl("en", "/property/test");
      expect(result).not.toMatch(/remax-altitud\.cr\/\//);
    },
  );
});

// ---------------------------------------------------------------------------
// buildAlternatesMetadata — Next.js Metadata.alternates shape (AC #5, #8)
// ---------------------------------------------------------------------------

describe("buildAlternatesMetadata (AC #5, #8)", () => {
  it.skip(
    "[P0] returns object with 'languages' key",
    () => {
      const result = buildAlternatesMetadata("/property/beautiful-mountain-home");
      expect(result).toHaveProperty("languages");
    },
  );

  it.skip(
    "[P0] languages.en contains the EN canonical URL",
    () => {
      const result = buildAlternatesMetadata("/property/beautiful-mountain-home");
      expect(result.languages["en"]).toBe(
        "https://remax-altitud.cr/en/property/beautiful-mountain-home",
      );
    },
  );

  it.skip(
    "[P0] languages.es contains the ES canonical URL",
    () => {
      const result = buildAlternatesMetadata("/property/beautiful-mountain-home");
      expect(result.languages["es"]).toBe(
        "https://remax-altitud.cr/es/property/beautiful-mountain-home",
      );
    },
  );

  it.skip(
    "[P1] languages object has exactly 2 entries (en + es for Phase 1)",
    () => {
      const result = buildAlternatesMetadata("/property/test-slug");
      expect(Object.keys(result.languages)).toHaveLength(2);
    },
  );

  it.skip(
    "[P1] languages keys match hrefLang values ('en', 'es')",
    () => {
      const result = buildAlternatesMetadata("/property/test-slug");
      expect(Object.keys(result.languages)).toContain("en");
      expect(Object.keys(result.languages)).toContain("es");
    },
  );
});
