/**
 * Story 3.8: No-Results, Hidden Listings & Near Me
 * Component: src/components/property/no-results-state.tsx
 *
 * TDD RED PHASE — all tests use it() and will FAIL until
 * no-results-state.tsx is upgraded to accept a `filters` prop and
 * build a dynamic WhatsApp message from active search filters.
 *
 * Covers:
 *   AC #1  — No-results state shows smart suggestions + WhatsApp CTA
 *   AC #2  — WhatsApp CTA forwards search criteria in message
 *
 * Test IDs from test-design-epic-3.md:
 *   3.8-E2E-002 (unit coverage) — Zero-results shows suggestions + WhatsApp CTA with correct URL
 *   3.8-E2E-005 (unit coverage) — WhatsApp CTA in no-results forwards search criteria in message
 *
 * Environment: jsdom (React component — .spec.tsx → jsdom via environmentMatchGlobs)
 *
 * Component interface expected:
 *   interface NoResultsStateProps {
 *     filters: SearchFilters;
 *   }
 *   export function NoResultsState(props: NoResultsStateProps): JSX.Element
 *
 * data-testid attributes:
 *   data-testid="no-results-state"       — root element
 *   data-testid="no-results-whatsapp-cta" — WhatsApp anchor
 *
 * Activation instructions for the dev implementing Story 3.8 Task 1:
 *   1. Remove test.skip from the test you are implementing
 *   2. Run: npx vitest run tests/unit/search/no-results-state.spec.tsx
 *   3. Verify the test FAILS before implementation, then passes after
 *   4. Commit passing tests
 */

import { describe, expect, it, vi, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Module mocks — declared BEFORE any imports of the module under test
// ---------------------------------------------------------------------------

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(() => (key: string) => key),
}));

vi.mock("@/lib/constants/offices", () => ({
  offices: [{ name: "RE/MAX Altitud", whatsapp: "50627710000" }],
  buildWhatsAppUrl: vi.fn(
    (office: { whatsapp: string }, msg?: string) =>
      `https://wa.me/${office.whatsapp}${msg ? "?text=" + encodeURIComponent(msg) : ""}`,
  ),
}));

// ---------------------------------------------------------------------------
// Component under test — imported AFTER mocks
// ---------------------------------------------------------------------------

// THIS IMPORT WILL FAIL PARTIALLY — no-results-state.tsx exists but does NOT
// yet accept a `filters` prop or build a dynamic WhatsApp message.
import { NoResultsState } from "@/components/property/no-results-state";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("NoResultsState — Story 3.8 ATDD (RED PHASE)", () => {
  // -------------------------------------------------------------------------
  // [P0] AC #1: renders root element with data-testid
  // -------------------------------------------------------------------------

  it.skip("[P0] renders data-testid='no-results-state' element", () => {
    // THIS TEST WILL FAIL — no-results-state.tsx does not yet have data-testid
    const { getByTestId } = render(<NoResultsState filters={{}} />);
    expect(getByTestId("no-results-state")).toBeTruthy();
  });

  it.skip("[P0] renders with empty filters {} without throwing", () => {
    // THIS TEST WILL FAIL — NoResultsState does not yet accept a filters prop
    expect(() => render(<NoResultsState filters={{}} />)).not.toThrow();
  });

  // -------------------------------------------------------------------------
  // [P0] AC #2: WhatsApp CTA with correct href
  // -------------------------------------------------------------------------

  it.skip("[P0] WhatsApp href contains wa.me when filters are empty", () => {
    // THIS TEST WILL FAIL — WhatsApp href not yet dynamically built from filters
    const { getByTestId } = render(<NoResultsState filters={{}} />);
    const ctaAnchor = getByTestId("no-results-whatsapp-cta");
    const href = ctaAnchor.getAttribute("href") ?? "";
    expect(href).toContain("wa.me");
  });

  it.skip("[P0] WhatsApp href contains filter criteria when type is set", () => {
    // THIS TEST WILL FAIL — filters prop not yet accepted
    const { getByTestId } = render(<NoResultsState filters={{ type: "Casa" }} />);
    const ctaAnchor = getByTestId("no-results-whatsapp-cta");
    const href = ctaAnchor.getAttribute("href") ?? "";
    // The encoded message must mention the property type
    expect(decodeURIComponent(href)).toContain("Casa");
  });

  it.skip("[P0] WhatsApp href contains price when priceMin is set", () => {
    // THIS TEST WILL FAIL — filters prop not yet accepted
    const { getByTestId } = render(
      <NoResultsState filters={{ priceMin: 150000 }} />,
    );
    const ctaAnchor = getByTestId("no-results-whatsapp-cta");
    const href = ctaAnchor.getAttribute("href") ?? "";
    // The encoded message must mention the price
    expect(decodeURIComponent(href)).toContain("150");
  });

  it.skip("[P0] forwards multiple filter criteria — type + bedrooms + area", () => {
    // THIS TEST WILL FAIL — filters prop not yet accepted
    const { getByTestId } = render(
      <NoResultsState
        filters={{ type: "Casa", bedrooms: 3, areaSlug: "perez-zeledon" }}
      />,
    );
    const ctaAnchor = getByTestId("no-results-whatsapp-cta");
    const href = ctaAnchor.getAttribute("href") ?? "";
    const decoded = decodeURIComponent(href);
    expect(decoded).toContain("Casa");
    expect(decoded).toContain("3");
    expect(decoded).toContain("perez-zeledon");
  });

  // -------------------------------------------------------------------------
  // [P1] AC #1, #2: secondary action anchor has correct data-testid
  // -------------------------------------------------------------------------

  it.skip(
    "[P1] renders data-testid='no-results-whatsapp-cta' on secondary action anchor",
    () => {
      // THIS TEST WILL FAIL — data-testid not yet present on anchor
      const { getByTestId } = render(<NoResultsState filters={{}} />);
      const anchor = getByTestId("no-results-whatsapp-cta");
      expect(anchor.tagName.toLowerCase()).toBe("a");
    },
  );
});
