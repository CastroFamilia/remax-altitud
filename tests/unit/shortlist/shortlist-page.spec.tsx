/**
 * Story 7.2: Shortlist Comparison Page — Component Unit Tests
 * Component: src/components/shortlist/shortlist-page-client.tsx
 *
 * Covers:
 *   - AC #1: Side-by-side comparison layout with key specs and remove (✕) button.
 *   - AC #2: Mini-map rendering showing all saved property locations.
 *   - AC #3: Friendly empty state message and search page CTA when shortlist is empty.
 *   - AC #4: Interactive removal of items immediately recalculating UI.
 *   - AC #5: Two specific CTAs: "Ask about these" and "Share my shortlist".
 *   - AC #8: Hydration mismatch protection via a loading skeleton (`PropertyCardSkeleton`) until loaded.
 *
 * Environment: jsdom (React component — .spec.tsx → jsdom via environmentMatchGlobs)
 * Marked with describe.skip for the TDD RED phase.
 */

import { describe, expect, it, vi, afterEach } from "vitest";
import { render, cleanup, fireEvent } from "@testing-library/react";
import React from "react";

// ---------------------------------------------------------------------------
// Module mocks — declared BEFORE any imports of the module under test
// ---------------------------------------------------------------------------

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(() => (key: string) => {
    const translations: Record<string, string> = {
      "Shortlist.title": "My Saved Properties",
      "Shortlist.emptyState": "No properties saved yet. Browse listings and tap ♡ to save.",
      "Shortlist.browseCta": "Browse Listings",
      "Shortlist.askAgentCta": "Ask about these",
      "Shortlist.shareShortlistCta": "Share my shortlist",
    };
    return translations[key] || key;
  }),
}));

const mockUseShortlist = vi.fn();
vi.mock("@/hooks/use-shortlist", () => ({
  useShortlist: () => mockUseShortlist(),
}));

const mockGetShortlistProperties = vi.fn();
vi.mock("@/app/actions/shortlist-actions", () => ({
  getShortlistProperties: (ids: string[]) => mockGetShortlistProperties(ids),
}));

vi.mock("@/components/map/map-view-loader", () => ({
  MapView: ({ properties }: any) => (
    <div data-testid="map-view">Map with {properties ? properties.length : 0} pins</div>
  ),
}));

vi.mock("@/components/property/property-card", () => ({
  PropertyCard: ({ property, onRemove }: any) => (
    <div data-testid={`property-card-${property.id}`}>
      <h3>{property.titleEn}</h3>
      <button data-testid={`remove-${property.id}`} onClick={() => onRemove && onRemove(property.id)}>
        ✕
      </button>
    </div>
  ),
}));

vi.mock("@/components/property/property-card-skeleton", () => ({
  PropertyCardSkeleton: () => <div data-testid="property-card-skeleton">Skeleton</div>,
}));

// ---------------------------------------------------------------------------
// Component under test — imported AFTER mocks
// ---------------------------------------------------------------------------
import { ShortlistPageClient } from "@/components/shortlist/shortlist-page-client";

describe.skip("ShortlistPageClient — Story 7.2 ATDD (RED PHASE)", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("[P0] renders skeletons during loading state (AC #8)", () => {
    mockUseShortlist.mockReturnValue({
      isLoaded: false,
      shortlist: [],
      remove: vi.fn(),
    });

    const { getAllByTestId } = render(<ShortlistPageClient />);
    expect(getAllByTestId("property-card-skeleton").length).toBeGreaterThanOrEqual(3);
  });

  it("[P0] renders empty state elements when no properties are saved (AC #3)", () => {
    mockUseShortlist.mockReturnValue({
      isLoaded: true,
      shortlist: [],
      remove: vi.fn(),
    });

    const { getByText } = render(<ShortlistPageClient />);
    expect(getByText("No properties saved yet. Browse listings and tap ♡ to save.")).toBeTruthy();
  });

  it("[P0] renders saved list items and passes them to map when shortlist has items (AC #1, #2)", async () => {
    mockUseShortlist.mockReturnValue({
      isLoaded: true,
      shortlist: ["prop-1", "prop-2"],
      remove: vi.fn(),
    });

    mockGetShortlistProperties.mockResolvedValue([
      { id: "prop-1", titleEn: "House 1" },
      { id: "prop-2", titleEn: "House 2" },
    ]);

    const { getByTestId, findByTestId } = render(<ShortlistPageClient />);

    // Wait for Server Action to resolve and component to update local state
    await findByTestId("property-card-prop-1");
    expect(getByTestId("property-card-prop-2")).toBeTruthy();

    const mapView = getByTestId("map-view");
    expect(mapView.textContent).toContain("Map with 2 pins");
  });

  it("[P0] removal trigger executes expected handlers (AC #4)", async () => {
    const mockRemove = vi.fn();
    mockUseShortlist.mockReturnValue({
      isLoaded: true,
      shortlist: ["prop-1"],
      remove: mockRemove,
    });

    mockGetShortlistProperties.mockResolvedValue([
      { id: "prop-1", titleEn: "House 1" },
    ]);

    const { getByTestId, findByTestId } = render(<ShortlistPageClient />);

    const removeBtn = await findByTestId("remove-prop-1");
    fireEvent.click(removeBtn);

    expect(mockRemove).toHaveBeenCalledWith("prop-1");
  });

  it("[P1] renders CTAs askAgentCta and shareShortlistCta when shortlist has items (AC #5)", async () => {
    mockUseShortlist.mockReturnValue({
      isLoaded: true,
      shortlist: ["prop-1"],
      remove: vi.fn(),
    });

    mockGetShortlistProperties.mockResolvedValue([
      { id: "prop-1", titleEn: "House 1" },
    ]);

    const { findByText } = render(<ShortlistPageClient />);

    expect(await findByText("Ask about these")).toBeTruthy();
    expect(await findByText("Share my shortlist")).toBeTruthy();
  });
});
