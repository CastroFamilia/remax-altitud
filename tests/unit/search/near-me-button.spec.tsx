/**
 * Story 3.8: No-Results, Hidden Listings & Near Me
 * Component: src/components/search/near-me-button.tsx
 *
 * TDD RED PHASE — all tests use it() and will FAIL until
 * src/components/search/near-me-button.tsx is created.
 *
 * Covers:
 *   AC #4  — Near Me button invokes browser Geolocation API when clicked
 *   AC #5  — onLocationSuccess callback called when geolocation succeeds
 *   AC #6  — onLocationFallback callback called when geolocation is denied
 *
 * Test IDs from test-design-epic-3.md:
 *   3.8-E2E-001 (unit coverage) — Near Me denied → fallback to REMAX office + message
 *   3.8-E2E-004 (unit coverage) — Near Me granted → map flies to user coords
 *
 * Environment: jsdom (React component — .spec.tsx → jsdom via environmentMatchGlobs)
 *
 * Component interface expected:
 *   interface NearMeButtonProps {
 *     onLocationSuccess: (coords: { lat: number; lng: number }) => void;
 *     onLocationFallback: (coords: { lat: number; lng: number }, message: string) => void;
 *     className?: string;
 *   }
 *   export function NearMeButton(props: NearMeButtonProps): JSX.Element
 *
 * data-testid attributes:
 *   data-testid="near-me-button"  — root button element
 *
 * Activation instructions for the dev implementing Story 3.8 Task 8:
 *   1. Remove test.skip from the test you are implementing
 *   2. Run: npx vitest run tests/unit/search/near-me-button.spec.tsx
 *   3. Verify the test FAILS before implementation, then passes after
 *   4. Commit passing tests
 */

import { describe, expect, it, vi, afterEach } from "vitest";
import { render, cleanup, fireEvent } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Module mocks — declared BEFORE any imports of the module under test
// ---------------------------------------------------------------------------

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(() => (key: string) => key),
}));

const mockRequestLocation = vi.fn();

vi.mock("@/hooks/use-geolocation", () => ({
  useGeolocation: vi.fn(() => ({
    status: "idle" as const,
    coords: null,
    fallbackCoords: null,
    fallbackReason: null,
    requestLocation: mockRequestLocation,
  })),
}));

// Import mock reference for overriding in individual tests
import { useGeolocation } from "@/hooks/use-geolocation";

// ---------------------------------------------------------------------------
// Component under test — imported AFTER mocks
// ---------------------------------------------------------------------------

// THIS IMPORT WILL FAIL — src/components/search/near-me-button.tsx does not yet exist
import { NearMeButton } from "@/components/search/near-me-button";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const noopSuccess = vi.fn();
const noopFallback = vi.fn();

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("NearMeButton — Story 3.8 ATDD (RED PHASE)", () => {
  // -------------------------------------------------------------------------
  // [P0] Rendering
  // -------------------------------------------------------------------------

  it("[P0] renders data-testid='near-me-button' element", () => {
    // THIS TEST WILL FAIL — NearMeButton does not yet exist
    const { getByTestId } = render(
      <NearMeButton
        onLocationSuccess={noopSuccess}
        onLocationFallback={noopFallback}
      />,
    );
    expect(getByTestId("near-me-button")).toBeTruthy();
  });

  it("[P0] button is enabled when status is 'idle'", () => {
    // THIS TEST WILL FAIL — NearMeButton does not yet exist
    vi.mocked(useGeolocation).mockReturnValue({
      status: "idle",
      coords: null,
      fallbackCoords: null,
      fallbackReason: null,
      requestLocation: mockRequestLocation,
    });
    const { getByTestId } = render(
      <NearMeButton
        onLocationSuccess={noopSuccess}
        onLocationFallback={noopFallback}
      />,
    );
    const btn = getByTestId("near-me-button") as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
  });

  it("[P0] button is disabled when status is 'loading'", () => {
    // THIS TEST WILL FAIL — NearMeButton does not yet exist
    vi.mocked(useGeolocation).mockReturnValue({
      status: "loading",
      coords: null,
      fallbackCoords: null,
      fallbackReason: null,
      requestLocation: mockRequestLocation,
    });
    const { getByTestId } = render(
      <NearMeButton
        onLocationSuccess={noopSuccess}
        onLocationFallback={noopFallback}
      />,
    );
    const btn = getByTestId("near-me-button") as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  // -------------------------------------------------------------------------
  // [P0] AC #4: click triggers requestLocation
  // -------------------------------------------------------------------------

  it("[P0] clicking button calls requestLocation", () => {
    // THIS TEST WILL FAIL — NearMeButton does not yet exist
    vi.mocked(useGeolocation).mockReturnValue({
      status: "idle",
      coords: null,
      fallbackCoords: null,
      fallbackReason: null,
      requestLocation: mockRequestLocation,
    });
    const { getByTestId } = render(
      <NearMeButton
        onLocationSuccess={noopSuccess}
        onLocationFallback={noopFallback}
      />,
    );
    fireEvent.click(getByTestId("near-me-button"));
    expect(mockRequestLocation).toHaveBeenCalledTimes(1);
  });

  // -------------------------------------------------------------------------
  // [P0] AC #5: onLocationSuccess called when status transitions to 'success'
  // -------------------------------------------------------------------------

  it(
    "[P0] onLocationSuccess is called when status transitions to 'success' with coords",
    () => {
      // THIS TEST WILL FAIL — NearMeButton does not yet exist
      const onSuccess = vi.fn();
      const successCoords = { lat: 9.3725, lng: -83.7011 };

      vi.mocked(useGeolocation).mockReturnValue({
        status: "success",
        coords: successCoords,
        fallbackCoords: null,
        fallbackReason: null,
        requestLocation: mockRequestLocation,
      });

      render(
        <NearMeButton
          onLocationSuccess={onSuccess}
          onLocationFallback={noopFallback}
        />,
      );

      // The useEffect watching status should have called onSuccess
      expect(onSuccess).toHaveBeenCalledWith(successCoords);
    },
  );

  // -------------------------------------------------------------------------
  // [P0] AC #6: onLocationFallback called when status transitions to 'denied'
  // -------------------------------------------------------------------------

  it(
    "[P0] onLocationFallback is called when status transitions to 'denied' with fallbackCoords",
    () => {
      // THIS TEST WILL FAIL — NearMeButton does not yet exist
      const onFallback = vi.fn();
      const fallbackCoords = { lat: 9.3725, lng: -83.7011 };

      vi.mocked(useGeolocation).mockReturnValue({
        status: "denied",
        coords: null,
        fallbackCoords: fallbackCoords,
        fallbackReason: "denied",
        requestLocation: mockRequestLocation,
      });

      render(
        <NearMeButton
          onLocationSuccess={noopSuccess}
          onLocationFallback={onFallback}
        />,
      );

      // The useEffect watching status should have called onFallback with a
      // localized message — the next-intl mock returns the key verbatim, so
      // we assert on the i18n key for the denied reason.
      expect(onFallback).toHaveBeenCalledWith(fallbackCoords, "fallbackDenied");
    },
  );
});
