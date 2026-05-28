/**
 * Story 7.3: Shareable Shortlist URL — Component Unit Tests
 * Component: src/components/shortlist/shared-shortlist-page-client.tsx
 *
 * Covers:
 *   - AC #2: Renders a read-only list of properties and passes them to MapView.
 *   - AC #4: Displays a friendly expiration message when marked as expired.
 *   - AC #5: Ensures properties display correctly irrespective of viewing user's localStorage.
 *   - Hydration & bundle rules: uses lazy-loaded MapView.
 *
 * Environment: jsdom (React component — .spec.tsx → jsdom via environmentMatchGlobs)
 * Marked with describe.skip for the TDD RED phase.
 */

import { describe, expect, it, vi, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import React from "react";
import type { PropertySearchItem } from "@/types/search";

// ---------------------------------------------------------------------------
// Module mocks — declared BEFORE any imports of the module under test
// ---------------------------------------------------------------------------

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(() => (key: string) => {
    const translations: Record<string, string> = {
      "title": "Shared Shortlist",
      "expiredTitle": "Shared Shortlist Expired",
      "expiredMessage": "This shortlist has expired. Start a new search.",
      "sharedBanner": "Viewing a shared shortlist. Start saving properties to create your own!",
      "browseCta": "Browse Listings",
      "Shortlist.title": "Shared Shortlist",
      "Shortlist.expiredTitle": "Shared Shortlist Expired",
      "Shortlist.expiredMessage": "This shortlist has expired. Start a new search.",
      "Shortlist.sharedBanner": "Viewing a shared shortlist. Start saving properties to create your own!",
      "Shortlist.browseCta": "Browse Listings",
    };
    return translations[key] || key;
  }),
  useLocale: () => "en",
}));

vi.mock("@/components/map/map-view-loader", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  MapView: ({ properties }: any) => (
    <div data-testid="map-view">Map with {properties ? properties.length : 0} pins</div>
  ),
}));

vi.mock("@/components/property/property-card", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  PropertyCard: ({ property, readOnly }: any) => (
    <div data-testid={`property-card-${property.id}`}>
      <h3>{property.titleEn}</h3>
      {readOnly && <span data-testid="readonly-badge">Read Only</span>}
    </div>
  ),
}));

// ---------------------------------------------------------------------------
// Component under test — imported AFTER mocks
// ---------------------------------------------------------------------------
import { SharedShortlistPageClient } from "@/components/shortlist/shared-shortlist-page-client";

describe("SharedShortlistPageClient — Story 7.3 ATDD", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("[P0] 7.3-UNIT-005: should render the expired state message when isExpired is true (AC #4)", () => {
    const { getByText, queryByTestId } = render(
      <SharedShortlistPageClient properties={[]} isExpired={true} />
    );

    expect(getByText("This shortlist has expired. Start a new search.")).toBeTruthy();
    expect(getByText("Browse Listings")).toBeTruthy();
    expect(queryByTestId("map-view")).toBeNull();
  });

  it("[P0] 7.3-UNIT-006: should render properties in read-only mode and sync coordinates to MapView (AC #2)", () => {
    const mockProperties = [
      { id: "prop-1", titleEn: "House 1", latitude: 9.35, longitude: -83.7 },
      { id: "prop-2", titleEn: "House 2", latitude: 9.36, longitude: -83.8 },
    ] as unknown as PropertySearchItem[];

    const { getByTestId, getAllByTestId, getByText } = render(
      <SharedShortlistPageClient properties={mockProperties} isExpired={false} />
    );

    // Verify properties are rendered
    expect(getByTestId("property-card-prop-1")).toBeTruthy();
    expect(getByTestId("property-card-prop-2")).toBeTruthy();

    // Verify they are read-only cards (no delete ✕ button)
    const readOnlyBadges = getAllByTestId("readonly-badge");
    expect(readOnlyBadges.length).toBe(2);

    // Verify information banner is shown
    expect(
      getByText("Viewing a shared shortlist. Start saving properties to create your own!")
    ).toBeTruthy();

    // Verify MapView gets two property pins
    const mapView = getByTestId("map-view");
    expect(mapView.textContent).toContain("Map with 2 pins");
  });

  it("[P1] 7.3-UNIT-007: should filter out properties with missing geo-coordinates from the map pins", () => {
    const mockProperties = [
      { id: "prop-1", titleEn: "Villa", latitude: 9.35, longitude: -83.7 },
      { id: "prop-2", titleEn: "Land", latitude: null, longitude: null },
    ] as unknown as PropertySearchItem[];

    const { getByTestId } = render(
      <SharedShortlistPageClient properties={mockProperties} isExpired={false} />
    );

    const mapView = getByTestId("map-view");
    // Only 1 pin has complete coordinates
    expect(mapView.textContent).toContain("Map with 1 pins");
  });
});
