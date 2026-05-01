/**
 * Story 3.4: Lifestyle Tags & Smart Presets
 * Component: src/components/search/smart-preset-bar.tsx
 *
 * TDD RED PHASE — all tests use it() and will FAIL until
 * smart-preset-bar.tsx is implemented.
 *
 * Covers:
 *   AC #4 — Smart presets combine pre-configured filter + lifestyle tag combos
 *   AC #5 — Clicking a preset applies region/type/lifestyle_tag and navigates to search URL
 *   AC #7 — Presets configurable without code changes (constants file)
 *
 * Environment: jsdom (React component — .spec.tsx → jsdom via vitest.config.mts)
 *
 * Component interface:
 *   interface SmartPresetBarProps {
 *     presets?: SearchPreset[];  // defaults to SEARCH_PRESETS from constants
 *   }
 *
 * data-testid contracts (MUST NOT change):
 *   - data-testid="smart-preset-bar"        on root container
 *   - data-testid={`preset-${preset.id}`}   on each preset button
 *
 * AC #5 detail: "Mountain Retirement Homes" applies:
 *   areaSlug=perez-zeledon, type=Casa, tags=Retire
 *   → URL: /en/search?area=perez-zeledon&type=Casa&tags=Retire
 */

import { describe, expect, it, vi, afterEach } from "vitest";
import { render, cleanup, fireEvent } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Module mocks — declared BEFORE any imports of the module under test
// ---------------------------------------------------------------------------

const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ push: mockPush, replace: mockReplace })),
  useSearchParams: vi.fn(() => ({
    toString: vi.fn(() => ""),
    get: vi.fn(() => null),
  })),
  usePathname: vi.fn(() => "/en/search"),
}));

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(
    () =>
      (key: string) => {
        const map: Record<string, string> = {
          "presets.label": "Quick Searches",
          "presets.mountainRetirement": "Mountain Retirement Homes",
          "presets.beachInvestment": "Beach Investment Land",
          "presets.rentalPotential": "Rental Income Properties",
          "presets.vacationHome": "Vacation Homes",
        };
        return map[key] ?? key;
      },
  ),
  useLocale: vi.fn(() => "en"),
}));

// Mock SEARCH_PRESETS to control preset list in tests
vi.mock("@/lib/constants/search-presets", () => ({
  SEARCH_PRESETS: [
    {
      id: "mountain-retirement",
      labelKey: "mountainRetirement",
      icon: "🏔️",
      filters: {
        areaSlug: "perez-zeledon",
        type: "Casa",
        tags: ["Retire"],
      },
    },
    {
      id: "beach-investment",
      labelKey: "beachInvestment",
      icon: "🌊",
      filters: {
        areaSlug: "uvita",
        tags: ["Investment Property"],
      },
    },
    {
      id: "rental-potential",
      labelKey: "rentalPotential",
      icon: "💰",
      filters: {
        tags: ["Rental Potential"],
      },
    },
    {
      id: "vacation-home",
      labelKey: "vacationHome",
      icon: "🏖️",
      filters: {
        tags: ["Vacation Home"],
      },
    },
  ],
}));

// ---------------------------------------------------------------------------
// Component under test — imported AFTER mocks
// ---------------------------------------------------------------------------

