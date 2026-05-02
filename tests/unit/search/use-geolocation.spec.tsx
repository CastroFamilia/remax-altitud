/**
 * Story 3.8: No-Results, Hidden Listings & Near Me
 * Hook: src/hooks/use-geolocation.ts
 *
 * TDD RED PHASE — all tests use it() and will FAIL until
 * src/hooks/use-geolocation.ts is created.
 *
 * Covers:
 *   AC #4  — Near Me button invokes browser Geolocation API
 *   AC #5  — On success, map flies to user location with radius overlay
 *   AC #6  — On denied, map centers on nearest RE/MAX office + message
 *   R-007  — errorCallback MUST be provided to prevent unhandled rejection
 *
 * Test IDs from test-design-epic-3.md:
 *   3.8-E2E-001 (unit coverage) — Near Me denied → fallback to RE/MAX office + message
 *   3.8-E2E-004 (unit coverage) — Near Me granted → map flies to user coords
 *
 * Environment: jsdom (React hook with state — .spec.tsx → jsdom via environmentMatchGlobs)
 *
 * Hook interface expected:
 *   export type GeolocationStatus = 'idle' | 'loading' | 'success' | 'denied' | 'error';
 *   export interface GeolocationState {
 *     status: GeolocationStatus;
 *     coords: { lat: number; lng: number } | null;
 *     fallbackCoords: { lat: number; lng: number } | null;
 *     fallbackReason: 'denied' | 'error' | 'unsupported' | null;
 *   }
 *   export function useGeolocation(): GeolocationState & { requestLocation: () => void }
 *
 * Activation instructions for the dev implementing Story 3.8 Task 6:
 *   1. Remove test.skip from the test you are implementing
 *   2. Run: npx vitest run tests/unit/search/use-geolocation.spec.tsx
 *   3. Verify the test FAILS before implementation, then passes after
 *   4. Commit passing tests
 */

import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";
import { renderHook, cleanup, act } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Module mocks — declared BEFORE any imports of the module under test
// ---------------------------------------------------------------------------

vi.mock("@/lib/constants/offices-geo", () => ({
  OFFICE_PZ_COORDS: { lat: 9.3725, lng: -83.7011 },
  OFFICE_DOMINICAL_COORDS: { lat: 9.257, lng: -83.885 },
  getNearestOfficeCoords: vi.fn(() => ({ lat: 9.3725, lng: -83.7011 })),
}));

// ---------------------------------------------------------------------------
// Hook under test — imported AFTER mocks
// ---------------------------------------------------------------------------

// THIS IMPORT WILL FAIL — src/hooks/use-geolocation.ts does not yet exist
import { useGeolocation } from "@/hooks/use-geolocation";

// ---------------------------------------------------------------------------
// Helpers: geolocation stub factories
// ---------------------------------------------------------------------------

