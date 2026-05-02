/**
 * Story 3.7: Unit Conversion & Price Display
 * Component: src/components/layout/unit-toggle.tsx
 *
 * TDD RED PHASE — all tests use it() and will FAIL until
 * src/components/layout/unit-toggle.tsx is implemented.
 *
 * Covers:
 *   AC #3  — Unit toggle switches between m²/acres and ft²/acres (FR9)
 *   AC #4  — Unit preference persists in localStorage across sessions (AR10)
 *
 * Environment: jsdom (React component — .spec.tsx → jsdom via environmentMatchGlobs)
 *
 * Component interface expected:
 *   interface UnitToggleProps {
 *     locale: string;
 *     className?: string;
 *   }
 *   export function UnitToggle(props: UnitToggleProps): JSX.Element
 *
 * Architecture notes:
 *   - UnitToggle is a Client Component ('use client') — uses localStorage + React state
 *   - Uses useLocaleUnits hook internally
 *   - data-testid="unit-toggle" on root button element
 *   - role="switch" with aria-checked attribute
 */

import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";
import { render, cleanup, fireEvent } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Module mocks — declared BEFORE any imports of the module under test
// ---------------------------------------------------------------------------

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(() => (key: string) => key),
}));

// Default mock: metric unit system
vi.mock("@/hooks/use-locale-units", () => ({
  useLocaleUnits: vi.fn(() => ({
    unitSystem: "metric" as const,
    toggleUnits: vi.fn(),
    convertArea: vi.fn((m2: number) => `${m2} m²`),
  })),
}));

// ---------------------------------------------------------------------------
// Component under test — imported AFTER mocks
// ---------------------------------------------------------------------------

// THIS IMPORT WILL FAIL — src/components/layout/unit-toggle.tsx does not yet exist
import { UnitToggle } from "@/components/layout/unit-toggle";

// Import mock reference to allow overriding in individual tests
import { useLocaleUnits } from "@/hooks/use-locale-units";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const mockToggleUnits = vi.fn();

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

