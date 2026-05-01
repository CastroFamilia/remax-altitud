/**
 * Story 3.4: Lifestyle Tags & Smart Presets
 * Component: src/components/search/lifestyle-tag-chips.tsx
 *
 * TDD RED PHASE — all tests use it() with skip comments and will FAIL until
 * lifestyle-tag-chips.tsx is implemented.
 *
 * Covers:
 *   AC #1 — Lifestyle tag chip options: "Investment Property," "Rental Potential,"
 *            "Vacation Home," "Retirement Paradise," "Commercial"
 *   AC #2 — Tapping a chip toggles active state and filters results immediately
 *   AC #3 — Multiple tags selected simultaneously (OR logic) — chip row perspective
 *   AC #6 — Active lifestyle tags appear as chips in the active filter display
 *
 * Environment: jsdom (React component — .spec.tsx → jsdom via vitest.config.mts)
 *
 * Component interface:
 *   interface LifestyleTagChipsProps {
 *     activeTags: string[];        // currently selected tags from URL state
 *     onToggle: (tag: string) => void;  // toggleTag from useSearchFilters
 *   }
 *
 * data-testid contracts (MUST NOT change):
 *   - data-testid="lifestyle-tag-chips"          on root container
 *   - data-testid={`lifestyle-tag-chip-${tag.toLowerCase().replace(/\s+/g, '-')}`}  on each chip
 */

import { describe, expect, it, vi, afterEach } from "vitest";
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

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(() => (key: string) => key),
  useLocale: vi.fn(() => "en"),
}));

// Mock LIFESTYLE_TAGS to control the list in tests
vi.mock("@/lib/constants/lifestyle-tags", () => ({
  LIFESTYLE_TAGS: [
    "Rental Potential",
    "Investment Property",
    "Vacation Home",
    "Retire",
    "Commercial",
  ] as const,
  TAG_DISPLAY_LABELS: {
    Retire: "Retirement Paradise",
  } as Record<string, string>,
  tagDisplayLabel: (tag: string) => {
    const labels: Record<string, string> = { Retire: "Retirement Paradise" };
    return labels[tag] ?? tag;
  },
}));

// ---------------------------------------------------------------------------
// Component under test — imported AFTER mocks
// ---------------------------------------------------------------------------

import { LifestyleTagChips } from "@/components/search/lifestyle-tag-chips"; // imported AFTER mocks

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const noop = vi.fn();

