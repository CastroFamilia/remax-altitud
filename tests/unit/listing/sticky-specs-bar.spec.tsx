/**
 * Story 4.1: Listing Detail Page & Photo Gallery
 * Component: src/components/listing/sticky-specs-bar.tsx
 *
 * TDD RED PHASE — all tests use it.skip() and will FAIL until:
 *   sticky-specs-bar.tsx is implemented with actual behavior replacing the stubs below.
 *
 * How to activate (for the dev implementing Story 4.1 Task 5):
 *   1. Implement src/components/listing/sticky-specs-bar.tsx
 *   2. Remove the vi.mock('@/components/listing/sticky-specs-bar') stub below
 *   3. Remove it.skip() from the test you are implementing
 *   4. Run: npm test -- --grep "StickySpecsBar"
 *   5. Verify the test FAILS before full implementation, then passes after
 *   6. Commit passing tests
 *
 * Covers:
 *   AC #6  — Price + specs bar shows price, beds/baths, lot + built area, ZMT badge
 *
 * Environment: jsdom (React component — .spec.tsx → jsdom via vitest.config.mts)
 *
 * Component interface:
 *   interface StickySpecsBarProps {
 *     priceUsd: number;
 *     bedrooms: number | null;
 *     bathrooms: number | null;
 *     lotSizeM2: number | null;
 *     constructionM2: number | null;
 *     zmtStatus: string;
 *     locale: string;
 *   }
 *
 * Architecture notes:
 *   - StickySpecsBar is a Client Component ('use client')
 *   - Uses useLocaleUnits hook for unit toggle state
 *   - data-testid="sticky-specs-bar" on root element
 */

// ---------------------------------------------------------------------------
// Module mocks — declared BEFORE any imports of the module under test
// ---------------------------------------------------------------------------

import { vi, describe, it, expect, afterEach } from "vitest";

// RED PHASE STUB — remove this mock when implementing sticky-specs-bar.tsx
// This stub allows the test file to compile and run in red-phase.
// When removed, the real component implementation will be imported instead.
vi.mock("@/components/listing/sticky-specs-bar", () => ({
  // Stub: returns null — all tests that depend on real behavior will FAIL (red phase)
  StickySpecsBar: () => null,
  default: () => null,
}));

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(
    () => (key: string, values?: Record<string, unknown>) =>
      values ? `${key}(${JSON.stringify(values)})` : key,
  ),
}));

vi.mock("@/hooks/use-locale-units", () => ({
  useLocaleUnits: vi.fn(() => ({
    unitSystem: "metric" as const,
    toggleUnits: vi.fn(),
    convertArea: vi.fn((m2: number) => `${m2} m²`),
  })),
}));

vi.mock("@/lib/utils/currency", () => ({
  formatUSD: vi.fn((price: number) => `$${price.toLocaleString()}`),
  formatEUR: vi.fn(
    (price: number) => `€${Math.round(price * 0.92).toLocaleString()}`,
  ),
  isNonUSLocale: vi.fn(() => false),
}));

vi.mock("@/components/layout/unit-toggle", () => ({
  UnitToggle: () => <div data-testid="unit-toggle" />,
}));