beforeEach(() => {
  localStorage.clear();
  // Reset to metric default
  vi.mocked(useLocaleUnits).mockReturnValue({
    unitSystem: "metric",
    toggleUnits: mockToggleUnits,
    convertArea: vi.fn((m2: number) => `${m2} m²`),
  });
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("UnitToggle — AC #3: toggle between m² and ft²", () => {
  // -------------------------------------------------------------------------
  // Render presence
  // -------------------------------------------------------------------------

  it(
    "[P0] renders data-testid='unit-toggle' button",
    () => {
      // THIS TEST WILL FAIL — unit-toggle.tsx not yet implemented
      render(<UnitToggle locale="en" />);

      const toggle = document.querySelector('[data-testid="unit-toggle"]');
      expect(toggle).not.toBeNull();
    },
  );

  // -------------------------------------------------------------------------
  // AC #3: Unit display labels
  // -------------------------------------------------------------------------

  it(
    "[P0] shows 'm²' when unitSystem is 'metric'",
    () => {
      // THIS TEST WILL FAIL — unit-toggle.tsx not yet implemented
      vi.mocked(useLocaleUnits).mockReturnValue({
        unitSystem: "metric",
        toggleUnits: mockToggleUnits,
        convertArea: vi.fn(),
      });

      render(<UnitToggle locale="en" />);

      const toggle = document.querySelector('[data-testid="unit-toggle"]');
      expect(toggle?.textContent).toContain("m²");
    },
  );

  it(
    "[P0] shows 'ft²' when unitSystem is 'imperial'",
    () => {
      // THIS TEST WILL FAIL — unit-toggle.tsx not yet implemented
      vi.mocked(useLocaleUnits).mockReturnValue({
        unitSystem: "imperial",
        toggleUnits: mockToggleUnits,
        convertArea: vi.fn(),
      });

      render(<UnitToggle locale="en" />);

      const toggle = document.querySelector('[data-testid="unit-toggle"]');
      expect(toggle?.textContent).toContain("ft²");
    },
  );

  // -------------------------------------------------------------------------
  // AC #3: Toggle interaction
  // -------------------------------------------------------------------------

  it(
    "[P0] clicking the toggle calls toggleUnits",
    () => {
      // THIS TEST WILL FAIL — unit-toggle.tsx not yet implemented
      render(<UnitToggle locale="en" />);

      const toggle = document.querySelector(
        '[data-testid="unit-toggle"]',
      ) as HTMLElement;
      expect(toggle).not.toBeNull();

      fireEvent.click(toggle);

      expect(mockToggleUnits).toHaveBeenCalledTimes(1);
    },
  );

  // -------------------------------------------------------------------------
  // Accessibility — ARIA
  // -------------------------------------------------------------------------

  it(
    "[P0] has role='switch' on the toggle button",
    () => {
      // THIS TEST WILL FAIL — unit-toggle.tsx not yet implemented
      render(<UnitToggle locale="en" />);

      const toggle = document.querySelector('[data-testid="unit-toggle"]');
      expect(toggle?.getAttribute("role")).toBe("switch");
    },
  );

  it(
    "[P0] has aria-checked='true' when unitSystem is 'metric'",
    () => {
      // THIS TEST WILL FAIL — unit-toggle.tsx not yet implemented
      vi.mocked(useLocaleUnits).mockReturnValue({
        unitSystem: "metric",
        toggleUnits: mockToggleUnits,
        convertArea: vi.fn(),
      });

      render(<UnitToggle locale="en" />);

      const toggle = document.querySelector('[data-testid="unit-toggle"]');
      expect(toggle?.getAttribute("aria-checked")).toBe("true");
    },
  );

  it(
    "[P0] has aria-checked='false' when unitSystem is 'imperial'",
    () => {
      // THIS TEST WILL FAIL — unit-toggle.tsx not yet implemented
      vi.mocked(useLocaleUnits).mockReturnValue({
        unitSystem: "imperial",
        toggleUnits: mockToggleUnits,
        convertArea: vi.fn(),
      });

      render(<UnitToggle locale="en" />);

      const toggle = document.querySelector('[data-testid="unit-toggle"]');
      expect(toggle?.getAttribute("aria-checked")).toBe("false");
    },
  );

  it(
    "[P1] has aria-label attribute set (accessible labeling)",
    () => {
      // THIS TEST WILL FAIL — unit-toggle.tsx not yet implemented
      render(<UnitToggle locale="en" />);

      const toggle = document.querySelector('[data-testid="unit-toggle"]');
      const ariaLabel = toggle?.getAttribute("aria-label");
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel?.length).toBeGreaterThan(0);
    },
  );

  // -------------------------------------------------------------------------
  // Architecture compliance
  // -------------------------------------------------------------------------

  it(
    "[P1] UnitToggle file starts with 'use client' (Client Component requirement)",
    async () => {
      // THIS TEST WILL FAIL — unit-toggle.tsx not yet implemented
      const fs = await import("node:fs");
      const path = await import("node:path");

      const filePath = path.resolve(
        process.cwd(),
        "src/components/layout/unit-toggle.tsx",
      );
      expect(fs.existsSync(filePath)).toBe(true);

      const src = fs.readFileSync(filePath, "utf8");
      // Client Component — MUST start with 'use client'
      expect(src.trimStart()).toMatch(/^['"]use client['"]/);
    },
  );

  // -------------------------------------------------------------------------
  // AC #4: localStorage persistence (via useLocaleUnits hook)
  // -------------------------------------------------------------------------

  it(
    "[P1] calls useLocaleUnits with the provided locale prop",
    () => {
      // THIS TEST WILL FAIL — unit-toggle.tsx not yet implemented
      render(<UnitToggle locale="es" />);

      expect(useLocaleUnits).toHaveBeenCalledWith("es");
    },
  );

  it(
    "[P1] accepts optional className prop",
    () => {
      // THIS TEST WILL FAIL — unit-toggle.tsx not yet implemented
      render(<UnitToggle locale="en" className="custom-class" />);

      // The component should render without errors
      const toggle = document.querySelector('[data-testid="unit-toggle"]');
      expect(toggle).not.toBeNull();
    },
  );
});
