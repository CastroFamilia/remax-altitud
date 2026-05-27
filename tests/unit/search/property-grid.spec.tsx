/**
 * Story 3.5: Property Cards & Grid View
 * Component: src/components/property/property-grid.tsx
 *
 * TDD RED PHASE — all tests use it() and will FAIL until
 * property-grid.tsx is implemented.
 *
 * Covers:
 *   AC #2  — Desktop grid: 3-column layout (≥1024px, lg:grid-cols-3)
 *   AC #3  — Tablet grid: 2-column layout (768-1023px, sm:grid-cols-2)
 *   AC #4  — Mobile grid: single-column full-width (<768px, grid-cols-1)
 *   AC #6  — Pagination: ≤20 cards per page; prev/next controls when total > 20
 *
 * Environment: jsdom (React component — .spec.tsx → jsdom via vitest.config.mts)
 *
 * Component interface:
 *   interface PropertyGridProps {
 *     properties: PropertySearchItem[];
 *     locale: string;
 *     isLoading?: boolean;
 *     total?: number;
 *     page?: number;
 *     onPageChange?: (page: number) => void;
 *   }
 */

import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";
import { render, cleanup, fireEvent } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Module mocks — declared BEFORE any imports of the module under test
// ---------------------------------------------------------------------------

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ replace: vi.fn(), push: vi.fn() })),
  useSearchParams: vi.fn(() => ({
    toString: vi.fn(() => ""),
    get: vi.fn(() => null),
  })),
  usePathname: vi.fn(() => "/en/search"),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    className,
  }: {
    src: string;
    alt: string;
    className?: string;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} />
  ),
}));

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(
    () => (key: string, values?: Record<string, unknown>) => {
      // Mirror the real keys used by PropertyGrid so that consumers asserting
      // on text content (e.g., "Page 1 of 3", "Previous", "Next", empty
      // state) receive readable strings.
      const templates: Record<string, string> = {
        page: "Page {page} of {total}",
        prev: "Previous",
        next: "Next",
        showing: "Showing {count} of {total} properties",
        empty: "No properties found",
      };
      const template = templates[key] ?? key;
      if (values) {
        return template
          .replace("{page}", String(values.page))
          .replace("{total}", String(values.total))
          .replace("{count}", String(values.count));
      }
      return template;
    },
  ),
}));

vi.mock("@/components/search/search-results-skeleton", () => ({
  SearchResultsSkeleton: () => (
    <div data-testid="search-results-skeleton" aria-busy="true" />
  ),
}));

vi.mock("@/components/property/property-card", () => ({
  PropertyCard: ({
    property,
  }: {
    property: { id: string; titleEn: string };
    locale: string;
  }) => <div data-testid="property-card" data-property-id={property.id}>{property.titleEn}</div>,
}));

vi.mock("@/components/property/save-button", () => ({
  SaveButton: () => (
    <button data-testid="save-button" aria-label="Save property">
      ♡
    </button>
  ),
}));

vi.mock("@/components/property/share-button", () => ({
  ShareButton: () => (
    <button data-testid="share-button" aria-label="Share property">
      ↗
    </button>
  ),
}));

// Story 3.8 addition: mock NoResultsState so PropertyGrid tests remain
// independent of the NoResultsState implementation.
vi.mock("@/components/property/no-results-state", () => ({
  NoResultsState: ({ filters }: { filters: object }) => (
    <div data-testid="no-results-state">
      no-results: {JSON.stringify(filters)}
    </div>
  ),
}));

// ---------------------------------------------------------------------------
// Component under test — imported AFTER mocks
// ---------------------------------------------------------------------------

import { PropertyGrid } from "@/components/property/property-grid";
import type { PropertySearchItem } from "@/types/search";

// ---------------------------------------------------------------------------
// Test helpers & fixtures
// ---------------------------------------------------------------------------

