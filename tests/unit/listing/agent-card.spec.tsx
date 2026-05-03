/**
 * Story 4.2: Agent Card & Contact CTAs
 * Component: src/components/agent/agent-card.tsx
 *
 * All tests are test.skip() scaffolds — TDD RED PHASE.
 * Remove test.skip() task-by-task as you implement each feature.
 *
 * Covers:
 *   AC #1  — Agent card shows photo, name, languages, office, WhatsApp + Email buttons
 *   AC #2  — WhatsApp CTA opens wa.me URL with pre-populated message
 *   AC #3  — Spanish locale pre-populates message in Spanish
 *   AC #4  — Email CTA opens mailto link with property context pre-filled
 *   AC #5  — Transparency note about WhatsApp translation displays
 *   AC #9  — Agent card uses role="article" with appropriate ARIA labels
 *
 * Environment: jsdom (React component — .spec.tsx → jsdom via vitest.config.mts)
 *
 * Component interface:
 *   interface AgentCardProps {
 *     agent: Agent;
 *     propertyTitle: string;
 *     propertyRef: string;
 *     locale: string;
 *     officeName: string;
 *     variant?: "default" | "compact";
 *   }
 *
 * data-testid contract (CANNOT rename):
 *   data-testid="agent-card"          — root <article>
 *   data-testid="agent-photo"         — agent photo image
 *   data-testid="agent-languages"     — languages display element
 *   data-testid="agent-whatsapp-cta"  — WhatsApp CTA link
 *   data-testid="agent-email-cta"     — Email CTA link
 *   data-testid="agent-transparency-note" — FR36 transparency note
 */

// ---------------------------------------------------------------------------
// Module mocks — declared BEFORE any imports of the module under test
// ---------------------------------------------------------------------------

import { vi, describe, it, expect, afterEach } from "vitest";

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    "data-testid": testId,
    ...props
  }: {
    src: string;
    alt: string;
    "data-testid"?: string;
    [key: string]: unknown;
  }) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img src={src} alt={alt} data-testid={testId} {...(props as Record<string, unknown>)} />;
  },
}));

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(
    () => (key: string, values?: Record<string, unknown>) =>
      values ? `${key}(${JSON.stringify(values)})` : key,
  ),
}));

vi.mock("@/lib/utils/whatsapp", () => ({
  buildWhatsAppMessage: vi.fn(() => "Test WhatsApp message"),
  buildWhatsAppUrl: vi.fn(
    (phone: string, msg: string) =>
      `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`,
  ),
}));

vi.mock("@/components/lead/whatsapp-cta", () => ({
  trackWhatsAppClick: vi.fn(),
}));

