/**
 * Story 3.2: Interactive Map with Property Pins
 * Component: src/components/map/map-view.tsx
 *
 * TDD RED PHASE — all tests use it.skip() and will FAIL until MapView is implemented.
 *
 * Covers:
 *   AC #1  — Mapbox GL JS loads with 3D terrain (map container renders with data-testid)
 *   AC #2  — Property pins appear at lat/lon coordinates (Marker rendered per property)
 *   AC #4  — Pin click → preview card overlay with photo, price, title, specs, ZMT, CTA
 *   AC #9  — data-testid="map-container" present on the MapView wrapper element
 *
 * Mock strategy (MANDATORY — established in Story 3.1):
 *   vi.mock('react-map-gl') declared BEFORE any component import.
 *   Mapbox GL JS uses canvas/WebGL — incompatible with jsdom.
 *   The mock stubs Map, Marker, and Popup so component logic can be exercised.
 *
 * NOTE: AC #3 (clustering), AC #5 (bounds→grid sync), AC #6 (lazy chunk),
 *       AC #7 (4G perf), are covered in E2E and build-level scaffolds below.
 */

import { describe, expect, it, vi, afterEach } from "vitest";
import { render, cleanup, fireEvent, screen } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Module mocks — declared BEFORE any component imports (hoisting pattern)
// ---------------------------------------------------------------------------

// react-map-gl uses canvas/WebGL — must be mocked for jsdom.
// The Map mock calls onLoad so terrain-source setup code runs,
// renders children so Marker/Popup children are exercised.
vi.mock("react-map-gl", () => ({
  Map: ({ children, onLoad, "aria-label": ariaLabel }: any) => {
    // Simulate onLoad firing synchronously so terrain-source code path runs
    onLoad?.({
      target: {
        addSource: vi.fn(),
        getBounds: () => ({
          getNorth: () => 11,
          getSouth: () => 7,
          getEast: () => -81,
          getWest: () => -86,
        }),
      },
    });
    return (
      <div data-testid="map-container" aria-label={ariaLabel}>
        {children}
      </div>
    );
  },
  Marker: ({ children, longitude, latitude }: any) => (
    <div
      data-testid="map-marker"
      data-lng={longitude}
      data-lat={latitude}
    >
      {children}
    </div>
  ),
  Popup: ({ children, longitude, latitude }: any) => (
    <div
      data-testid="map-property-popup"
      data-lng={longitude}
      data-lat={latitude}
    >
      {children}
    </div>
  ),
}));

// Mapbox CSS import — no-op in jsdom
vi.mock("mapbox-gl/dist/mapbox-gl.css", () => ({}));

// Mock the Zustand map store
vi.mock("@/store/map-store", () => ({
  useMapStore: vi.fn(() => ({
    center: { lng: -83.7, lat: 9.38 },
    zoom: 10,
    bounds: null,
    setCenter: vi.fn(),
    setZoom: vi.fn(),
    setBounds: vi.fn(),
  })),
}));

// Mock config module
vi.mock("@/lib/map/config", () => ({
  MAPBOX_TOKEN: "pk.test-token",
  MAP_STYLE: "mapbox://styles/mapbox/outdoors-v12",
  DEFAULT_MAP_CENTER: { lng: -83.7, lat: 9.38 },
  DEFAULT_MAP_ZOOM: 10,
  MAX_BOUNDS: [
    [-86.0, 7.5],
    [-81.5, 11.5],
  ],
}));

