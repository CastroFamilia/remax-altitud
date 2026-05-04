/**
 * Story 3.5: Property Cards & Grid View
 * Component: src/components/property/save-button.tsx
 *
 * TDD RED PHASE — all tests use it() and will FAIL until
 * save-button.tsx is implemented.
 *
 * Covers:
 *   AC #1  — ♡ save icon: toggles saved state, persists to localStorage
 *
 * Environment: jsdom (React component — .spec.tsx → jsdom via vitest.config.mts)
 *
 * Component interface:
 *   interface SaveButtonProps {
 *     propertyId: string;
 *     propertyTitle: string;
 *   }
 *
 * Architecture notes:
 *   - Client Component ('use client') — localStorage access
 *   - localStorage key: 'shortlist' — string[] of property IDs (max 20)
 *   - data-testid="save-button" on the button
 */

import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";
import { render, cleanup, fireEvent } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Module mocks — declared BEFORE any imports of the module under test
// ---------------------------------------------------------------------------

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(() => (key: string) => {
    const map: Record<string, string> = {
      "saveProperty": "Save property",
      "removeFromSaved": "Remove from saved",
      "shortlistFull": "Shortlist full (20 max)",
    };
    return map[key] ?? key;
  }),
}));

// ---------------------------------------------------------------------------
// Component under test — imported AFTER mocks
// ---------------------------------------------------------------------------

import { SaveButton } from "@/components/property/save-button";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const TEST_PROPERTY_ID = "prop-001";
const TEST_PROPERTY_TITLE = "Mountain House";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  localStorage.clear();
});