function makeProperties(count: number): PropertySearchItem[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `prop-${i + 1}`,
    slug: `property-${i + 1}`,
    titleEn: `Property ${i + 1}`,
    titleEs: `Propiedad ${i + 1}`,
    priceUsd: 100000 + i * 5000,
    bedrooms: 2,
    bathrooms: 1,
    lotSizeM2: 200,
    constructionM2: 100,
    zmtStatus: "titled",
    propertyType: "Casa",
    status: "active",
    areaSlug: "perez-zeledon",
    images: [{ src: `/images/property-${i + 1}.jpg`, alt: `Property ${i + 1}` }],
    latitude: 9.3 + i * 0.01,
    longitude: -83.6 + i * 0.01,
  }));
}

const noop = vi.fn();

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

beforeEach(() => {
  localStorage.clear();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("PropertyGrid — AC #2/#3/#4: responsive grid layout", () => {
  // -------------------------------------------------------------------------
  // data-testid presence
  // -------------------------------------------------------------------------

  it(
    "[P0] renders data-testid='property-grid' on root element",
    () => {
      // THIS TEST WILL FAIL — property-grid.tsx not yet implemented
      render(
        <PropertyGrid properties={makeProperties(3)} locale="en" />,
      );

      const grid = document.querySelector('[data-testid="property-grid"]');
      expect(grid).not.toBeNull();
    },
  );

  // -------------------------------------------------------------------------
  // Responsive grid classes
  // -------------------------------------------------------------------------

  it(
    "[P0] grid has grid-cols-1 class for mobile (default / base)",
    () => {
      // THIS TEST WILL FAIL — property-grid.tsx not yet implemented
      render(
        <PropertyGrid properties={makeProperties(3)} locale="en" />,
      );

      const grid = document.querySelector('[data-testid="property-grid"]');
      expect(grid).not.toBeNull();
      expect(grid?.className).toContain("grid-cols-1");
    },
  );

  it(
    "[P0] grid has sm:grid-cols-2 class for tablet breakpoint (768px+)",
    () => {
      // THIS TEST WILL FAIL — property-grid.tsx not yet implemented
      render(
        <PropertyGrid properties={makeProperties(3)} locale="en" />,
      );

      const grid = document.querySelector('[data-testid="property-grid"]');
      expect(grid?.className).toContain("sm:grid-cols-2");
    },
  );

  it(
    "[P0] grid has lg:grid-cols-3 class for desktop breakpoint (1024px+)",
    () => {
      // THIS TEST WILL FAIL — property-grid.tsx not yet implemented
      render(
        <PropertyGrid properties={makeProperties(3)} locale="en" />,
      );

      const grid = document.querySelector('[data-testid="property-grid"]');
      expect(grid?.className).toContain("lg:grid-cols-3");
    },
  );

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------

  it(
    "[P0] renders SearchResultsSkeleton when isLoading=true",
    () => {
      // THIS TEST WILL FAIL — property-grid.tsx not yet implemented
      render(
        <PropertyGrid properties={[]} locale="en" isLoading={true} />,
      );

      const skeleton = document.querySelector(
        '[data-testid="search-results-skeleton"]',
      );
      expect(skeleton).not.toBeNull();
    },
  );

  it(
    "[P0] does NOT render PropertyCards when isLoading=true",
    () => {
      // THIS TEST WILL FAIL — property-grid.tsx not yet implemented
      render(
        <PropertyGrid
          properties={makeProperties(3)}
          locale="en"
          isLoading={true}
        />,
      );

      const cards = document.querySelectorAll('[data-testid="property-card"]');
      expect(cards).toHaveLength(0);
    },
  );

  // -------------------------------------------------------------------------
  // Property rendering
  // -------------------------------------------------------------------------

  it(
    "[P0] renders N PropertyCards when given N properties",
    () => {
      // THIS TEST WILL FAIL — property-grid.tsx not yet implemented
      const properties = makeProperties(5);
      render(<PropertyGrid properties={properties} locale="en" />);

      const cards = document.querySelectorAll('[data-testid="property-card"]');
      expect(cards).toHaveLength(5);
    },
  );

  it(
    "[P0] renders exactly 20 cards (max per page) when more than 20 properties are passed",
    () => {
      // THIS TEST WILL FAIL — property-grid.tsx not yet implemented
      const properties = makeProperties(25);
      render(<PropertyGrid properties={properties} locale="en" page={1} total={25} />);

      const cards = document.querySelectorAll('[data-testid="property-card"]');
      expect(cards).toHaveLength(20);
    },
  );

  it(
    "[P1] renders second page of cards when page=2 and >20 properties passed",
    () => {
      // THIS TEST WILL FAIL — property-grid.tsx not yet implemented
      const properties = makeProperties(25);
      render(
        <PropertyGrid
          properties={properties}
          locale="en"
          page={2}
          total={25}
        />,
      );

      // Page 2 should show the remaining 5 (properties 21-25)
      const cards = document.querySelectorAll('[data-testid="property-card"]');
      expect(cards).toHaveLength(5);
    },
  );

  // -------------------------------------------------------------------------
  // Empty state
  // -------------------------------------------------------------------------

  it(
    "[P1] renders a no-results message when properties is empty and isLoading is false",
    () => {
      // THIS TEST WILL FAIL — property-grid.tsx not yet implemented
      render(
        <PropertyGrid properties={[]} locale="en" isLoading={false} />,
      );

      const cards = document.querySelectorAll('[data-testid="property-card"]');
      expect(cards).toHaveLength(0);

      // Should render some empty state element — not nothing at all
      const grid = document.querySelector('[data-testid="property-grid"]');
      expect(grid).not.toBeNull();
      // Grid container should still be present even when empty
    },
  );

  // -------------------------------------------------------------------------
  // Story 3.8 addition: NoResultsState replaces old empty text (AC #1, #2)
  // -------------------------------------------------------------------------

  it(
    "[P0] Story 3.8: renders NoResultsState (data-testid='no-results-state') when properties=[] and isLoading=false",
    () => {
      // THIS TEST WILL FAIL — PropertyGrid does not yet render NoResultsState
      // (currently renders tGrid("empty") plain text)
      render(
        <PropertyGrid properties={[]} locale="en" isLoading={false} />,
      );

      const noResults = document.querySelector('[data-testid="no-results-state"]');
      expect(noResults).not.toBeNull();

      // Old empty text must NOT appear (replaced by NoResultsState)
      const grid = document.querySelector('[data-testid="property-grid"]');
      expect(grid?.textContent).not.toContain("No properties found");
    },
  );

  it(
    "[P0] Story 3.8: passes filters prop through to NoResultsState",
    () => {
      // THIS TEST WILL FAIL — PropertyGrid does not yet accept/pass a filters prop
      render(
        <PropertyGrid
          properties={[]}
          locale="en"
          isLoading={false}
          filters={{ type: "Casa" }}
        />,
      );

      const noResults = document.querySelector('[data-testid="no-results-state"]');
      expect(noResults).not.toBeNull();
      // The mock renders the stringified filters — verify they were forwarded
      expect(noResults?.textContent).toContain("Casa");
    },
  );
});

describe("PropertyGrid — AC #6: pagination controls", () => {
  // -------------------------------------------------------------------------
  // Pagination visibility
  // -------------------------------------------------------------------------

  it(
    "[P0] pagination controls are NOT rendered when total <= 20",
    () => {
      // THIS TEST WILL FAIL — property-grid.tsx not yet implemented
      render(
        <PropertyGrid
          properties={makeProperties(10)}
          locale="en"
          total={10}
          page={1}
        />,
      );

      const prevButton = document.querySelector(
        '[data-testid="pagination-prev"]',
      );
      const nextButton = document.querySelector(
        '[data-testid="pagination-next"]',
      );
      // No pagination needed when ≤ 20 results
      expect(prevButton).toBeNull();
      expect(nextButton).toBeNull();
    },
  );

  it(
    "[P0] pagination controls appear when total > 20",
    () => {
      // THIS TEST WILL FAIL — property-grid.tsx not yet implemented
      render(
        <PropertyGrid
          properties={makeProperties(20)}
          locale="en"
          total={45}
          page={1}
        />,
      );

      // Next button should be present
      const nextButton = document.querySelector(
        '[data-testid="pagination-next"]',
      );
      expect(nextButton).not.toBeNull();
    },
  );

  it(
    "[P0] 'Previous' button is disabled on page 1",
    () => {
      // THIS TEST WILL FAIL — property-grid.tsx not yet implemented
      render(
        <PropertyGrid
          properties={makeProperties(20)}
          locale="en"
          total={45}
          page={1}
        />,
      );

      const prevButton = document.querySelector(
        '[data-testid="pagination-prev"]',
      );
      // Prev button must be present and in a disabled state on page 1
      expect(prevButton).not.toBeNull();
      expect(
        prevButton!.getAttribute("disabled") !== null ||
        prevButton!.getAttribute("aria-disabled") === "true",
      ).toBe(true);
    },
  );

  it(
    "[P1] clicking 'Next' pagination button calls onPageChange with page + 1",
    () => {
      // THIS TEST WILL FAIL — property-grid.tsx not yet implemented
      const onPageChange = vi.fn();
      render(
        <PropertyGrid
          properties={makeProperties(20)}
          locale="en"
          total={45}
          page={1}
          onPageChange={onPageChange}
        />,
      );

      const nextButton = document.querySelector(
        '[data-testid="pagination-next"]',
      );
      expect(nextButton).not.toBeNull();
      fireEvent.click(nextButton!);

      expect(onPageChange).toHaveBeenCalledWith(2);
    },
  );

  it(
    "[P1] clicking 'Previous' pagination button calls onPageChange with page - 1",
    () => {
      // THIS TEST WILL FAIL — property-grid.tsx not yet implemented
      const onPageChange = vi.fn();
      render(
        <PropertyGrid
          properties={makeProperties(20)}
          locale="en"
          total={45}
          page={2}
          onPageChange={onPageChange}
        />,
      );

      const prevButton = document.querySelector(
        '[data-testid="pagination-prev"]',
      );
      expect(prevButton).not.toBeNull();
      fireEvent.click(prevButton!);

      expect(onPageChange).toHaveBeenCalledWith(1);
    },
  );

  it(
    "[P1] 'Next' button is disabled on the last page",
    () => {
      // THIS TEST WILL FAIL — property-grid.tsx not yet implemented
      const properties = makeProperties(5); // last page: 5 remaining items
      render(
        <PropertyGrid
          properties={properties}
          locale="en"
          total={25}
          page={2}
          onPageChange={noop}
        />,
      );

      const nextButton = document.querySelector(
        '[data-testid="pagination-next"]',
      );
      // Next button must be present and in a disabled state on the last page
      expect(nextButton).not.toBeNull();
      expect(
        nextButton!.getAttribute("disabled") !== null ||
        nextButton!.getAttribute("aria-disabled") === "true",
      ).toBe(true);
    },
  );

  it(
    "[P2] pagination shows 'Page X of Y' text when total > 20",
    () => {
      // THIS TEST WILL FAIL — property-grid.tsx not yet implemented
      render(
        <PropertyGrid
          properties={makeProperties(20)}
          locale="en"
          total={45}
          page={1}
        />,
      );

      const gridEl = document.querySelector('[data-testid="property-grid"]');
      // Should display page indicator
      expect(gridEl?.textContent).toMatch(/page.*1/i);
    },
  );

  // -------------------------------------------------------------------------
  // Architecture compliance
  // -------------------------------------------------------------------------

  it(
    "[P1] PropertyGrid is a Client Component (file must start with 'use client')",
    async () => {
      // THIS TEST WILL FAIL — property-grid.tsx not yet implemented
      const fs = await import("node:fs");
      const path = await import("node:path");

      const filePath = path.resolve(
        process.cwd(),
        "src/components/property/property-grid.tsx",
      );
      expect(fs.existsSync(filePath)).toBe(true);

      const src = fs.readFileSync(filePath, "utf8");
      expect(src.trimStart()).toMatch(/^['"]use client['"]/);
    },
  );
});