// Mock geo-utils
vi.mock("@/lib/map/geo-utils", () => ({
  boundsFromMapboxEvent: vi.fn(() => ({
    north: 11,
    south: 7,
    east: -81,
    west: -86,
  })),
  formatPriceAbbrev: vi.fn((price: number) => {
    if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(1)}M`;
    if (price >= 1_000) return `$${Math.round(price / 1_000)}K`;
    return `$${price}`;
  }),
}));

// Mock next/navigation (useParams for locale)
vi.mock("next/navigation", () => ({
  useParams: vi.fn(() => ({ locale: "en" })),
  useRouter: vi.fn(() => ({ replace: vi.fn() })),
}));

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: vi.fn(() => (key: string) => key),
}));

// Mock MapPropertyPopup to isolate MapView
vi.mock("@/components/map/map-property-popup", () => ({
  MapPropertyPopup: ({ property, onClose }: any) => (
    <div data-testid="map-property-popup-card" data-property-id={property.id}>
      <span>{property.titleEn}</span>
      <button onClick={onClose} data-testid="map-popup-close">
        Close
      </button>
    </div>
  ),
}));

// Mock MapPricePin
vi.mock("@/components/map/map-price-pin", () => ({
  MapPricePin: ({ price, isSelected, onClick }: any) => (
    <button
      data-testid="map-price-pin"
      data-price={price}
      data-selected={isSelected}
      onClick={onClick}
    >
      ${price}
    </button>
  ),
}));

// Mock MapClusterPin
vi.mock("@/components/map/map-cluster-pin", () => ({
  MapClusterPin: ({ count, onClick }: any) => (
    <button data-testid="map-cluster-pin" data-count={count} onClick={onClick}>
      {count}
    </button>
  ),
}));

// ---------------------------------------------------------------------------
// Component under test — imported AFTER mocks
// ---------------------------------------------------------------------------

import { MapView } from "@/components/map/map-view"; // imported AFTER mocks

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const makeProperty = (overrides: Partial<ReturnType<typeof makeProperty>> = {}) => ({
  id: "prop-1",
  slug: "beautiful-farm-perez-zeledon",
  titleEn: "Beautiful Farm in Pérez Zeledón",
  titleEs: "Hermosa Finca en Pérez Zeledón",
  priceUsd: 250_000,
  bedrooms: 3,
  bathrooms: 2,
  lotSizeM2: 5000,
  zmtStatus: "titled",
  images: [{ url: "https://example.com/img.jpg", alt: "Farm view" }],
  latitude: 9.38,
  longitude: -83.7,
  ...overrides,
});

const noop = () => {};

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("MapView", () => {
  // -------------------------------------------------------------------------
  // AC #9: data-testid="map-container" present on wrapper (REPLACES map-placeholder)
  // AC #1: Map container renders (Mapbox GL loads)
  // -------------------------------------------------------------------------

  it.skip(
    "[P0] renders map wrapper with data-testid='map-container' (AC #9, AC #1)",
    () => {
      // THIS TEST WILL FAIL — MapView component not yet implemented
      render(<MapView properties={[]} locale="en" onBoundsChange={noop} />);

      const container = document.querySelector('[data-testid="map-container"]');
      expect(container).not.toBeNull();
    },
  );

  it.skip(
    "[P0] map container has aria-label='Property locations map' for accessibility (AC #1)",
    () => {
      // THIS TEST WILL FAIL — MapView component not yet implemented
      render(<MapView properties={[]} locale="en" onBoundsChange={noop} />);

      const container = document.querySelector('[data-testid="map-container"]');
      expect(container?.getAttribute("aria-label")).toBe("Property locations map");
    },
  );

  // -------------------------------------------------------------------------
  // AC #2: Property pins appear at lat/lon coordinates
  // -------------------------------------------------------------------------

  it.skip(
    "[P0] renders no markers when properties array is empty (AC #2 — no crash)",
    () => {
      // THIS TEST WILL FAIL — MapView component not yet implemented
      render(<MapView properties={[]} locale="en" onBoundsChange={noop} />);

      // No price pins or cluster pins should exist
      const pins = document.querySelectorAll('[data-testid="map-price-pin"]');
      const clusters = document.querySelectorAll('[data-testid="map-cluster-pin"]');
      expect(pins).toHaveLength(0);
      expect(clusters).toHaveLength(0);
    },
  );

  it.skip(
    "[P0] renders one MapPricePin Marker when a single property is passed (AC #2)",
    () => {
      // THIS TEST WILL FAIL — MapView component not yet implemented
      const property = makeProperty();
      render(<MapView properties={[property]} locale="en" onBoundsChange={noop} />);

      // Should render exactly one price pin marker (no clustering at zoom=10 with 1 property)
      const pins = document.querySelectorAll('[data-testid="map-price-pin"]');
      expect(pins.length).toBeGreaterThanOrEqual(1);
    },
  );

  it.skip(
    "[P0] each rendered Marker is positioned at the property's lat/lon coordinates (AC #2)",
    () => {
      // THIS TEST WILL FAIL — MapView component not yet implemented
      const property = makeProperty({ latitude: 9.5, longitude: -83.9 });
      render(<MapView properties={[property]} locale="en" onBoundsChange={noop} />);

      // The mocked Marker exposes data-lat and data-lng attributes
      const marker = document.querySelector('[data-testid="map-marker"]');
      expect(marker).not.toBeNull();
      expect(marker?.getAttribute("data-lat")).toBe("9.5");
      expect(marker?.getAttribute("data-lng")).toBe("-83.9");
    },
  );

  // -------------------------------------------------------------------------
  // AC #4: Pin click → preview card overlay (popup)
  // -------------------------------------------------------------------------

  it.skip(
    "[P1] clicking a price pin renders MapPropertyPopup with the property's title (AC #4)",
    () => {
      // THIS TEST WILL FAIL — MapView component not yet implemented
      const property = makeProperty({
        id: "prop-42",
        titleEn: "Ocean View Lot in Uvita",
      });
      render(<MapView properties={[property]} locale="en" onBoundsChange={noop} />);

      // Click the price pin for the property
      const pin = document.querySelector('[data-testid="map-price-pin"]');
      expect(pin).not.toBeNull();
      fireEvent.click(pin!);

      // Popup card should appear with the property's title
      const popupCard = document.querySelector('[data-testid="map-property-popup-card"]');
      expect(popupCard).not.toBeNull();
      expect(popupCard?.getAttribute("data-property-id")).toBe("prop-42");
      expect(popupCard?.textContent).toContain("Ocean View Lot in Uvita");
    },
  );

  it.skip(
    "[P1] popup is not rendered before any pin is clicked (AC #4 — default state)",
    () => {
      // THIS TEST WILL FAIL — MapView component not yet implemented
      const property = makeProperty();
      render(<MapView properties={[property]} locale="en" onBoundsChange={noop} />);

      const popupCard = document.querySelector('[data-testid="map-property-popup-card"]');
      expect(popupCard).toBeNull();
    },
  );

  it.skip(
    "[P1] clicking the popup close button hides the popup (AC #4)",
    () => {
      // THIS TEST WILL FAIL — MapView component not yet implemented
      const property = makeProperty();
      render(<MapView properties={[property]} locale="en" onBoundsChange={noop} />);

      // Open popup
      const pin = document.querySelector('[data-testid="map-price-pin"]');
      fireEvent.click(pin!);

      // Close via close button
      const closeButton = document.querySelector('[data-testid="map-popup-close"]');
      expect(closeButton).not.toBeNull();
      fireEvent.click(closeButton!);

      // Popup should be gone
      const popupCard = document.querySelector('[data-testid="map-property-popup-card"]');
      expect(popupCard).toBeNull();
    },
  );

  // -------------------------------------------------------------------------
  // AC #8: Zustand store is used for map state (center + zoom)
  // -------------------------------------------------------------------------

  it.skip(
    "[P1] MapView reads initial center and zoom from the Zustand map store (AC #8)",
    async () => {
      // THIS TEST WILL FAIL — MapView component not yet implemented
      const { useMapStore } = await import("@/store/map-store");
      render(<MapView properties={[]} locale="en" onBoundsChange={noop} />);

      // The Zustand store hook must have been called (component subscribes to map state)
      expect(useMapStore).toHaveBeenCalled();
    },
  );

  it.skip(
    "[P1] onBoundsChange callback fires when map moves (AC #5 integration — AC #8)",
    () => {
      // THIS TEST WILL FAIL — MapView component not yet implemented
      const onBoundsChange = vi.fn();
      render(
        <MapView properties={[]} locale="en" onBoundsChange={onBoundsChange} />,
      );

      // The mocked Map's onLoad triggers; mapbox mock includes getBounds stub.
      // onBoundsChange should be called with extracted bounds.
      // (Actual onMove is triggered by user interaction — this tests the onLoad path)
      expect(onBoundsChange).toHaveBeenCalledWith(
        expect.objectContaining({
          north: expect.any(Number),
          south: expect.any(Number),
          east: expect.any(Number),
          west: expect.any(Number),
        }),
      );
    },
  );
});

// ---------------------------------------------------------------------------
// AC #6: Lazy-loaded chunk verification (Build-level — verified via next build)
// ---------------------------------------------------------------------------

describe("MapView — bundle lazy-load contract (AC #6)", () => {
  it.skip(
    "[P1] MapViewLoader uses next/dynamic with ssr:false so Mapbox is not in main bundle (AC #6, AR25)",
    async () => {
      // THIS TEST WILL FAIL — MapViewLoader not yet implemented
      // Strategy: read the source file and assert it uses dynamic() with ssr:false
      // This is a static assertion test (no rendering required).
      const fs = await import("node:fs");
      const path = await import("node:path");

      const loaderPath = path.resolve(
        process.cwd(),
        "src/components/map/map-view-loader.tsx",
      );

      expect(fs.existsSync(loaderPath)).toBe(true);

      const content = fs.readFileSync(loaderPath, "utf8");

      // Must use next/dynamic
      expect(content).toContain("next/dynamic");
      // Must disable SSR
      expect(content).toContain("ssr: false");
      // Must NOT directly import map-view (only via dynamic)
      expect(content).not.toContain("import MapView from");
    },
  );
});
