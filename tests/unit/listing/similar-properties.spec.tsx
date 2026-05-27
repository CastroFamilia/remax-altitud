/**
 * Story 4.5: Similar Properties & Cross-Linking
 * Component: src/components/listing/similar-properties.tsx
 *
 * TDD Phase: RED — all tests are it() until implementation is done.
 * Remove it() per test when implementing to verify green phase.
 *
 * Covers:
 *   AC #1  — "Similar Properties" section appears with horizontal carousel of PropertyCards
 *   AC #5  — Mobile: horizontal swipe carousel (overflow-x-auto, CSS snap)
 *   AC #6  — Uses PropertyCard component from Epic 3 with variant="compact"
 *   AC #7  — Gracefully shows 1–2 cards or "Browse all properties" CTA if none found
 *
 * Test IDs from test-design-epic-4.md:
 *   4.5-E2E-001 unit analog — carousel renders with PropertyCards (P1)
 *   4.5-UNIT-001 analog    — empty state CTA (P0)
 *
 * data-testid contract (CANNOT rename):
 *   data-testid="similar-properties-carousel" — section container when properties are present
 *   data-testid="similar-properties-empty"    — section container when no properties found
 *   data-testid="similar-browse-cta"          — fallback CTA link
 *
 * Environment: jsdom (React component — .spec.tsx → jsdom via vitest.config.mts)
 */

// ---------------------------------------------------------------------------
// Module mocks — declared BEFORE any imports of the module under test
// ---------------------------------------------------------------------------

import { vi, describe, it, expect, afterEach } from "vitest";

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(() =>
    Promise.resolve((key: string) => key),
  ),
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/property/property-card", () => ({
  PropertyCard: ({ property }: { property: { slug: string } }) => (
    <div data-testid="property-card">{property.slug}</div>
  ),
}));

// imported AFTER mocks
import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import type { PropertySearchItem } from "@/types/search";

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const mockProperties: PropertySearchItem[] = [
  {
    id: "prop-1",
    slug: "casa-verde",
    titleEn: "Casa Verde",
    titleEs: "Casa Verde",
    priceUsd: 250000,
    bedrooms: 3,
    bathrooms: 2,
    lotSizeM2: 500,
    constructionM2: 120,
    zmtStatus: "titled",
    propertyType: "Casa",
    status: "active",
    areaSlug: "perez-zeledon",
    images: [{ src: "/img/casa-verde.jpg" }],
    latitude: 9.37,
    longitude: -83.69,
  },
  {
    id: "prop-2",
    slug: "villa-azul",
    titleEn: "Villa Azul",
    titleEs: "Villa Azul",
    priceUsd: 275000,
    bedrooms: 4,
    bathrooms: 3,
    lotSizeM2: 700,
    constructionM2: 180,
    zmtStatus: "titled",
    propertyType: "Casa",
    status: "active",
    areaSlug: "perez-zeledon",
    images: [{ src: "/img/villa-azul.jpg", alt: "Villa Azul" }],
    latitude: 9.38,
    longitude: -83.7,
  },
];

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Helper: render async Server Component in test context
// ---------------------------------------------------------------------------