function renderChips(activeTags: string[] = [], onToggle = noop) {
  return render(<LifestyleTagChips activeTags={activeTags} onToggle={onToggle} />);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("LifestyleTagChips — lifestyle tag chip row (AC #1, #2, #3, #6)", () => {
  // -------------------------------------------------------------------------
  // AC #1: Container renders with correct data-testid
  // -------------------------------------------------------------------------

  it(
    "[P0] renders data-testid='lifestyle-tag-chips' container element",
    () => {
      // THIS TEST WILL FAIL — lifestyle-tag-chips.tsx not yet implemented
      renderChips();

      const container = document.querySelector('[data-testid="lifestyle-tag-chips"]');
      expect(container).not.toBeNull();
    },
  );

  // -------------------------------------------------------------------------
  // AC #1: Renders one chip per tag in LIFESTYLE_TAGS (5 chips total)
  // -------------------------------------------------------------------------

  it(
    "[P0] renders exactly 5 chips — one per tag in LIFESTYLE_TAGS",
    () => {
      // THIS TEST WILL FAIL — lifestyle-tag-chips.tsx not yet implemented
      renderChips();

      const container = document.querySelector('[data-testid="lifestyle-tag-chips"]');
      // Expected chips: rental-potential, investment-property, vacation-home, retire, commercial
      const chips = container?.querySelectorAll('[data-testid^="lifestyle-tag-chip-"]');
      expect(chips).toHaveLength(5);
    },
  );

  it(
    "[P0] renders chip for 'Investment Property' tag with correct data-testid",
    () => {
      // THIS TEST WILL FAIL — lifestyle-tag-chips.tsx not yet implemented
      renderChips();

      const chip = document.querySelector('[data-testid="lifestyle-tag-chip-investment-property"]');
      expect(chip).not.toBeNull();
    },
  );

  it(
    "[P0] renders chip for 'Rental Potential' tag with correct data-testid",
    () => {
      // THIS TEST WILL FAIL — lifestyle-tag-chips.tsx not yet implemented
      renderChips();

      const chip = document.querySelector('[data-testid="lifestyle-tag-chip-rental-potential"]');
      expect(chip).not.toBeNull();
    },
  );

  it(
    "[P0] renders chip for 'Vacation Home' tag with correct data-testid",
    () => {
      // THIS TEST WILL FAIL — lifestyle-tag-chips.tsx not yet implemented
      renderChips();

      const chip = document.querySelector('[data-testid="lifestyle-tag-chip-vacation-home"]');
      expect(chip).not.toBeNull();
    },
  );

  it(
    "[P0] renders chip for 'Commercial' tag with correct data-testid",
    () => {
      // THIS TEST WILL FAIL — lifestyle-tag-chips.tsx not yet implemented
      renderChips();

      const chip = document.querySelector('[data-testid="lifestyle-tag-chip-commercial"]');
      expect(chip).not.toBeNull();
    },
  );

  // -------------------------------------------------------------------------
  // AC #1: "Retire" stored tag renders with display label "Retirement Paradise"
  // -------------------------------------------------------------------------

  it(
    "[P0] 'Retire' tag renders with display label 'Retirement Paradise' (not 'Retire')",
    () => {
      // THIS TEST WILL FAIL — lifestyle-tag-chips.tsx not yet implemented
      renderChips();

      const chip = document.querySelector('[data-testid="lifestyle-tag-chip-retire"]');
      expect(chip).not.toBeNull();
      // The chip must display "Retirement Paradise" as its label
      expect(chip?.textContent).toContain("Retirement Paradise");
      // Must NOT display raw "Retire" as the visible text
      expect(chip?.textContent).not.toBe("Retire");
    },
  );

  // -------------------------------------------------------------------------
  // AC #2: Active chip has correct style class
  // -------------------------------------------------------------------------

  it(
    "[P0] active tag chip has 'bg-brand-blue' class (active state styling)",
    () => {
      // THIS TEST WILL FAIL — lifestyle-tag-chips.tsx not yet implemented
      renderChips(["Investment Property"]);

      const activeChip = document.querySelector(
        '[data-testid="lifestyle-tag-chip-investment-property"]',
      );
      expect(activeChip).not.toBeNull();
      expect(activeChip?.className).toContain("bg-brand-blue");
    },
  );

  it(
    "[P0] inactive chip does NOT have 'bg-brand-blue' class",
    () => {
      // THIS TEST WILL FAIL — lifestyle-tag-chips.tsx not yet implemented
      // activeTags is empty — all chips are inactive
      renderChips([]);

      const chip = document.querySelector(
        '[data-testid="lifestyle-tag-chip-investment-property"]',
      );
      expect(chip).not.toBeNull();
      expect(chip?.className).not.toContain("bg-brand-blue");
    },
  );

  it(
    "[P0] only the active tag chip has 'bg-brand-blue' class when one tag is selected",
    () => {
      // THIS TEST WILL FAIL — lifestyle-tag-chips.tsx not yet implemented
      renderChips(["Rental Potential"]);

      const activeChip = document.querySelector('[data-testid="lifestyle-tag-chip-rental-potential"]');
      const inactiveChip = document.querySelector('[data-testid="lifestyle-tag-chip-investment-property"]');

      expect(activeChip?.className).toContain("bg-brand-blue");
      expect(inactiveChip?.className).not.toContain("bg-brand-blue");
    },
  );

  // -------------------------------------------------------------------------
  // AC #2: Clicking a chip calls onToggle with the correct tag value
  // -------------------------------------------------------------------------

  it(
    "[P0] clicking an inactive chip calls onToggle with the correct stored tag value",
    () => {
      // THIS TEST WILL FAIL — lifestyle-tag-chips.tsx not yet implemented
      const onToggle = vi.fn();
      renderChips([], onToggle);

      const chip = document.querySelector('[data-testid="lifestyle-tag-chip-investment-property"]');
      expect(chip).not.toBeNull();

      fireEvent.click(chip!);

      // onToggle must be called with the stored tag value (not the display label)
      expect(onToggle).toHaveBeenCalledWith("Investment Property");
    },
  );

  it(
    "[P0] clicking an active chip calls onToggle to deselect it (toggle off)",
    () => {
      // THIS TEST WILL FAIL — lifestyle-tag-chips.tsx not yet implemented
      const onToggle = vi.fn();
      renderChips(["Vacation Home"], onToggle);

      const chip = document.querySelector('[data-testid="lifestyle-tag-chip-vacation-home"]');
      fireEvent.click(chip!);

      // onToggle should be called with the stored tag value (hook handles add/remove logic)
      expect(onToggle).toHaveBeenCalledWith("Vacation Home");
    },
  );

  it(
    "[P0] clicking 'Retire' chip calls onToggle with stored value 'Retire' (not 'Retirement Paradise')",
    () => {
      // THIS TEST WILL FAIL — lifestyle-tag-chips.tsx not yet implemented
      const onToggle = vi.fn();
      renderChips([], onToggle);

      const chip = document.querySelector('[data-testid="lifestyle-tag-chip-retire"]');
      fireEvent.click(chip!);

      // Must pass the STORED value "Retire" to onToggle (not the display label)
      expect(onToggle).toHaveBeenCalledWith("Retire");
    },
  );

  // -------------------------------------------------------------------------
  // AC #3: Multiple active tags — all chips show correct state simultaneously
  // -------------------------------------------------------------------------

  it(
    "[P1] multiple active tags all show 'bg-brand-blue' class simultaneously (OR logic selection)",
    () => {
      // THIS TEST WILL FAIL — lifestyle-tag-chips.tsx not yet implemented
      renderChips(["Investment Property", "Rental Potential"]);

      const chip1 = document.querySelector('[data-testid="lifestyle-tag-chip-investment-property"]');
      const chip2 = document.querySelector('[data-testid="lifestyle-tag-chip-rental-potential"]');
      const chip3 = document.querySelector('[data-testid="lifestyle-tag-chip-vacation-home"]');

      // Both selected chips must be active
      expect(chip1?.className).toContain("bg-brand-blue");
      expect(chip2?.className).toContain("bg-brand-blue");

      // Non-selected chip must be inactive
      expect(chip3?.className).not.toContain("bg-brand-blue");
    },
  );

  // -------------------------------------------------------------------------
  // Touch target compliance (UX-DR7)
  // -------------------------------------------------------------------------

  it(
    "[P1] each chip meets minimum 44px touch target height (UX-DR7)",
    () => {
      // THIS TEST WILL FAIL — lifestyle-tag-chips.tsx not yet implemented
      renderChips();

      const chips = document.querySelectorAll('[data-testid^="lifestyle-tag-chip-"]');
      expect(chips.length).toBeGreaterThan(0);

      chips.forEach((chip) => {
        // Check for min-h-[44px] or h-11 (44px) class in className
        const hasMinHeight =
          chip.className.includes("min-h-[44px]") ||
          chip.className.includes("h-11") ||
          chip.className.includes("min-h-11");
        expect(hasMinHeight).toBe(true);
      });
    },
  );

  // -------------------------------------------------------------------------
  // Architecture compliance
  // -------------------------------------------------------------------------

  it(
    "[P1] LifestyleTagChips is a Client Component (file must start with 'use client')",
    async () => {
      // THIS TEST WILL FAIL — lifestyle-tag-chips.tsx not yet implemented
      const fs = await import("node:fs");
      const path = await import("node:path");

      const filePath = path.resolve(
        process.cwd(),
        "src/components/search/lifestyle-tag-chips.tsx",
      );
      expect(fs.existsSync(filePath)).toBe(true);

      const src = fs.readFileSync(filePath, "utf8");
      expect(src.trimStart()).toMatch(/^['"]use client['"]/);
    },
  );

  it(
    "[P1] LifestyleTagChips imports LIFESTYLE_TAGS from '@/lib/constants/lifestyle-tags' (single source of truth)",
    async () => {
      // THIS TEST WILL FAIL — lifestyle-tag-chips.tsx not yet implemented
      const fs = await import("node:fs");
      const path = await import("node:path");

      const filePath = path.resolve(
        process.cwd(),
        "src/components/search/lifestyle-tag-chips.tsx",
      );
      expect(fs.existsSync(filePath)).toBe(true);

      const src = fs.readFileSync(filePath, "utf8");
      // Must import from the constants file, not hardcode tag names
      expect(src).toContain("@/lib/constants/lifestyle-tags");
    },
  );
});