import { SmartPresetBar } from "@/components/search/smart-preset-bar"; // imported AFTER mocks

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("SmartPresetBar — smart preset buttons row (AC #4, #5, #7)", () => {
  // -------------------------------------------------------------------------
  // AC #4: Container renders with correct data-testid
  // -------------------------------------------------------------------------

  it(
    "[P0] renders data-testid='smart-preset-bar' container element",
    () => {
      // THIS TEST WILL FAIL — smart-preset-bar.tsx not yet implemented
      render(<SmartPresetBar />);

      const container = document.querySelector('[data-testid="smart-preset-bar"]');
      expect(container).not.toBeNull();
    },
  );

  // -------------------------------------------------------------------------
  // AC #4: Renders one button per preset
  // -------------------------------------------------------------------------

  it(
    "[P0] renders exactly 4 preset buttons (one per item in SEARCH_PRESETS mock)",
    () => {
      // THIS TEST WILL FAIL — smart-preset-bar.tsx not yet implemented
      render(<SmartPresetBar />);

      const buttons = document.querySelectorAll('[data-testid^="preset-"]');
      expect(buttons).toHaveLength(4);
    },
  );

  it(
    "[P0] renders 'preset-mountain-retirement' button with correct data-testid",
    () => {
      // THIS TEST WILL FAIL — smart-preset-bar.tsx not yet implemented
      render(<SmartPresetBar />);

      const btn = document.querySelector('[data-testid="preset-mountain-retirement"]');
      expect(btn).not.toBeNull();
    },
  );

  it(
    "[P0] renders 'preset-beach-investment' button with correct data-testid",
    () => {
      // THIS TEST WILL FAIL — smart-preset-bar.tsx not yet implemented
      render(<SmartPresetBar />);

      const btn = document.querySelector('[data-testid="preset-beach-investment"]');
      expect(btn).not.toBeNull();
    },
  );

  it(
    "[P0] renders 'preset-rental-potential' button with correct data-testid",
    () => {
      // THIS TEST WILL FAIL — smart-preset-bar.tsx not yet implemented
      render(<SmartPresetBar />);

      const btn = document.querySelector('[data-testid="preset-rental-potential"]');
      expect(btn).not.toBeNull();
    },
  );

  it(
    "[P0] renders 'preset-vacation-home' button with correct data-testid",
    () => {
      // THIS TEST WILL FAIL — smart-preset-bar.tsx not yet implemented
      render(<SmartPresetBar />);

      const btn = document.querySelector('[data-testid="preset-vacation-home"]');
      expect(btn).not.toBeNull();
    },
  );

  // -------------------------------------------------------------------------
  // AC #5: Clicking a preset calls router.push with correct URL
  // -------------------------------------------------------------------------

  it(
    "[P0] clicking 'mountain-retirement' preset calls router.push with area=perez-zeledon, type=Casa, tags=Retire",
    () => {
      // THIS TEST WILL FAIL — smart-preset-bar.tsx not yet implemented
      render(<SmartPresetBar />);

      const btn = document.querySelector('[data-testid="preset-mountain-retirement"]');
      expect(btn).not.toBeNull();

      fireEvent.click(btn!);

      // router.push must have been called
      expect(mockPush).toHaveBeenCalledOnce();

      const calledUrl: string = mockPush.mock.calls[0][0];

      // URL must contain expected filter params
      expect(calledUrl).toContain("area=perez-zeledon");
      expect(calledUrl).toContain("type=Casa");
      expect(calledUrl).toContain("tags=Retire");
    },
  );

  it(
    "[P0] clicking 'beach-investment' preset calls router.push with area=uvita and tags=Investment+Property",
    () => {
      // THIS TEST WILL FAIL — smart-preset-bar.tsx not yet implemented
      render(<SmartPresetBar />);

      const btn = document.querySelector('[data-testid="preset-beach-investment"]');
      fireEvent.click(btn!);

      expect(mockPush).toHaveBeenCalledOnce();
      const calledUrl: string = mockPush.mock.calls[0][0];

      expect(calledUrl).toContain("area=uvita");
      expect(calledUrl).toContain("Investment");
    },
  );

  it(
    "[P0] clicking a preset navigates to /[locale]/search path (locale-prefixed URL)",
    () => {
      // THIS TEST WILL FAIL — smart-preset-bar.tsx not yet implemented
      render(<SmartPresetBar />);

      const btn = document.querySelector('[data-testid="preset-mountain-retirement"]');
      fireEvent.click(btn!);

      const calledUrl: string = mockPush.mock.calls[0][0];
      // URL must be a full locale-prefixed path, not a relative path
      expect(calledUrl).toMatch(/\/en\/search/);
    },
  );

  it(
    "[P0] clicking a preset uses router.push (full navigation), NOT router.replace",
    () => {
      render(<SmartPresetBar />);

      const btn = document.querySelector('[data-testid="preset-mountain-retirement"]');
      fireEvent.click(btn!);

      // router.push must be called, not router.replace
      expect(mockPush).toHaveBeenCalled();
      // router.replace must NOT be called (presets are discovery entry points, not incremental changes)
      expect(mockReplace).not.toHaveBeenCalled();
    },
  );

  // -------------------------------------------------------------------------
  // AC #7: Presets accept a custom list via props (configurable without code changes)
  // -------------------------------------------------------------------------

  it(
    "[P1] accepts custom presets via props (overrides SEARCH_PRESETS default)",
    () => {
      // THIS TEST WILL FAIL — smart-preset-bar.tsx not yet implemented
      const customPresets = [
        {
          id: "custom-preset",
          labelKey: "customLabel",
          filters: { tags: ["Commercial"] },
        },
      ];

      render(<SmartPresetBar presets={customPresets as Parameters<typeof SmartPresetBar>[0]["presets"]} />);

      // Only the custom preset button should render
      const allPresetButtons = document.querySelectorAll('[data-testid^="preset-"]');
      expect(allPresetButtons).toHaveLength(1);

      const customBtn = document.querySelector('[data-testid="preset-custom-preset"]');
      expect(customBtn).not.toBeNull();
    },
  );

  // -------------------------------------------------------------------------
  // Architecture compliance
  // -------------------------------------------------------------------------

  it(
    "[P1] SmartPresetBar is a Client Component (file must start with 'use client')",
    async () => {
      // THIS TEST WILL FAIL — smart-preset-bar.tsx not yet implemented
      const fs = await import("node:fs");
      const path = await import("node:path");

      const filePath = path.resolve(
        process.cwd(),
        "src/components/search/smart-preset-bar.tsx",
      );
      expect(fs.existsSync(filePath)).toBe(true);

      const src = fs.readFileSync(filePath, "utf8");
      expect(src.trimStart()).toMatch(/^['"]use client['"]/);
    },
  );

  it(
    "[P1] SmartPresetBar imports SEARCH_PRESETS from '@/lib/constants/search-presets'",
    async () => {
      // THIS TEST WILL FAIL — smart-preset-bar.tsx not yet implemented
      const fs = await import("node:fs");
      const path = await import("node:path");

      const filePath = path.resolve(
        process.cwd(),
        "src/components/search/smart-preset-bar.tsx",
      );
      expect(fs.existsSync(filePath)).toBe(true);

      const src = fs.readFileSync(filePath, "utf8");
      expect(src).toContain("@/lib/constants/search-presets");
    },
  );

  it(
    "[P1] search-presets.ts constants file exists without 'use client' or 'server-only' (neutral constants)",
    async () => {
      // THIS TEST WILL FAIL — search-presets.ts not yet implemented
      const fs = await import("node:fs");
      const path = await import("node:path");

      const filePath = path.resolve(
        process.cwd(),
        "src/lib/constants/search-presets.ts",
      );
      expect(fs.existsSync(filePath)).toBe(true);

      const src = fs.readFileSync(filePath, "utf8");
      // Must NOT have use client or server-only (neutral constants file)
      expect(src).not.toContain('"use client"');
      expect(src).not.toContain("'use client'");
      expect(src).not.toContain("server-only");
    },
  );
});