beforeEach(() => {
  localStorage.clear();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("SaveButton — AC #1: save property to localStorage shortlist", () => {
  // -------------------------------------------------------------------------
  // data-testid presence
  // -------------------------------------------------------------------------

  it(
    "[P0] renders data-testid='save-button' button",
    () => {
      // THIS TEST WILL FAIL — save-button.tsx not yet implemented
      render(
        <SaveButton
          propertyId={TEST_PROPERTY_ID}
          propertyTitle={TEST_PROPERTY_TITLE}
        />,
      );

      const button = document.querySelector('[data-testid="save-button"]');
      expect(button).not.toBeNull();
    },
  );

  // -------------------------------------------------------------------------
  // Default state: unsaved
  // -------------------------------------------------------------------------

  it(
    "[P0] has aria-label='Save property' in default (unsaved) state",
    () => {
      // THIS TEST WILL FAIL — save-button.tsx not yet implemented
      render(
        <SaveButton
          propertyId={TEST_PROPERTY_ID}
          propertyTitle={TEST_PROPERTY_TITLE}
        />,
      );

      const button = document.querySelector('[data-testid="save-button"]');
      expect(button?.getAttribute("aria-label")).toBe("Save property");
    },
  );

  // -------------------------------------------------------------------------
  // Click: save to localStorage
  // -------------------------------------------------------------------------

  it(
    "[P0] clicking the button saves propertyId to localStorage shortlist",
    () => {
      // THIS TEST WILL FAIL — save-button.tsx not yet implemented
      render(
        <SaveButton
          propertyId={TEST_PROPERTY_ID}
          propertyTitle={TEST_PROPERTY_TITLE}
        />,
      );

      const button = document.querySelector('[data-testid="save-button"]');
      expect(button).not.toBeNull();
      fireEvent.click(button!);

      const shortlist = JSON.parse(localStorage.getItem("shortlist") ?? "[]") as string[];
      expect(shortlist).toContain(TEST_PROPERTY_ID);
    },
  );

  it(
    "[P0] clicking the button changes aria-label to 'Remove from saved' after saving",
    () => {
      // THIS TEST WILL FAIL — save-button.tsx not yet implemented
      render(
        <SaveButton
          propertyId={TEST_PROPERTY_ID}
          propertyTitle={TEST_PROPERTY_TITLE}
        />,
      );

      const button = document.querySelector('[data-testid="save-button"]');
      fireEvent.click(button!);

      // After click, label should change to reflect saved state
      expect(button?.getAttribute("aria-label")).toBe("Remove from saved");
    },
  );

  // -------------------------------------------------------------------------
  // Click: remove from localStorage
  // -------------------------------------------------------------------------

  it(
    "[P0] clicking the button again (when saved) removes propertyId from localStorage",
    () => {
      // THIS TEST WILL FAIL — save-button.tsx not yet implemented
      // Pre-seed localStorage with the property saved
      localStorage.setItem("shortlist", JSON.stringify([TEST_PROPERTY_ID]));

      render(
        <SaveButton
          propertyId={TEST_PROPERTY_ID}
          propertyTitle={TEST_PROPERTY_TITLE}
        />,
      );

      const button = document.querySelector('[data-testid="save-button"]');
      // Should show "Remove from saved" since it's already saved
      expect(button?.getAttribute("aria-label")).toBe("Remove from saved");

      // Click to unsave
      fireEvent.click(button!);

      const shortlist = JSON.parse(localStorage.getItem("shortlist") ?? "[]") as string[];
      expect(shortlist).not.toContain(TEST_PROPERTY_ID);
    },
  );

  it(
    "[P0] aria-label returns to 'Save property' after unsaving",
    () => {
      // THIS TEST WILL FAIL — save-button.tsx not yet implemented
      localStorage.setItem("shortlist", JSON.stringify([TEST_PROPERTY_ID]));

      render(
        <SaveButton
          propertyId={TEST_PROPERTY_ID}
          propertyTitle={TEST_PROPERTY_TITLE}
        />,
      );

      const button = document.querySelector('[data-testid="save-button"]');
      fireEvent.click(button!); // unsave

      expect(button?.getAttribute("aria-label")).toBe("Save property");
    },
  );

  // -------------------------------------------------------------------------
  // Pre-seeded state
  // -------------------------------------------------------------------------

  it(
    "[P1] initializes as saved state when propertyId is already in localStorage shortlist",
    () => {
      // THIS TEST WILL FAIL — save-button.tsx not yet implemented
      localStorage.setItem("shortlist", JSON.stringify([TEST_PROPERTY_ID, "other-prop"]));

      render(
        <SaveButton
          propertyId={TEST_PROPERTY_ID}
          propertyTitle={TEST_PROPERTY_TITLE}
        />,
      );

      const button = document.querySelector('[data-testid="save-button"]');
      expect(button?.getAttribute("aria-label")).toBe("Remove from saved");
    },
  );

  // -------------------------------------------------------------------------
  // Shortlist full toast
  // -------------------------------------------------------------------------

  it(
    "[P1] shows inline toast message when shortlist is full (20 items) and user tries to save",
    () => {
      // THIS TEST WILL FAIL — save-button.tsx not yet implemented
      // Fill shortlist with 20 items (not including our test property)
      const fullShortlist = Array.from({ length: 20 }, (_, i) => `prop-${i + 100}`);
      localStorage.setItem("shortlist", JSON.stringify(fullShortlist));

      render(
        <SaveButton
          propertyId={TEST_PROPERTY_ID}
          propertyTitle={TEST_PROPERTY_TITLE}
        />,
      );

      const button = document.querySelector('[data-testid="save-button"]');
      fireEvent.click(button!);

      // Should show a toast/status message about shortlist being full
      const statusEl = document.querySelector('[role="status"]');
      expect(statusEl).not.toBeNull();
      expect(statusEl?.textContent).toMatch(/shortlist full|full|max/i);
    },
  );

  it(
    "[P1] does NOT add to shortlist when already at 20 items",
    () => {
      // THIS TEST WILL FAIL — save-button.tsx not yet implemented
      const fullShortlist = Array.from({ length: 20 }, (_, i) => `prop-${i + 100}`);
      localStorage.setItem("shortlist", JSON.stringify(fullShortlist));

      render(
        <SaveButton
          propertyId={TEST_PROPERTY_ID}
          propertyTitle={TEST_PROPERTY_TITLE}
        />,
      );

      const button = document.querySelector('[data-testid="save-button"]');
      fireEvent.click(button!);

      const shortlist = JSON.parse(localStorage.getItem("shortlist") ?? "[]") as string[];
      expect(shortlist).toHaveLength(20); // Still 20, not 21
      expect(shortlist).not.toContain(TEST_PROPERTY_ID);
    },
  );

  // -------------------------------------------------------------------------
  // Architecture compliance
  // -------------------------------------------------------------------------

  it(
    "[P1] SaveButton is a Client Component (file must start with 'use client')",
    async () => {
      // THIS TEST WILL FAIL — save-button.tsx not yet implemented
      const fs = await import("node:fs");
      const path = await import("node:path");

      const filePath = path.resolve(
        process.cwd(),
        "src/components/property/save-button.tsx",
      );
      expect(fs.existsSync(filePath)).toBe(true);

      const src = fs.readFileSync(filePath, "utf8");
      expect(src.trimStart()).toMatch(/^['"]use client['"]/);
    },
  );
});