function mockGeolocationSuccess(lat: number, lng: number) {
  vi.stubGlobal("navigator", {
    geolocation: {
      getCurrentPosition: vi.fn((success: PositionCallback) =>
        success({
          coords: {
            latitude: lat,
            longitude: lng,
            accuracy: 10,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          // Fixed timestamp for determinism — tests must not assert on this value
          timestamp: 1_700_000_000_000,
        } as GeolocationPosition),
      ),
    },
  });
}

function mockGeolocationDenied() {
  vi.stubGlobal("navigator", {
    geolocation: {
      getCurrentPosition: vi.fn(
        (_success: PositionCallback, error: PositionErrorCallback) =>
          error({
            code: 1, // GeolocationPositionError.PERMISSION_DENIED
            message: "User denied Geolocation",
            PERMISSION_DENIED: 1,
            POSITION_UNAVAILABLE: 2,
            TIMEOUT: 3,
          } as GeolocationPositionError),
      ),
    },
  });
}

function mockGeolocationUnavailable() {
  vi.stubGlobal("navigator", {
    geolocation: {
      getCurrentPosition: vi.fn(
        (_success: PositionCallback, error: PositionErrorCallback) =>
          error({
            code: 2, // GeolocationPositionError.POSITION_UNAVAILABLE
            message: "Position unavailable",
            PERMISSION_DENIED: 1,
            POSITION_UNAVAILABLE: 2,
            TIMEOUT: 3,
          } as GeolocationPositionError),
      ),
    },
  });
}

function mockGeolocationNotSupported() {
  vi.stubGlobal("navigator", {
    geolocation: undefined,
  });
}

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

beforeEach(() => {
  // Default: geolocation is available but not yet called
  vi.stubGlobal("navigator", {
    geolocation: {
      getCurrentPosition: vi.fn(),
    },
  });
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useGeolocation — Story 3.8 ATDD (RED PHASE)", () => {
  // -------------------------------------------------------------------------
  // [P0] Initial state
  // -------------------------------------------------------------------------

  it("[P0] initial state has status='idle', coords=null, fallbackCoords=null", () => {
    // THIS TEST WILL FAIL — hook does not yet exist
    const { result } = renderHook(() => useGeolocation());
    expect(result.current.status).toBe("idle");
    expect(result.current.coords).toBeNull();
    expect(result.current.fallbackCoords).toBeNull();
    expect(result.current.fallbackReason).toBeNull();
  });

  it("[P0] exposes requestLocation function", () => {
    // THIS TEST WILL FAIL — hook does not yet exist
    const { result } = renderHook(() => useGeolocation());
    expect(typeof result.current.requestLocation).toBe("function");
  });

  // -------------------------------------------------------------------------
  // [P0] AC #5: Success path
  // -------------------------------------------------------------------------

  it("[P0] requestLocation with success → status='success', coords match", async () => {
    // THIS TEST WILL FAIL — hook does not yet exist
    mockGeolocationSuccess(9.3725, -83.7011);
    const { result } = renderHook(() => useGeolocation());

    await act(async () => {
      result.current.requestLocation();
    });

    expect(result.current.status).toBe("success");
    expect(result.current.coords?.lat).toBe(9.3725);
    expect(result.current.coords?.lng).toBe(-83.7011);
    expect(result.current.fallbackCoords).toBeNull();
    expect(result.current.fallbackReason).toBeNull();
  });

  // -------------------------------------------------------------------------
  // [P0] AC #6: Permission denied path (R-007)
  // -------------------------------------------------------------------------

  it(
    "[P0] requestLocation with PERMISSION_DENIED → status='denied', fallbackCoords non-null",
    async () => {
      // THIS TEST WILL FAIL — hook does not yet exist
      mockGeolocationDenied();
      const { result } = renderHook(() => useGeolocation());

      await act(async () => {
        result.current.requestLocation();
      });

      expect(result.current.status).toBe("denied");
      expect(result.current.coords).toBeNull();
      expect(result.current.fallbackCoords).not.toBeNull();
      expect(result.current.fallbackCoords?.lat).toBeDefined();
      expect(result.current.fallbackCoords?.lng).toBeDefined();
    },
  );

  it(
    "[P0] requestLocation with PERMISSION_DENIED → fallbackReason='denied'",
    async () => {
      // THIS TEST WILL FAIL — hook does not yet exist
      mockGeolocationDenied();
      const { result } = renderHook(() => useGeolocation());

      await act(async () => {
        result.current.requestLocation();
      });

      expect(result.current.fallbackReason).toBe("denied");
    },
  );

  // -------------------------------------------------------------------------
  // [P0] Error code 2 (POSITION_UNAVAILABLE)
  // -------------------------------------------------------------------------

  it(
    "[P0] requestLocation with POSITION_UNAVAILABLE (code 2) → status='error', fallbackCoords non-null",
    async () => {
      // THIS TEST WILL FAIL — hook does not yet exist
      mockGeolocationUnavailable();
      const { result } = renderHook(() => useGeolocation());

      await act(async () => {
        result.current.requestLocation();
      });

      expect(result.current.status).toBe("error");
      expect(result.current.fallbackCoords).not.toBeNull();
    },
  );

  // -------------------------------------------------------------------------
  // [P1] R-007: navigator.geolocation not supported (guard)
  // -------------------------------------------------------------------------

  it(
    "[P1] when navigator.geolocation is not available → status='error' with fallback coords (R-007)",
    async () => {
      // THIS TEST WILL FAIL — hook does not yet exist
      mockGeolocationNotSupported();
      const { result } = renderHook(() => useGeolocation());

      await act(async () => {
        result.current.requestLocation();
      });

      expect(result.current.status).toBe("error");
      expect(result.current.fallbackCoords).not.toBeNull();
      expect(result.current.fallbackReason).toBe("unsupported");
    },
  );
});
