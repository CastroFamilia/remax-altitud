/**
 * Story 4.5: Similar Properties & Cross-Linking
 * Component: src/components/layout/breadcrumbs.tsx
 *
 * TDD Phase: RED — all tests are it.skip() until implementation is done.
 * Remove it.skip() per test when implementing to verify green phase.
 *
 * Covers:
 *   AC #4  — Any page with navigation hierarchy shows breadcrumbs path
 *            (e.g., Home > Search > [Title]) using the Breadcrumbs component
 *
 * Test IDs from test-design-epic-4.md:
 *   4.5-E2E-002 unit analog — breadcrumbs render full path (P1)
 *
 * data-testid contract (CANNOT rename):
 *   data-testid="breadcrumbs" — root <nav> element
 *
 * Environment: jsdom (React component — .spec.tsx → jsdom via vitest.config.mts)
 */

// ---------------------------------------------------------------------------
// Module mocks — declared BEFORE any imports of the module under test
// ---------------------------------------------------------------------------

import { vi, describe, it, expect, afterEach } from "vitest";

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// imported AFTER mocks
import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const breadcrumbItems = [
  { label: "Home", href: "/en" },
  { label: "Search", href: "/en/search" },
  { label: "Casa Verde" }, // last item — no href (current page)
];

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe("Story 4.5: Breadcrumbs component", () => {
  // [P0] Core rendering

  it.skip(
    "[P0] 4.5-BREAD-001: renders data-testid='breadcrumbs' root nav element (AC #4, 4.5-E2E-002 unit analog)",
    () => {
      // THIS TEST WILL FAIL — Breadcrumbs component not yet implemented
      render(<Breadcrumbs items={breadcrumbItems} locale="en" />);

      const nav = screen.getByTestId("breadcrumbs");
      expect(nav).toBeTruthy();
      expect(nav.tagName.toLowerCase()).toBe("nav");
    },
  );

  it.skip(
    "[P0] 4.5-BREAD-002: renders all breadcrumb item labels (AC #4)",
    () => {
      // THIS TEST WILL FAIL — Breadcrumbs component not yet implemented
      render(<Breadcrumbs items={breadcrumbItems} locale="en" />);

      expect(screen.getByText("Home")).toBeTruthy();
      expect(screen.getByText("Search")).toBeTruthy();
      expect(screen.getByText("Casa Verde")).toBeTruthy();
    },
  );

  it.skip(
    "[P0] 4.5-BREAD-003: last item has aria-current='page' attribute (AC #4, accessibility)",
    () => {
      // THIS TEST WILL FAIL — Breadcrumbs component not yet implemented
      render(<Breadcrumbs items={breadcrumbItems} locale="en" />);

      const currentItem = screen.getByText("Casa Verde");
      expect(currentItem.getAttribute("aria-current")).toBe("page");
    },
  );

  it.skip(
    "[P0] 4.5-BREAD-004: intermediate items render as <a> links with correct href values (AC #4)",
    () => {
      // THIS TEST WILL FAIL — Breadcrumbs component not yet implemented
      render(<Breadcrumbs items={breadcrumbItems} locale="en" />);

      const homeLink = screen.getByText("Home");
      expect(homeLink.tagName.toLowerCase()).toBe("a");
      expect(homeLink.getAttribute("href")).toBe("/en");

      const searchLink = screen.getByText("Search");
      expect(searchLink.tagName.toLowerCase()).toBe("a");
      expect(searchLink.getAttribute("href")).toBe("/en/search");
    },
  );

  // [P1] Behavior

  it.skip(
    "[P1] 4.5-BREAD-005: last item does NOT render as a link (no href on current page, AC #4)",
    () => {
      // THIS TEST WILL FAIL — Breadcrumbs component not yet implemented
      render(<Breadcrumbs items={breadcrumbItems} locale="en" />);

      const lastItem = screen.getByText("Casa Verde");
      expect(lastItem.tagName.toLowerCase()).not.toBe("a");
      expect(lastItem.getAttribute("href")).toBeNull();
    },
  );

  it.skip(
    "[P1] 4.5-BREAD-006: nav has aria-label='Breadcrumb' for accessibility (AC #4)",
    () => {
      // THIS TEST WILL FAIL — Breadcrumbs component not yet implemented
      render(<Breadcrumbs items={breadcrumbItems} locale="en" />);

      const nav = screen.getByTestId("breadcrumbs");
      expect(nav.getAttribute("aria-label")).toBe("Breadcrumb");
    },
  );

  it.skip(
    "[P1] 4.5-BREAD-007: renders correctly with only one item (single breadcrumb edge case)",
    () => {
      // THIS TEST WILL FAIL — Breadcrumbs component not yet implemented
      render(
        <Breadcrumbs items={[{ label: "Home" }]} locale="en" />,
      );

      const nav = screen.getByTestId("breadcrumbs");
      expect(nav).toBeTruthy();
      const homeItem = screen.getByText("Home");
      expect(homeItem.getAttribute("aria-current")).toBe("page");
    },
  );

  // [P2] Visual structure

  it.skip(
    "[P2] 4.5-BREAD-008: separator character is present between items and is aria-hidden='true' (AC #4)",
    () => {
      // THIS TEST WILL FAIL — Breadcrumbs component not yet implemented
      render(<Breadcrumbs items={breadcrumbItems} locale="en" />);

      // The separator span should be aria-hidden to avoid screen-reader noise
      const separators = document
        .querySelectorAll('[aria-hidden="true"]');
      // Expect at least (items.length - 1) separators
      expect(separators.length).toBeGreaterThanOrEqual(breadcrumbItems.length - 1);
    },
  );

  it.skip(
    "[P2] 4.5-BREAD-009: renders an ordered list (<ol>) for semantic breadcrumb structure (AC #4)",
    () => {
      // THIS TEST WILL FAIL — Breadcrumbs component not yet implemented
      render(<Breadcrumbs items={breadcrumbItems} locale="en" />);

      const nav = screen.getByTestId("breadcrumbs");
      const ol = nav.querySelector("ol");
      expect(ol).toBeTruthy();
    },
  );
});