// imported AFTER mocks
import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { StickySpecsBar } from "@/components/listing/sticky-specs-bar"; // imported AFTER mocks

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("StickySpecsBar (Story 4.1 — TDD RED PHASE)", () => {
  afterEach(() => {
    cleanup();
  });

  // ---------------------------------------------------------------------------
  // P0: Core content rendering
  // ---------------------------------------------------------------------------

  it.skip(
    "[P0] renders data-testid=sticky-specs-bar element",
    () => {
      // THIS TEST WILL FAIL — StickySpecsBar stub returns null; remove stub to activate
      render(
        <StickySpecsBar
          priceUsd={185000}
          bedrooms={3}
          bathrooms={2}
          lotSizeM2={1200}
          constructionM2={180}
          zmtStatus="titled"
          locale="en"
        />,
      );

      expect(screen.getByTestId("sticky-specs-bar")).toBeDefined();
    },
  );

  it.skip(
    "[P0] displays USD formatted price",
    () => {
      // THIS TEST WILL FAIL — StickySpecsBar stub returns null; remove stub to activate
      render(
        <StickySpecsBar
          priceUsd={185000}
          bedrooms={3}
          bathrooms={2}
          lotSizeM2={1200}
          constructionM2={180}
          zmtStatus="titled"
          locale="en"
        />,
      );

      const specsBar = screen.getByTestId("sticky-specs-bar");
      // formatUSD mock returns "$185,000" (or similar locale formatting)
      expect(specsBar.textContent).toContain("$");
      expect(specsBar.textContent).toContain("185");
    },
  );

  it.skip(
    "[P0] displays bedroom count when provided",
    () => {
      // THIS TEST WILL FAIL — StickySpecsBar stub returns null; remove stub to activate
      render(
        <StickySpecsBar
          priceUsd={185000}
          bedrooms={3}
          bathrooms={2}
          lotSizeM2={1200}
          constructionM2={180}
          zmtStatus="titled"
          locale="en"
        />,
      );

      const specsBar = screen.getByTestId("sticky-specs-bar");
      // The beds translation key is "beds" with count value: "beds({"count":3})"
      expect(specsBar.textContent).toContain("3");
    },
  );

  it.skip(
    "[P0] displays bathroom count when provided",
    () => {
      // THIS TEST WILL FAIL — StickySpecsBar stub returns null; remove stub to activate
      render(
        <StickySpecsBar
          priceUsd={185000}
          bedrooms={3}
          bathrooms={2}
          lotSizeM2={1200}
          constructionM2={180}
          zmtStatus="titled"
          locale="en"
        />,
      );

      const specsBar = screen.getByTestId("sticky-specs-bar");
      // The baths translation key includes "count":2
      expect(specsBar.textContent).toContain("2");
    },
  );

  it.skip(
    "[P0] renders ZMT status text",
    () => {
      // THIS TEST WILL FAIL — StickySpecsBar stub returns null; remove stub to activate
      render(
        <StickySpecsBar
          priceUsd={185000}
          bedrooms={3}
          bathrooms={2}
          lotSizeM2={1200}
          constructionM2={180}
          zmtStatus="titled"
          locale="en"
        />,
      );

      const specsBar = screen.getByTestId("sticky-specs-bar");
      // ZMT status "titled" translates to "zmtStatus.titled" via our mock
      expect(specsBar.textContent).toContain("titled");
    },
  );

  // ---------------------------------------------------------------------------
  // P1: Area display and unit toggle
  // ---------------------------------------------------------------------------

  it.skip(
    "[P1] renders lot size using convertArea when lotSizeM2 is provided",
    () => {
      // THIS TEST WILL FAIL — StickySpecsBar stub returns null; remove stub to activate
      render(
        <StickySpecsBar
          priceUsd={185000}
          bedrooms={3}
          bathrooms={2}
          lotSizeM2={1200}
          constructionM2={180}
          zmtStatus="titled"
          locale="en"
        />,
      );

      const specsBar = screen.getByTestId("sticky-specs-bar");
      // convertArea mock returns "1200 m²"
      expect(specsBar.textContent).toContain("1200");
    },
  );

  it.skip(
    "[P1] renders built area using convertArea when constructionM2 is provided",
    () => {
      // THIS TEST WILL FAIL — StickySpecsBar stub returns null; remove stub to activate
      render(
        <StickySpecsBar
          priceUsd={185000}
          bedrooms={3}
          bathrooms={2}
          lotSizeM2={1200}
          constructionM2={180}
          zmtStatus="titled"
          locale="en"
        />,
      );

      const specsBar = screen.getByTestId("sticky-specs-bar");
      // convertArea mock returns "180 m²"
      expect(specsBar.textContent).toContain("180");
    },
  );

  it.skip(
    "[P1] renders UnitToggle component",
    () => {
      // THIS TEST WILL FAIL — StickySpecsBar stub returns null; remove stub to activate
      render(
        <StickySpecsBar
          priceUsd={185000}
          bedrooms={3}
          bathrooms={2}
          lotSizeM2={1200}
          constructionM2={180}
          zmtStatus="titled"
          locale="en"
        />,
      );

      // UnitToggle mock renders data-testid="unit-toggle"
      expect(screen.getByTestId("unit-toggle")).toBeDefined();
    },
  );

  // ---------------------------------------------------------------------------
  // P2: Null handling
  // ---------------------------------------------------------------------------

  it.skip(
    "[P2] does not render bedroom spec when bedrooms is null",
    () => {
      // THIS TEST WILL FAIL — StickySpecsBar stub returns null; remove stub to activate
      render(
        <StickySpecsBar
          priceUsd={185000}
          bedrooms={null}
          bathrooms={null}
          lotSizeM2={null}
          constructionM2={null}
          zmtStatus="titled"
          locale="en"
        />,
      );

      const specsBar = screen.getByTestId("sticky-specs-bar");
      // With null bedrooms, the beds key should not be rendered
      expect(specsBar.textContent).not.toContain("beds({");
    },
  );

  it.skip(
    "[P2] renders correctly when lot size and built area are null",
    () => {
      // THIS TEST WILL FAIL — StickySpecsBar stub returns null; remove stub to activate
      render(
        <StickySpecsBar
          priceUsd={185000}
          bedrooms={3}
          bathrooms={2}
          lotSizeM2={null}
          constructionM2={null}
          zmtStatus="concession"
          locale="en"
        />,
      );

      // Should still render the bar with at minimum price and ZMT
      const specsBar = screen.getByTestId("sticky-specs-bar");
      expect(specsBar).toBeDefined();
      expect(specsBar.textContent).toContain("185");
    },
  );
});
