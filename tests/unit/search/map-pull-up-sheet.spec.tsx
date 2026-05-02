/**
 * Story 3.6: Mobile Pull-Up Sheet
 * Component: src/components/map/map-pull-up-sheet.tsx
 *
 * TDD RED PHASE — all tests use it.skip() and will FAIL until:
 *   1. MapPullUpSheet component is created (src/components/map/map-pull-up-sheet.tsx)
 *   2. @use-gesture/react is installed (npm install @use-gesture/react)
 *   3. i18n keys pullUpSheet.* are added to en.json / es.json
 *
 * Covers:
 *   AC #1 — Mobile viewport (<768px): pull-up sheet handle appears at bottom
 *   AC #2 — Peeked state (15vh): shows handle bar + "{N} properties in view" count only
 *   AC #3 — Half state (50vh): horizontal scroll carousel of 2-3 card previews
 *   AC #4 — Full state (85vh): scrollable list + close button to return to peeked
 *   AC #5 — Drag snap animation to nearest point with spring physics (300ms, cubic-bezier)
 *   AC #6 — Pull-to-refresh disabled via overscroll-behavior: none
 *   AC #7 — ARIA: role="region", aria-label="Property list", aria-expanded toggling
 *
 * Activation instructions for the dev implementing Story 3.6:
 *   1. Remove it.skip from the test you are implementing
 *   2. Run: npx vitest run tests/unit/search/map-pull-up-sheet.spec.tsx
 *   3. Verify the test FAILS before implementation, then passes after
 *   4. Commit passing tests
 */

