/**
 * Story 4.2: Agent Card & Contact CTAs
 * Component: src/components/lead/sticky-mobile-cta.tsx
 *
 * All tests are test.skip() scaffolds — TDD RED PHASE.
 * Remove test.skip() task-by-task as you implement each feature.
 *
 * Covers:
 *   AC #6  — Sticky bottom bar (56px) with WhatsApp + Email buttons on mobile
 *   AC #7  — Sticky bar hides when agent card scrolls into viewport (IntersectionObserver)
 *
 * Environment: jsdom (React component — .spec.tsx → jsdom via vitest.config.mts)
 *
 * Component interface:
 *   interface StickyMobileCTAProps {
 *     agentWhatsapp: string | null;
 *     agentEmail: string | null;
 *     agentName: string;
 *     propertyTitle: string;
 *     propertyRef: string;
 *     locale: string;
 *   }
 *
 * data-testid contract (CANNOT rename):
 *   data-testid="sticky-mobile-cta" — container div (fixed bottom bar)
 */

// ---------------------------------------------------------------------------
// Module mocks — declared BEFORE any imports of the module under test
// ---------------------------------------------------------------------------

import { vi, describe, it, expect, afterEach } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(() => (key: string) => key),
}));

vi.mock("@/lib/utils/whatsapp", () => ({
  buildWhatsAppMessage: vi.fn(() => "Test message"),
  buildWhatsAppUrl: vi.fn((phone: string) => `https://wa.me/${phone}`),
}));

vi.mock("@/components/lead/whatsapp-cta", () => ({
  trackWhatsAppClick: vi.fn(),
}));

// Mock IntersectionObserver — not available in jsdom
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();
const mockUnobserve = vi.fn();

vi.stubGlobal(
  "IntersectionObserver",
  vi.fn(() => ({
    observe: mockObserve,
    disconnect: mockDisconnect,
    unobserve: mockUnobserve,
  })),
);

// imported AFTER mocks
import React from "react";
import { render, screen } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const defaultProps = {
  agentWhatsapp: "50688000000",
  agentEmail: "agent@remax-altitud.cr",
  agentName: "Emma Smith",
  propertyTitle: "Beautiful Mountain Home",
  propertyRef: "ALT-12345",
  locale: "en",
};

afterEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe("Story 4.2: StickyMobileCTA component (ATDD — TDD RED PHASE)", () => {
  // [P0] Core rendering

  it.skip(
    "[P0] 4.2-STICKY-001: renders data-testid='sticky-mobile-cta' container",
    () => {
      // THIS TEST WILL FAIL — StickyMobileCTA component not yet implemented
      const { StickyMobileCTA } = require("@/components/lead/sticky-mobile-cta");
      render(<StickyMobileCTA {...defaultProps} />);

      const stickyBar = screen.getByTestId("sticky-mobile-cta");
      expect(stickyBar).toBeTruthy();
    },
  );

  it.skip(
    "[P0] 4.2-STICKY-002: sticky bar initially hidden (translate-y-full class) before IntersectionObserver fires",
    () => {
      // THIS TEST WILL FAIL — StickyMobileCTA component not yet implemented
      // IntersectionObserver hasn't fired yet, so bar should be translate-y-full (off-screen)
      const { StickyMobileCTA } = require("@/components/lead/sticky-mobile-cta");
      render(<StickyMobileCTA {...defaultProps} />);

      const stickyBar = screen.getByTestId("sticky-mobile-cta");
      expect(stickyBar.className).toContain("translate-y-full");
    },
  );

  // [P1] Conditional rendering

  it.skip(
    "[P1] 4.2-STICKY-003: shows WhatsApp button when agentWhatsapp is provided",
    () => {
      // THIS TEST WILL FAIL — StickyMobileCTA component not yet implemented
      const { StickyMobileCTA } = require("@/components/lead/sticky-mobile-cta");
      render(<StickyMobileCTA {...defaultProps} />);

      // WhatsApp CTA should be present when whatsapp number is set
      const whatsappLinks = screen
        .getAllByRole("link")
        .filter((el) => el.getAttribute("href")?.includes("wa.me"));
      expect(whatsappLinks.length).toBeGreaterThan(0);
    },
  );

  it.skip(
    "[P1] 4.2-STICKY-004: shows Email button when agentEmail is provided",
    () => {
      // THIS TEST WILL FAIL — StickyMobileCTA component not yet implemented
      const { StickyMobileCTA } = require("@/components/lead/sticky-mobile-cta");
      render(<StickyMobileCTA {...defaultProps} />);

      // Email CTA should be present when email is set
      const emailLinks = screen
        .getAllByRole("link")
        .filter((el) => el.getAttribute("href")?.startsWith("mailto:"));
      expect(emailLinks.length).toBeGreaterThan(0);
    },
  );

  it.skip(
    "[P1] 4.2-STICKY-005: hides WhatsApp button when agentWhatsapp is null",
    () => {
      // THIS TEST WILL FAIL — StickyMobileCTA component not yet implemented
      const { StickyMobileCTA } = require("@/components/lead/sticky-mobile-cta");
      render(<StickyMobileCTA {...defaultProps} agentWhatsapp={null} />);

      // No wa.me links when whatsapp is null
      const allLinks = screen.queryAllByRole("link");
      const whatsappLinks = allLinks.filter((el) =>
        el.getAttribute("href")?.includes("wa.me"),
      );
      expect(whatsappLinks.length).toBe(0);
    },
  );

  it.skip(
    "[P1] 4.2-STICKY-006: hides Email button when agentEmail is null",
    () => {
      // THIS TEST WILL FAIL — StickyMobileCTA component not yet implemented
      const { StickyMobileCTA } = require("@/components/lead/sticky-mobile-cta");
      render(<StickyMobileCTA {...defaultProps} agentEmail={null} />);

      // No mailto links when email is null
      const allLinks = screen.queryAllByRole("link");
      const emailLinks = allLinks.filter((el) =>
        el.getAttribute("href")?.startsWith("mailto:"),
      );
      expect(emailLinks.length).toBe(0);
    },
  );

  // [P2] IntersectionObserver integration

  it.skip(
    "[P2] 4.2-STICKY-007: calls IntersectionObserver.observe on mount when agent-card element is found",
    () => {
      // THIS TEST WILL FAIL — StickyMobileCTA component not yet implemented
      // Create a mock agent-card element in the document for the observer to find
      const mockAgentCard = document.createElement("div");
      mockAgentCard.setAttribute("data-testid", "agent-card");
      document.body.appendChild(mockAgentCard);

      const { StickyMobileCTA } = require("@/components/lead/sticky-mobile-cta");
      render(<StickyMobileCTA {...defaultProps} />);

      expect(mockObserve).toHaveBeenCalledWith(mockAgentCard);

      // Cleanup
      document.body.removeChild(mockAgentCard);
    },
  );

  it.skip(
    "[P2] 4.2-STICKY-008: calls IntersectionObserver.disconnect on unmount",
    () => {
      // THIS TEST WILL FAIL — StickyMobileCTA component not yet implemented
      const { StickyMobileCTA } = require("@/components/lead/sticky-mobile-cta");
      const { unmount } = render(<StickyMobileCTA {...defaultProps} />);

      unmount();

      expect(mockDisconnect).toHaveBeenCalled();
    },
  );
});