async function renderSimilarProperties(
  properties: PropertySearchItem[],
  locale = "en",
  currentPropertySlug = "current-property",
) {
  // SimilarProperties is an async Server Component — in Vitest/jsdom context,
  // async Server Components render as standard async functions.
  // Dynamic import to avoid hoisting issues with mocks.
  const { SimilarProperties } = await import(
    "@/components/listing/similar-properties"
  );
  const jsx = await SimilarProperties({ properties, locale, currentPropertySlug });
  render(jsx as React.ReactElement);
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe("Story 4.5: SimilarProperties component", () => {
  // [P0] Core rendering — carousel when properties are present

  it(
    "[P0] 4.5-COMP-001: renders data-testid='similar-properties-carousel' when properties are provided (AC #1)",
    async () => {
      // THIS TEST WILL FAIL — SimilarProperties component not yet implemented
      await renderSimilarProperties(mockProperties);

      const carousel = screen.getByTestId("similar-properties-carousel");
      expect(carousel).toBeTruthy();
    },
  );

  it(
    "[P0] 4.5-COMP-002: renders the correct number of PropertyCard elements (AC #1, #6)",
    async () => {
      // THIS TEST WILL FAIL — SimilarProperties component not yet implemented
      await renderSimilarProperties(mockProperties);

      const cards = screen.getAllByTestId("property-card");
      expect(cards).toHaveLength(mockProperties.length);
    },
  );

  it(
    "[P0] 4.5-COMP-003: renders data-testid='similar-properties-empty' when properties array is empty (AC #7)",
    async () => {
      // THIS TEST WILL FAIL — SimilarProperties component not yet implemented
      await renderSimilarProperties([]);

      const emptySection = screen.getByTestId("similar-properties-empty");
      expect(emptySection).toBeTruthy();
    },
  );

  it(
    "[P0] 4.5-COMP-004: renders data-testid='similar-browse-cta' link in empty state (AC #7)",
    async () => {
      // THIS TEST WILL FAIL — SimilarProperties component not yet implemented
      await renderSimilarProperties([]);

      const cta = screen.getByTestId("similar-browse-cta");
      expect(cta).toBeTruthy();
      expect(cta.getAttribute("href")).toContain("/search");
    },
  );

  // [P1] i18n and accessibility

  it(
    "[P1] 4.5-COMP-005: heading text matches i18n key 'heading' (AC #1)",
    async () => {
      // THIS TEST WILL FAIL — SimilarProperties component not yet implemented
      await renderSimilarProperties(mockProperties);

      // The mock getTranslations returns (key) => key, so heading text = 'heading'
      const heading = screen.getByText("heading");
      expect(heading).toBeTruthy();
    },
  );

  it(
    "[P1] 4.5-COMP-006: does not render similar-properties-empty when properties are present (AC #7 negative)",
    async () => {
      // THIS TEST WILL FAIL — SimilarProperties component not yet implemented
      await renderSimilarProperties(mockProperties);

      const emptySection = screen.queryByTestId("similar-properties-empty");
      expect(emptySection).toBeNull();
    },
  );

  it(
    "[P1] 4.5-COMP-007: does not render PropertyCards in empty state (AC #7 negative)",
    async () => {
      // THIS TEST WILL FAIL — SimilarProperties component not yet implemented
      await renderSimilarProperties([]);

      const cards = screen.queryAllByTestId("property-card");
      expect(cards).toHaveLength(0);
    },
  );

  // [P2] Layout and CSS classes

  it(
    "[P2] 4.5-COMP-008: carousel container has overflow-x-auto and snap-x classes (AC #5)",
    async () => {
      // THIS TEST WILL FAIL — SimilarProperties component not yet implemented
      await renderSimilarProperties(mockProperties);

      const carousel = screen.getByTestId("similar-properties-carousel");
      // The inner scroll container should have overflow-x-auto and snap-x
      const scrollContainer = carousel.querySelector(".overflow-x-auto");
      expect(scrollContainer).toBeTruthy();
      expect(scrollContainer?.classList.contains("snap-x")).toBe(true);
    },
  );

  it(
    "[P2] 4.5-COMP-009: aria-labelledby on section matches id on heading (accessibility, AC #1)",
    async () => {
      // THIS TEST WILL FAIL — SimilarProperties component not yet implemented
      await renderSimilarProperties(mockProperties);

      const carousel = screen.getByTestId("similar-properties-carousel");
      const labelledById = carousel.getAttribute("aria-labelledby");
      expect(labelledById).toBeTruthy();

      const heading = document.getElementById(labelledById!);
      expect(heading).toBeTruthy();
    },
  );

  it(
    "[P2] 4.5-COMP-010: renders gracefully with 1 property (AC #7 — fewer than 3)",
    async () => {
      // THIS TEST WILL FAIL — SimilarProperties component not yet implemented
      await renderSimilarProperties([mockProperties[0]]);

      const carousel = screen.getByTestId("similar-properties-carousel");
      expect(carousel).toBeTruthy();
      const cards = screen.getAllByTestId("property-card");
      expect(cards).toHaveLength(1);
    },
  );
});
