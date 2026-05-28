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
      "Shortlist.whatsAppMessageHeader": "Hello, I'm interested in these properties from my shortlist:",
      "Shortlist.shareMessageHeader": "Check out my property shortlist:",
    };
    return translations[key] || key;
  }),
  useLocale: () => "en",
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  MapView: ({ properties }: any) => (
    <div data-testid="map-view">Map with {properties ? properties.length : 0} pins</div>
  ),
}));

vi.mock("@/components/property/property-card", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

describe("ShortlistPageClient — Story 7.2 ATDD (GREEN PHASE)", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("[P0] 7.2-UNIT-004: renders skeletons during loading state (AC #8)", () => {
    mockUseShortlist.mockReturnValue({
      isLoaded: false,
      shortlist: [],
      remove: vi.fn(),
    });

    const { getAllByTestId } = render(<ShortlistPageClient />);
    expect(getAllByTestId("property-card-skeleton").length).toBeGreaterThanOrEqual(3);
  });

  it("[P0] 7.2-UNIT-005: renders empty state elements when no properties are saved (AC #3)", () => {
    mockUseShortlist.mockReturnValue({
      isLoaded: true,
      shortlist: [],
      remove: vi.fn(),
    });

    const { getByText } = render(<ShortlistPageClient />);
    expect(getByText("No properties saved yet. Browse listings and tap ♡ to save.")).toBeTruthy();
  });

  it("[P0] 7.2-UNIT-006: renders saved list items and passes them to map when shortlist has items (AC #1, #2)", async () => {
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

  it("[P0] 7.2-UNIT-007: removal trigger executes expected handlers (AC #4)", async () => {
    const mockRemove = vi.fn();
    mockUseShortlist.mockReturnValue({
      isLoaded: true,
      shortlist: ["prop-1"],
      remove: mockRemove,
    });

    mockGetShortlistProperties.mockResolvedValue([
      { id: "prop-1", titleEn: "House 1" },
    ]);

    const { findByTestId } = render(<ShortlistPageClient />);

    const removeBtn = await findByTestId("remove-prop-1");
    fireEvent.click(removeBtn);

    expect(mockRemove).toHaveBeenCalledWith("prop-1");
  });

  it("[P1] 7.2-UNIT-008: renders CTAs askAgentCta and shareShortlistCta when shortlist has items (AC #5)", async () => {
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

  it("[P0] 7.2-UNIT-009: filters out properties with null coordinates before passing them to MapView", async () => {
    mockUseShortlist.mockReturnValue({
      isLoaded: true,
      shortlist: ["prop-1", "prop-2"],
      remove: vi.fn(),
    });

    mockGetShortlistProperties.mockResolvedValue([
      { id: "prop-1", titleEn: "House with coordinates", latitude: 9.35, longitude: -83.7 },
      { id: "prop-2", titleEn: "House without coordinates", latitude: null, longitude: null },
    ]);

    const { getByTestId, findByTestId } = render(<ShortlistPageClient />);

    await findByTestId("property-card-prop-1");
    expect(getByTestId("property-card-prop-2")).toBeTruthy();

    const mapView = getByTestId("map-view");
    // Only 1 pin (prop-1) should be passed to MapView because prop-2 has null coordinates
    expect(mapView.textContent).toContain("Map with 1 pins");
  });

  it("[P1] 7.2-UNIT-010: triggers window.open with localized message for WhatsApp and clipboard copy for sharing", async () => {
    mockUseShortlist.mockReturnValue({
      isLoaded: true,
      shortlist: ["prop-1"],
      remove: vi.fn(),
    });

    mockGetShortlistProperties.mockResolvedValue([
      { id: "prop-1", titleEn: "House 1", slug: "house-1", latitude: 9.35, longitude: -83.7 },
    ]);

    const { findByText } = render(<ShortlistPageClient />);

    const askBtn = await findByText("Ask about these");
    const shareBtn = await findByText("Share my shortlist");

    // Spy on window.open
    const spyOpen = vi.spyOn(window, "open").mockImplementation(() => null);

    // Spy on navigator.clipboard.writeText
    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: mockWriteText,
      },
      writable: true,
      configurable: true,
    });

    // Click Ask Agent
    fireEvent.click(askBtn);
    expect(spyOpen).toHaveBeenCalledOnce();
    const whatsappCallUrl = spyOpen.mock.calls[0][0];
    expect(whatsappCallUrl).toContain("wa.me/50688888888");
    expect(whatsappCallUrl).toContain(encodeURIComponent("Hello, I'm interested in these properties from my shortlist:\n- House 1 (prop-1)"));

    // Click Share my shortlist
    fireEvent.click(shareBtn);
    expect(mockWriteText).toHaveBeenCalledOnce();
    const shareText = mockWriteText.mock.calls[0][0];
    expect(shareText).toContain("Check out my property shortlist:\n");
    expect(shareText).toContain("/property/house-1");

    spyOpen.mockRestore();
  });
});