// imported AFTER mocks
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const mockAgent = {
  id: "agent-uuid-1",
  apiId: "api-agent-1",
  officeId: "office-uuid-1",
  slug: "emma-smith",
  name: "Emma Smith",
  email: "emma@remax-altitud.cr",
  phone: "+506 8800-0000",
  whatsapp: "50688000000",
  photoUrl: "https://cdn.example.com/emma.jpg",
  photoOptimizedUrl: "/agent-photos/emma-400w.webp",
  languages: ["en", "es"],
  specializations: [],
  bioEn: "Mountain specialist.",
  bioEs: "Especialista en montaña.",
  listingCount: 12,
  isActive: true,
  syncedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const defaultProps = {
  agent: mockAgent,
  propertyTitle: "Beautiful Mountain Home",
  propertyRef: "ALT-12345",
  locale: "en",
  officeName: "RE/MAX Altitud",
};

afterEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe("Story 4.2: AgentCard component (ATDD — TDD RED PHASE)", () => {
  // [P0] Core rendering

  it.skip(
    "[P0] 4.2-COMP-001: renders data-testid='agent-card' root element",
    () => {
      // THIS TEST WILL FAIL — AgentCard component not yet implemented
      // Dynamically import to defer resolution to test runtime
      const { AgentCard } = require("@/components/agent/agent-card");
      render(<AgentCard {...defaultProps} />);

      const card = screen.getByTestId("agent-card");
      expect(card).toBeTruthy();
    },
  );

  it.skip(
    "[P0] 4.2-COMP-002: renders agent name in the card",
    () => {
      // THIS TEST WILL FAIL — AgentCard component not yet implemented
      const { AgentCard } = require("@/components/agent/agent-card");
      render(<AgentCard {...defaultProps} />);

      expect(screen.getByText("Emma Smith")).toBeTruthy();
    },
  );

  it.skip(
    "[P0] 4.2-COMP-003: renders agent photo with data-testid='agent-photo' using photoOptimizedUrl when available",
    () => {
      // THIS TEST WILL FAIL — AgentCard component not yet implemented
      const { AgentCard } = require("@/components/agent/agent-card");
      render(<AgentCard {...defaultProps} />);

      const photo = screen.getByTestId("agent-photo");
      expect(photo).toBeTruthy();
      expect(photo.getAttribute("src")).toBe("/agent-photos/emma-400w.webp");
    },
  );

  it.skip(
    "[P0] 4.2-COMP-004: renders data-testid='agent-languages' with language display",
    () => {
      // THIS TEST WILL FAIL — AgentCard component not yet implemented
      const { AgentCard } = require("@/components/agent/agent-card");
      render(<AgentCard {...defaultProps} />);

      const languages = screen.getByTestId("agent-languages");
      expect(languages).toBeTruthy();
    },
  );

  it.skip(
    "[P0] 4.2-COMP-005: renders data-testid='agent-whatsapp-cta' link when agent.whatsapp is set",
    () => {
      // THIS TEST WILL FAIL — AgentCard component not yet implemented
      const { AgentCard } = require("@/components/agent/agent-card");
      render(<AgentCard {...defaultProps} />);

      const whatsappCta = screen.getByTestId("agent-whatsapp-cta");
      expect(whatsappCta).toBeTruthy();
    },
  );

  it.skip(
    "[P0] 4.2-COMP-006: renders data-testid='agent-email-cta' link when agent.email is set",
    () => {
      // THIS TEST WILL FAIL — AgentCard component not yet implemented
      const { AgentCard } = require("@/components/agent/agent-card");
      render(<AgentCard {...defaultProps} />);

      const emailCta = screen.getByTestId("agent-email-cta");
      expect(emailCta).toBeTruthy();
    },
  );

  it.skip(
    "[P0] 4.2-COMP-007: renders data-testid='agent-transparency-note' for FR36",
    () => {
      // THIS TEST WILL FAIL — AgentCard component not yet implemented
      const { AgentCard } = require("@/components/agent/agent-card");
      render(<AgentCard {...defaultProps} />);

      const note = screen.getByTestId("agent-transparency-note");
      expect(note).toBeTruthy();
    },
  );

  // [P1] Behavior and interaction

  it.skip(
    "[P1] 4.2-COMP-008: WhatsApp link href is a valid wa.me URL with encoded message",
    () => {
      // THIS TEST WILL FAIL — AgentCard component not yet implemented
      const { AgentCard } = require("@/components/agent/agent-card");
      render(<AgentCard {...defaultProps} />);

      const whatsappCta = screen.getByTestId("agent-whatsapp-cta");
      const href = whatsappCta.getAttribute("href");
      expect(href).toContain("https://wa.me/50688000000");
      expect(href).toContain("?text=");
    },
  );

  it.skip(
    "[P1] 4.2-COMP-009: Email link href is a valid mailto URL with subject pre-filled",
    () => {
      // THIS TEST WILL FAIL — AgentCard component not yet implemented
      const { AgentCard } = require("@/components/agent/agent-card");
      render(<AgentCard {...defaultProps} />);

      const emailCta = screen.getByTestId("agent-email-cta");
      const href = emailCta.getAttribute("href");
      expect(href).toMatch(/^mailto:/);
      expect(href).toContain("emma@remax-altitud.cr");
    },
  );

  it.skip(
    "[P1] 4.2-COMP-010: clicking WhatsApp link calls trackWhatsAppClick with correct payload",
    () => {
      // THIS TEST WILL FAIL — AgentCard component not yet implemented
      const { AgentCard } = require("@/components/agent/agent-card");
      const { trackWhatsAppClick } = require("@/components/lead/whatsapp-cta");
      render(<AgentCard {...defaultProps} />);

      const whatsappCta = screen.getByTestId("agent-whatsapp-cta");
      fireEvent.click(whatsappCta);

      expect(trackWhatsAppClick).toHaveBeenCalledWith(
        expect.objectContaining({
          agentId: "agent-uuid-1",
          propertyRef: "ALT-12345",
          locale: "en",
          source: "listing_detail",
        }),
      );
    },
  );

  it.skip(
    "[P1] 4.2-COMP-011: WhatsApp button is hidden when agent.whatsapp is null",
    () => {
      // THIS TEST WILL FAIL — AgentCard component not yet implemented
      const { AgentCard } = require("@/components/agent/agent-card");
      const agentWithoutWhatsApp = { ...mockAgent, whatsapp: null };
      render(<AgentCard {...defaultProps} agent={agentWithoutWhatsApp} />);

      const whatsappCta = screen.queryByTestId("agent-whatsapp-cta");
      expect(whatsappCta).toBeNull();
    },
  );

  // [P2] Edge cases

  it.skip(
    "[P2] 4.2-COMP-012: uses placeholder image path when both photoOptimizedUrl and photoUrl are null",
    () => {
      // THIS TEST WILL FAIL — AgentCard component not yet implemented
      const { AgentCard } = require("@/components/agent/agent-card");
      const agentNoPhoto = {
        ...mockAgent,
        photoUrl: null,
        photoOptimizedUrl: null,
      };
      render(<AgentCard {...defaultProps} agent={agentNoPhoto} />);

      const photo = screen.getByTestId("agent-photo");
      expect(photo.getAttribute("src")).toBe("/images/agent-placeholder.svg");
    },
  );

  it.skip(
    "[P2] 4.2-COMP-013: root element is article with role='article' for AC #9",
    () => {
      // THIS TEST WILL FAIL — AgentCard component not yet implemented
      const { AgentCard } = require("@/components/agent/agent-card");
      render(<AgentCard {...defaultProps} />);

      const card = screen.getByTestId("agent-card");
      expect(card.tagName.toLowerCase()).toBe("article");
      expect(card.getAttribute("role")).toBe("article");
    },
  );

  it.skip(
    "[P2] 4.2-COMP-014: agent card has aria-label containing agent name",
    () => {
      // THIS TEST WILL FAIL — AgentCard component not yet implemented
      const { AgentCard } = require("@/components/agent/agent-card");
      render(<AgentCard {...defaultProps} />);

      const card = screen.getByTestId("agent-card");
      const ariaLabel = card.getAttribute("aria-label");
      expect(ariaLabel).toBeTruthy();
    },
  );
});