import { describe, expect, it, vi, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ---------------------------------------------------------------------------
// Module mocks — declared before any imports of the module under test
// ---------------------------------------------------------------------------

// next-intl: handle ICU plural interpolation and pullUpSheet keys
vi.mock("next-intl", () => ({
  useTranslations: vi.fn(() => (key: string, vals?: Record<string, unknown>) => {
    if (key === "pullUpHandle.propertiesCount" && vals && "count" in vals) {
      return `${vals.count as number} properties`;
    }
    if (key === "pullUpSheet.regionLabel") return "Property list";
    if (key === "pullUpSheet.close") return "Back to map";
    if (key === "pullUpSheet.closeLabel") return "Close property list and return to map";
    return key;
  }),
}));

// @use-gesture/react: mock useDrag so tests don't require pointer events
vi.mock("@use-gesture/react", () => ({
  useDrag: vi.fn(() => () => ({})), // returns bind fn that spreads to empty object
}));

// PropertyCard: lightweight stub to isolate MapPullUpSheet behavior
vi.mock("@/components/property/property-card", () => ({
  PropertyCard: ({ property }: { property: { id: string } }) => (
    <div data-testid="property-card" data-id={property.id} />
  ),
}));

// SearchResultsSkeleton: lightweight stub
vi.mock("@/components/search/search-results-skeleton", () => ({
  SearchResultsSkeleton: () => <div data-testid="search-results-skeleton" />,
}));

// ---------------------------------------------------------------------------
// Component under test — imported AFTER mocks
// ---------------------------------------------------------------------------

import { MapPullUpSheet } from "@/components/map/map-pull-up-sheet";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const mockProperties = [
  {
    id: "prop-001",
    slug: "villa-perez-zeledon",
    titleEn: "Villa Pérez Zeledón",
    titleEs: "Villa Pérez Zeledón",
    priceUsd: 195000,
    bedrooms: 3,
    bathrooms: 2,
    lotSizeM2: 600,
    constructionM2: 180,
    zmtStatus: "titled",
    propertyType: "Casa",
    areaSlug: "perez-zeledon",
    images: [{ url: "https://example.com/img1.jpg", alt: "Villa" }],
    latitude: 9.35,
    longitude: -83.68,
  },
  {
    id: "prop-002",
    slug: "finca-san-isidro",
    titleEn: "Finca San Isidro",
    titleEs: "Finca San Isidro",
    priceUsd: 320000,
    bedrooms: 4,
    bathrooms: 3,
    lotSizeM2: 2000,
    constructionM2: 250,
    zmtStatus: "titled",
    propertyType: "Finca",
    areaSlug: "san-isidro",
    images: [],
    latitude: 9.37,
    longitude: -83.71,
  },
  {
    id: "prop-003",
    slug: "apartamento-centro",
    titleEn: "Apartamento Centro",
    titleEs: "Apartamento Centro",
    priceUsd: 85000,
    bedrooms: 2,
    bathrooms: 1,
    lotSizeM2: 0,
    constructionM2: 75,
    zmtStatus: "untitled",
    propertyType: "Apartamento",
    areaSlug: "centro",
    images: [],
    latitude: 9.34,
    longitude: -83.65,
  },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("MapPullUpSheet", () => {
  // -------------------------------------------------------------------------
  // AC #1 / AC #2: Default peeked state — root element presence
  // -------------------------------------------------------------------------

  it(
    "[P0] renders data-testid='pull-up-sheet' root element in peeked state by default",
    () => {
      // THIS TEST WILL FAIL — MapPullUpSheet not yet implemented
      render(
        <MapPullUpSheet
          properties={mockProperties}
          locale="en"
          propertyCount={mockProperties.length}
        />,
      );

      const sheet = document.querySelector('[data-testid="pull-up-sheet"]');
      expect(sheet).not.toBeNull();
      expect(sheet?.getAttribute("data-state")).toBe("peeked");
    },
  );

  // -------------------------------------------------------------------------
  // AC #2: Drag handle bar
  // -------------------------------------------------------------------------

  it(
    "[P0] renders data-testid='pull-up-handle' drag handle bar",
    () => {
      // THIS TEST WILL FAIL — MapPullUpSheet not yet implemented
      render(
        <MapPullUpSheet
          properties={mockProperties}
          locale="en"
          propertyCount={mockProperties.length}
        />,
      );

      const handle = document.querySelector('[data-testid="pull-up-handle"]');
      expect(handle).not.toBeNull();
      // Drag handle must NOT have a click handler (gesture handled by @use-gesture/react bind spread)
      expect((handle as HTMLElement | null)?.onclick).toBeNull();
    },
  );

  // -------------------------------------------------------------------------
  // AC #2: Peeked state content — count label, no PropertyCard
  // -------------------------------------------------------------------------

  it(
    "[P0] peeked state: shows property count label and does NOT render PropertyCard",
    () => {
      // THIS TEST WILL FAIL — MapPullUpSheet not yet implemented
      render(
        <MapPullUpSheet
          properties={mockProperties}
          locale="en"
          propertyCount={3}
        />,
      );

      // Count label must be visible
      const countLabel = document.querySelector('[data-testid="pull-up-sheet"]')
        ?.textContent;
      expect(countLabel).toContain("3 properties");

      // PropertyCard must NOT be rendered in peeked state
      const card = document.querySelector('[data-testid="property-card"]');
      expect(card).toBeNull();
    },
  );

  // -------------------------------------------------------------------------
  // AC #7: ARIA — role, aria-label
  // -------------------------------------------------------------------------

  it(
    "[P0] has role='region' and aria-label='Property list'",
    () => {
      // THIS TEST WILL FAIL — MapPullUpSheet not yet implemented
      render(
        <MapPullUpSheet
          properties={mockProperties}
          locale="en"
          propertyCount={mockProperties.length}
        />,
      );

      const sheet = document.querySelector('[role="region"]');
      expect(sheet).not.toBeNull();
      expect(sheet?.getAttribute("aria-label")).toBe("Property list");
    },
  );

  // -------------------------------------------------------------------------
  // AC #7: ARIA — aria-expanded in peeked state is "false"
  // -------------------------------------------------------------------------

  it(
    "[P0] has aria-expanded='false' in peeked state; has aria-expanded='true' when initialState='half'",
    () => {
      // THIS TEST WILL FAIL — MapPullUpSheet not yet implemented
      const { unmount } = render(
        <MapPullUpSheet
          properties={mockProperties}
          locale="en"
          propertyCount={mockProperties.length}
        />,
      );

      const peekedSheet = document.querySelector('[data-testid="pull-up-sheet"]');
      expect(peekedSheet?.getAttribute("aria-expanded")).toBe("false");
      unmount();
      cleanup();

      // Now render with initialState="half" — aria-expanded should be "true"
      render(
        <MapPullUpSheet
          properties={mockProperties}
          locale="en"
          propertyCount={mockProperties.length}
          initialState="half"
        />,
      );
      const halfSheet = document.querySelector('[data-testid="pull-up-sheet"]');
      expect(halfSheet?.getAttribute("aria-expanded")).toBe("true");
    },
  );

  // -------------------------------------------------------------------------
  // AC #4: Full state — renders PropertyCards for all properties
  // -------------------------------------------------------------------------

  it(
    "[P1] full state (initialState='full'): renders PropertyCards for all properties",
    () => {
      // THIS TEST WILL FAIL — MapPullUpSheet not yet implemented
      render(
        <MapPullUpSheet
          properties={mockProperties}
          locale="en"
          propertyCount={mockProperties.length}
          initialState="full"
        />,
      );

      const cards = document.querySelectorAll('[data-testid="property-card"]');
      expect(cards.length).toBe(mockProperties.length);

      // Each card should correspond to a property id
      const renderedIds = Array.from(cards).map((c) => c.getAttribute("data-id"));
      expect(renderedIds).toContain("prop-001");
      expect(renderedIds).toContain("prop-002");
      expect(renderedIds).toContain("prop-003");
    },
  );

  // -------------------------------------------------------------------------
  // AC #4: Full state — renders SearchResultsSkeleton when loading
  // -------------------------------------------------------------------------

  it(
    "[P1] full state (initialState='full'): renders SearchResultsSkeleton when isLoading=true",
    () => {
      // THIS TEST WILL FAIL — MapPullUpSheet not yet implemented
      render(
        <MapPullUpSheet
          properties={[]}
          locale="en"
          propertyCount={0}
          initialState="full"
          isLoading={true}
        />,
      );

      const skeleton = document.querySelector('[data-testid="search-results-skeleton"]');
      expect(skeleton).not.toBeNull();

      // No PropertyCards when loading
      const cards = document.querySelectorAll('[data-testid="property-card"]');
      expect(cards.length).toBe(0);
    },
  );

  // -------------------------------------------------------------------------
  // AC #4: Full state — close button returns sheet to peeked
  // -------------------------------------------------------------------------

  it(
    "[P1] full state (initialState='full'): renders close button; clicking it updates data-state to 'peeked'",
    async () => {
      // THIS TEST WILL FAIL — MapPullUpSheet not yet implemented
      const user = userEvent.setup();

      render(
        <MapPullUpSheet
          properties={mockProperties}
          locale="en"
          propertyCount={mockProperties.length}
          initialState="full"
        />,
      );

      // Close button should be visible in full state
      const closeButton = document.querySelector(
        '[aria-label="Close property list and return to map"]',
      ) as HTMLButtonElement | null;
      expect(closeButton).not.toBeNull();
      expect(closeButton?.textContent).toContain("Back to map");

      // Click the close button — sheet should snap back to peeked
      await user.click(closeButton!);

      const sheet = document.querySelector('[data-testid="pull-up-sheet"]');
      expect(sheet?.getAttribute("data-state")).toBe("peeked");
      // aria-expanded should now be "false" after returning to peeked
      expect(sheet?.getAttribute("aria-expanded")).toBe("false");
    },
  );

  // -------------------------------------------------------------------------
  // AC #3: Half state — renders up to 3 PropertyCards in horizontal scroll container
  // -------------------------------------------------------------------------

  it(
    "[P2] half state (initialState='half'): renders up to 3 PropertyCards in horizontal scroll container",
    () => {
      // THIS TEST WILL FAIL — MapPullUpSheet not yet implemented
      render(
        <MapPullUpSheet
          properties={mockProperties}
          locale="en"
          propertyCount={mockProperties.length}
          initialState="half"
        />,
      );

      const sheet = document.querySelector('[data-testid="pull-up-sheet"]');
      expect(sheet?.getAttribute("data-state")).toBe("half");

      // At most 3 cards in half state (horizontal scroll carousel)
      const cards = document.querySelectorAll('[data-testid="property-card"]');
      expect(cards.length).toBeGreaterThan(0);
      expect(cards.length).toBeLessThanOrEqual(3);

      // The horizontal scroll container should use overflow-x-auto (or snap-x)
      const scrollContainer = document.querySelector(".overflow-x-auto");
      expect(scrollContainer).not.toBeNull();
    },
  );

  // -------------------------------------------------------------------------
  // AC #5 / AC #6: Height transitions and overscroll
  // -------------------------------------------------------------------------

  it(
    "[P2] applies height based on snap state and overscroll-behavior: none on scroll container",
    () => {
      // THIS TEST WILL FAIL — MapPullUpSheet not yet implemented
      render(
        <MapPullUpSheet
          properties={mockProperties}
          locale="en"
          propertyCount={mockProperties.length}
          initialState="full"
        />,
      );

      const sheet = document.querySelector('[data-testid="pull-up-sheet"]') as HTMLElement | null;
      expect(sheet).not.toBeNull();
      // Height should be 85vh in full state
      expect(sheet?.style.height).toBe("85vh");

      // The scroll container in full state should have overscrollBehavior: none
      // (via style={{ overscrollBehavior: 'none' }})
      const scrollContainer = sheet?.querySelector(".overflow-y-auto") as HTMLElement | null;
      expect(scrollContainer).not.toBeNull();
      expect(scrollContainer?.style.overscrollBehavior).toBe("none");
    },
  );

  // -------------------------------------------------------------------------
  // AC #1: lg:hidden — sheet is only visible on mobile (CSS class check)
  // -------------------------------------------------------------------------

  it(
    "[P2] root element has 'lg:hidden' class (renders only on mobile, hidden on desktop)",
    () => {
      // THIS TEST WILL FAIL — MapPullUpSheet not yet implemented
      render(
        <MapPullUpSheet
          properties={mockProperties}
          locale="en"
          propertyCount={mockProperties.length}
        />,
      );

      const sheet = document.querySelector('[data-testid="pull-up-sheet"]');
      expect(sheet?.className).toContain("lg:hidden");
    },
  );
});
