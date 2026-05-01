/**
 * Story 3.5: Property Cards & Grid View
 * Component: src/components/property/share-button.tsx
 *
 * TDD RED PHASE — all tests use it.skip() and will FAIL until
 * share-button.tsx is implemented.
 *
 * Covers:
 *   AC #1  — Share icon: uses navigator.share when available, falls back to clipboard
 *
 * Environment: jsdom (React component — .spec.tsx → jsdom via vitest.config.mts)
 *
 * Component interface:
 *   interface ShareButtonProps {
 *     slug: string;
 *     title: string;
 *     locale: string;
 *   }
 *
 * Architecture notes:
 *   - Client Component ('use client') — uses browser APIs
 *   - navigator.share when available, navigator.clipboard.writeText fallback
 *   - data-testid="share-button" on the button
 *   - Inline toast (no external toast library)
 */

import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";
import { render, cleanup, fireEvent, act } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Module mocks — declared BEFORE any imports of the module under test
// ---------------------------------------------------------------------------

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(() => (key: string) => {
    const map: Record<string, string> = {
      "share": "Share property",
      "linkCopied": "Link copied!",
    };
    return map[key] ?? key;
  }),
}));

// ---------------------------------------------------------------------------
// Component under test — imported AFTER mocks
// ---------------------------------------------------------------------------

import { ShareButton } from "@/components/property/share-button";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const TEST_SLUG = "mountain-house-perez-zeledon";
const TEST_TITLE = "Mountain House";
const TEST_LOCALE = "en";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

beforeEach(() => {
  // Reset navigator mocks
  Object.defineProperty(navigator, "share", {
    value: undefined,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(navigator, "clipboard", {
    value: undefined,
    writable: true,
    configurable: true,
  });
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ShareButton — AC #1: share property URL", () => {
  // -------------------------------------------------------------------------
  // data-testid presence
  // -------------------------------------------------------------------------

  it.skip(
    "[P0] renders data-testid='share-button' button",
    () => {
      // THIS TEST WILL FAIL — share-button.tsx not yet implemented
      render(
        <ShareButton
          slug={TEST_SLUG}
          title={TEST_TITLE}
          locale={TEST_LOCALE}
        />,
      );

      const button = document.querySelector('[data-testid="share-button"]');
      expect(button).not.toBeNull();
    },
  );

  // -------------------------------------------------------------------------
  // navigator.share: happy path
  // -------------------------------------------------------------------------

  it.skip(
    "[P0] calls navigator.share with correct URL when navigator.share is available",
    async () => {
      // THIS TEST WILL FAIL — share-button.tsx not yet implemented
      const mockShare = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, "share", {
        value: mockShare,
        writable: true,
        configurable: true,
      });

      render(
        <ShareButton
          slug={TEST_SLUG}
          title={TEST_TITLE}
          locale={TEST_LOCALE}
        />,
      );

      const button = document.querySelector('[data-testid="share-button"]');
      await act(async () => {
        fireEvent.click(button!);
      });

      expect(mockShare).toHaveBeenCalledOnce();
      expect(mockShare).toHaveBeenCalledWith(
        expect.objectContaining({
          title: TEST_TITLE,
          url: expect.stringContaining(`/${TEST_LOCALE}/property/${TEST_SLUG}`),
        }),
      );
    },
  );

  // -------------------------------------------------------------------------
  // navigator.clipboard fallback: when navigator.share is NOT available
  // -------------------------------------------------------------------------

  it.skip(
    "[P0] falls back to navigator.clipboard.writeText when navigator.share is undefined",
    async () => {
      // THIS TEST WILL FAIL — share-button.tsx not yet implemented
      const mockClipboardWrite = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, "share", {
        value: undefined,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText: mockClipboardWrite },
        writable: true,
        configurable: true,
      });

      render(
        <ShareButton
          slug={TEST_SLUG}
          title={TEST_TITLE}
          locale={TEST_LOCALE}
        />,
      );

      const button = document.querySelector('[data-testid="share-button"]');
      await act(async () => {
        fireEvent.click(button!);
      });

      expect(mockClipboardWrite).toHaveBeenCalledOnce();
      expect(mockClipboardWrite).toHaveBeenCalledWith(
        expect.stringContaining(`/${TEST_LOCALE}/property/${TEST_SLUG}`),
      );
    },
  );

  // -------------------------------------------------------------------------
  // Clipboard fallback: toast notification
  // -------------------------------------------------------------------------

  it.skip(
    "[P1] shows 'Link copied!' inline toast after clipboard fallback",
    async () => {
      // THIS TEST WILL FAIL — share-button.tsx not yet implemented
      const mockClipboardWrite = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, "share", {
        value: undefined,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText: mockClipboardWrite },
        writable: true,
        configurable: true,
      });

      render(
        <ShareButton
          slug={TEST_SLUG}
          title={TEST_TITLE}
          locale={TEST_LOCALE}
        />,
      );

      const button = document.querySelector('[data-testid="share-button"]');
      await act(async () => {
        fireEvent.click(button!);
      });

      // Should show a status message
      const statusEl = document.querySelector('[role="status"]');
      expect(statusEl).not.toBeNull();
      expect(statusEl?.textContent).toMatch(/copied|link/i);
    },
  );

  // -------------------------------------------------------------------------
  // URL construction
  // -------------------------------------------------------------------------

  it.skip(
    "[P1] constructs property URL using locale and slug: /{locale}/property/{slug}",
    async () => {
      // THIS TEST WILL FAIL — share-button.tsx not yet implemented
      const mockShare = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, "share", {
        value: mockShare,
        writable: true,
        configurable: true,
      });

      render(
        <ShareButton
          slug="beach-house-dominical"
          title="Beach House"
          locale="es"
        />,
      );

      const button = document.querySelector('[data-testid="share-button"]');
      await act(async () => {
        fireEvent.click(button!);
      });

      expect(mockShare).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining("/es/property/beach-house-dominical"),
        }),
      );
    },
  );

  // -------------------------------------------------------------------------
  // Accessibility
  // -------------------------------------------------------------------------

  it.skip(
    "[P1] button has accessible aria-label for sharing",
    () => {
      // THIS TEST WILL FAIL — share-button.tsx not yet implemented
      render(
        <ShareButton
          slug={TEST_SLUG}
          title={TEST_TITLE}
          locale={TEST_LOCALE}
        />,
      );

      const button = document.querySelector('[data-testid="share-button"]');
      const ariaLabel = button?.getAttribute("aria-label");
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel).toMatch(/share/i);
    },
  );

  // -------------------------------------------------------------------------
  // Architecture compliance
  // -------------------------------------------------------------------------

  it.skip(
    "[P1] ShareButton is a Client Component (file must start with 'use client')",
    async () => {
      // THIS TEST WILL FAIL — share-button.tsx not yet implemented
      const fs = await import("node:fs");
      const path = await import("node:path");

      const filePath = path.resolve(
        process.cwd(),
        "src/components/property/share-button.tsx",
      );
      expect(fs.existsSync(filePath)).toBe(true);

      const src = fs.readFileSync(filePath, "utf8");
      expect(src.trimStart()).toMatch(/^['"]use client['"]/);
    },
  );
});
