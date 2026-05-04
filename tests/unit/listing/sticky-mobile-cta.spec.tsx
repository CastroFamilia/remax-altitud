/**
 * Story 4.2: Agent Card & Contact CTAs
 * Component: src/components/lead/sticky-mobile-cta.tsx
 *
 * Covers:
 *   AC #6  — Sticky bottom bar (56px) with WhatsApp + Email buttons on mobile
 *   AC #7  — Sticky bar hides when agent card scrolls into viewport (IntersectionObserver)
 *
 * Environment: jsdom (React component — .spec.tsx → jsdom via vitest.config.mts)
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

vi.mock("@/lib/utils/utm", () => ({
  extractUtmParams: vi.fn(() => ({})),
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
import { render, screen, cleanup } from "@testing-library/react";
import { StickyMobileCTA } from "@/components/lead/sticky-mobile-cta";

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const defaultProps = {
  agentId: "agent-uuid-1",
  agentWhatsapp: "50688000000",
  agentEmail: "agent@remax-altitud.cr",
  agentName: "Emma Smith",
  propertyTitle: "Beautiful Mountain Home",
  propertyRef: "ALT-12345",
  locale: "en",
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe("Story 4.2: StickyMobileCTA component", () => {
  // [P0] Core rendering

  it("[P0] 4.2-STICKY-001: renders data-testid='sticky-mobile-cta' container", () => {
    render(<StickyMobileCTA {...defaultProps} />);
    const stickyBar = screen.getByTestId("sticky-mobile-cta");
    expect(stickyBar).toBeTruthy();
  });

  it("[P0] 4.2-STICKY-002: sticky bar initially hidden (translate-y-full class) before IntersectionObserver fires", () => {
    // IntersectionObserver hasn't fired yet, so bar should be translate-y-full (off-screen)
    render(<StickyMobileCTA {...defaultProps} />);
    const stickyBar = screen.getByTestId("sticky-mobile-cta");
    expect(stickyBar.className).toContain("translate-y-full");
  });

  // [P1] Conditional rendering

  it("[P1] 4.2-STICKY-003: shows WhatsApp button when agentWhatsapp is provided", () => {
    render(<StickyMobileCTA {...defaultProps} />);
    // The bar starts off-screen with aria-hidden=true, so links are hidden
    // from the accessibility tree. Use { hidden: true } to include them.
    const whatsappLinks = screen
      .getAllByRole("link", { hidden: true })
      .filter((el) => el.getAttribute("href")?.includes("wa.me"));
    expect(whatsappLinks.length).toBeGreaterThan(0);
  });

  it("[P1] 4.2-STICKY-004: shows Email button when agentEmail is provided", () => {
    render(<StickyMobileCTA {...defaultProps} />);
    const emailLinks = screen
      .getAllByRole("link", { hidden: true })
      .filter((el) => el.getAttribute("href")?.startsWith("mailto:"));
    expect(emailLinks.length).toBeGreaterThan(0);
  });

  it("[P1] 4.2-STICKY-005: hides WhatsApp button when agentWhatsapp is null", () => {
    render(<StickyMobileCTA {...defaultProps} agentWhatsapp={null} />);
    const allLinks = screen.queryAllByRole("link", { hidden: true });
    const whatsappLinks = allLinks.filter((el) =>
      el.getAttribute("href")?.includes("wa.me"),
    );
    expect(whatsappLinks.length).toBe(0);
  });

  it("[P1] 4.2-STICKY-006: hides Email button when agentEmail is null", () => {
    render(<StickyMobileCTA {...defaultProps} agentEmail={null} />);
    const allLinks = screen.queryAllByRole("link", { hidden: true });
    const emailLinks = allLinks.filter((el) =>
      el.getAttribute("href")?.startsWith("mailto:"),
    );
    expect(emailLinks.length).toBe(0);
  });

  // [P2] IntersectionObserver integration

  it("[P2] 4.2-STICKY-007: calls IntersectionObserver.observe on mount when agent-card element is found", () => {
    // Create a mock agent-card element in the document for the observer to find
    const mockAgentCard = document.createElement("div");
    mockAgentCard.setAttribute("data-testid", "agent-card");
    document.body.appendChild(mockAgentCard);

    render(<StickyMobileCTA {...defaultProps} />);

    expect(mockObserve).toHaveBeenCalledWith(mockAgentCard);

    // Cleanup
    document.body.removeChild(mockAgentCard);
  });

  it("[P2] 4.2-STICKY-008: calls IntersectionObserver.disconnect on unmount", () => {
    const { unmount } = render(<StickyMobileCTA {...defaultProps} />);
    unmount();
    expect(mockDisconnect).toHaveBeenCalled();
  });
});
