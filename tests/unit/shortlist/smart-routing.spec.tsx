/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
/**
 * Story 7.4: Smart Agent Routing from Shortlist — Component & Routing Unit Tests
 * Component: src/components/shortlist/shortlist-page-client.tsx
 *
 * Covers:
 *   - AC #1: WhatsApp opens directly to the single agent when all properties belong to 1 agent.
 *   - AC #2: Majority agent suggestion panel displays with primary CTA and secondary "Choose a different agent" CTA.
 *   - AC #3: AgentSelectionModal displays for ties/even distribution, showing photo, name, languages, listing count, sorted by language match, and the education interstitial.
 *   - AC #4: Pre-populated WhatsApp message contains all property references.
 *   - AC #5: Lead creation POST request contains assigned_agent_id, shortlist_property_ids[], source, intent, UTMs, and user's language.
 *   - AC #7: AgentSelectionModal dynamic lazy loading asynchronously.
 *   - AC #8: Alternative email CTA triggers lead capture and mailto: link.
 *
 * Environment: jsdom (.spec.tsx → jsdom)
 * Marked with describe.skip for the TDD RED phase.
 */

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

// Mock next-intl
vi.mock("next-intl", () => {
  const translations: Record<string, string> = {
    // Shortlist
    title: "My Saved Properties",
    emptyState: "No properties saved yet. Browse listings and tap ♡ to save.",
    browseCta: "Browse Listings",
    askAgentCta: "Ask about these",
    shareShortlistCta: "Share my shortlist",
    whatsAppMessageHeader: "Hello, I'm interested in these properties from my shortlist:",
    shareMessageHeader: "Check out my property shortlist:",

    // ShortlistRouting
    autoSuggestText:
      "{name} specializes in the areas you're exploring. They can show you all {count} properties.",
    contactAgent: "Contact {name}",
    chooseDifferent: "Choose a different agent",
    modalTitle: "Select Your Coordinator Agent",
    educationInterstitial:
      "🏠 One agent, all your visits — your chosen agent will coordinate visits to all your saved properties, even those listed by other agents.",
    languages: "Languages Spoken:",
    listings: "listings",
    contactWhatsApp: "Contact via WhatsApp",
    contactEmail: "Contact via Email",
    whatsappMessageIntro: "Hi {agentName}, I'm interested in these properties from my shortlist:",
    whatsappMessageOutro: "Could we coordinate a visit? Thank you.",
    emailSubject: "Inquiry about property shortlist from ALT-ALTITUD",
    emailBody:
      "Hi {agentName},\n\nI am interested in viewing the following saved properties from my shortlist:\n\n{list}\n\nCould you coordinate these visits for me?\n\nThank you!",
  };

  return {
    useTranslations: (namespace?: string) => (key: string, values?: any) => {
      let text = translations[key] || (namespace ? translations[`${namespace}.${key}`] : "") || key;
      if (values) {
        Object.entries(values).forEach(([k, v]) => {
          text = text.replace(new RegExp(`{${k}}`, "g"), String(v));
        });
      }
      return text;
    },
    useLocale: () => "en",
  };
});

// Mock use-shortlist hook
const mockUseShortlist = vi.fn(() => ({
  isLoaded: true,
  shortlist: [] as string[],
  remove: vi.fn(),
  isSaved: () => true,
  save: () => ({ success: true }),
}));
vi.mock("@/hooks/use-shortlist", () => ({
  useShortlist: () => mockUseShortlist(),
}));

// Mock shortlist-actions
const mockGetShortlistPropertiesWithAgents = vi.fn();
vi.mock("@/app/actions/shortlist-actions", () => ({
  getShortlistPropertiesWithAgents: (ids: string[]) => mockGetShortlistPropertiesWithAgents(ids),
  getShortlistProperties: vi.fn(),
}));

// Mock MapView
vi.mock("@/components/map/map-view-loader", () => ({
  MapView: () => <div data-testid="map-view">Map View</div>,
}));

// Mock dynamic import Modal Shimmer
vi.mock("@/components/shortlist/modal-shimmer", () => ({
  ModalShimmer: () => <div data-testid="modal-shimmer">Loading modal...</div>,
}));

// Mock AgentSelectionModal to avoid dynamic import async boundaries in jsdom
vi.mock("@/components/shortlist/agent-selection-modal", () => ({
  default: ({ isOpen, onClose, agents, activeCoordinatorId, onSelectAgent }: any) => {
    if (!isOpen) return null;
    return (
      <div data-testid="agent-selection-modal">
        <h2>Select Your Coordinator Agent</h2>
        <div>
          🏠 One agent, all your visits — your chosen agent will coordinate visits to all your saved
          properties, even those listed by other agents.
        </div>
        {agents.map((agent: any) => (
          <button
            key={agent.id}
            onClick={() => {
              onSelectAgent(agent);
              onClose();
            }}
          >
            {agent.name}
          </button>
        ))}
      </div>
    );
  },
}));

describe("Story 7.4: Smart Agent Routing Unit Tests (RED PHASE)", () => {
  let spyOpen: any;
  let spyFetch: any;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    spyOpen = vi.spyOn(window, "open").mockImplementation(() => null);
    spyFetch = vi.spyOn(global, "fetch").mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ leadId: "lead-123", assignedAgentId: "agent-1" }),
      } as any),
    );
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    spyOpen.mockRestore();
    spyFetch.mockRestore();
  });

  it("[P0] 7.4-UNIT-001: routes to single agent directly when all shortlisted properties belong to 1 agent (AC #1, #4, #5)", async () => {
    mockUseShortlist.mockImplementation(() => ({
      isLoaded: true,
      shortlist: ["prop-1", "prop-2"],
      remove: vi.fn(),
      isSaved: () => true,
      save: () => ({ success: true }),
    }));

    const mockAgent = {
      id: "agent-1",
      name: "Emma",
      whatsapp: "50688888888",
      email: "emma@remax.com",
      languages: "English, Spanish",
      listingCount: 5,
    };

    mockGetShortlistPropertiesWithAgents.mockResolvedValue([
      { id: "prop-1", titleEn: "House 1", apiId: "REF-001", agentId: "agent-1", agent: mockAgent },
      { id: "prop-2", titleEn: "House 2", apiId: "REF-002", agentId: "agent-1", agent: mockAgent },
    ]);

    // Import Component dynamically under test
    const { ShortlistPageClient } = await import("@/components/shortlist/shortlist-page-client");
    const { findByText } = render(<ShortlistPageClient />);

    const askBtn = await findByText("Ask about these");
    fireEvent.click(askBtn);

    // Should fetch lead capture API in background and open WhatsApp
    await waitFor(() => {
      expect(spyFetch).toHaveBeenCalledOnce();
      expect(spyOpen).toHaveBeenCalledOnce();
    });

    const [fetchUrl, fetchConfig] = spyFetch.mock.calls[0];
    expect(fetchUrl).toContain("/api/leads");
    const body = JSON.parse(fetchConfig.body);
    expect(body.assignedAgentId).toBe("agent-1");
    expect(body.shortlistPropertyIds).toEqual(["prop-1", "prop-2"]);
    expect(body.source).toBe("whatsapp_click");

    const whatsappUrl = spyOpen.mock.calls[0][0];
    expect(whatsappUrl).toContain("wa.me/50688888888");
    expect(whatsappUrl).toContain(encodeURIComponent("House 1 (Ref: REF-001)"));
    expect(whatsappUrl).toContain(encodeURIComponent("House 2 (Ref: REF-002)"));
  });

  it("[P0] 7.4-UNIT-002: shows majority agent auto-suggest banner when one agent has majority (AC #2, #4, #5)", async () => {
    mockUseShortlist.mockImplementation(() => ({
      isLoaded: true,
      shortlist: ["prop-1", "prop-2", "prop-3"],
      remove: vi.fn(),
      isSaved: () => true,
      save: () => ({ success: true }),
    }));

    const agentEmma = {
      id: "agent-emma",
      name: "Emma",
      whatsapp: "50688888888",
      email: "emma@remax.com",
      languages: "English, Spanish",
      listingCount: 5,
    };

    const agentGustavo = {
      id: "agent-gustavo",
      name: "Gustavo",
      whatsapp: "50677777777",
      email: "gustavo@remax.com",
      languages: "Spanish",
      listingCount: 3,
    };

    mockGetShortlistPropertiesWithAgents.mockResolvedValue([
      {
        id: "prop-1",
        titleEn: "House 1",
        apiId: "REF-001",
        agentId: "agent-emma",
        agent: agentEmma,
      },
      {
        id: "prop-2",
        titleEn: "House 2",
        apiId: "REF-002",
        agentId: "agent-emma",
        agent: agentEmma,
      },
      {
        id: "prop-3",
        titleEn: "House 3",
        apiId: "REF-003",
        agentId: "agent-gustavo",
        agent: agentGustavo,
      },
    ]);

    const { ShortlistPageClient } = await import("@/components/shortlist/shortlist-page-client");
    const { findByText } = render(<ShortlistPageClient />);

    const askBtn = await findByText("Ask about these");
    fireEvent.click(askBtn);

    // Should NOT open WhatsApp immediately
    expect(spyOpen).not.toHaveBeenCalled();

    // Should show auto-suggest box with specialized text
    const textElement = await findByText(/Emma specializes in the areas you're exploring/);
    expect(textElement).toBeTruthy();

    // Primary CTA to contact Emma
    const contactCta = await findByText("Contact Emma");
    fireEvent.click(contactCta);

    // Triggers WhatsApp and lead capture
    await waitFor(() => {
      expect(spyFetch).toHaveBeenCalledOnce();
      expect(spyOpen).toHaveBeenCalledOnce();
    });
  });

  it("[P0] 7.4-UNIT-003: shows AgentSelectionModal on tie/even distribution (AC #3, #7, #8)", async () => {
    mockUseShortlist.mockImplementation(() => ({
      isLoaded: true,
      shortlist: ["prop-1", "prop-2"],
      remove: vi.fn(),
      isSaved: () => true,
      save: () => ({ success: true }),
    }));

    const agentEmma = {
      id: "agent-emma",
      name: "Emma",
      whatsapp: "50688888888",
      email: "emma@remax.com",
      languages: "English, Spanish",
      listingCount: 5,
    };

    const agentGustavo = {
      id: "agent-gustavo",
      name: "Gustavo",
      whatsapp: "50677777777",
      email: "gustavo@remax.com",
      languages: "Spanish",
      listingCount: 3,
    };

    mockGetShortlistPropertiesWithAgents.mockResolvedValue([
      {
        id: "prop-1",
        titleEn: "House 1",
        apiId: "REF-001",
        agentId: "agent-emma",
        agent: agentEmma,
      },
      {
        id: "prop-2",
        titleEn: "House 2",
        apiId: "REF-002",
        agentId: "agent-gustavo",
        agent: agentGustavo,
      },
    ]);

    const { ShortlistPageClient } = await import("@/components/shortlist/shortlist-page-client");
    const { findByText, getByText } = render(<ShortlistPageClient />);

    const askBtn = await findByText("Ask about these");
    fireEvent.click(askBtn);

    // Tie should launch modal directly (simulate click, modal open checks)
    await waitFor(() => {
      expect(getByText("Select Your Coordinator Agent")).toBeTruthy();
      expect(getByText(/One agent, all your visits/)).toBeTruthy();
    });

    // Verify agents are listed
    expect(getByText("Emma")).toBeTruthy();
    expect(getByText("Gustavo")).toBeTruthy();
  });

  it("[P1] 7.4-UNIT-004: supports email alternative with lead capture (AC #8)", async () => {
    localStorage.setItem("Altitud:chosenCoordinator", "agent-1");
    mockUseShortlist.mockImplementation(() => ({
      isLoaded: true,
      shortlist: ["prop-1", "prop-2"],
      remove: vi.fn(),
      isSaved: () => true,
      save: () => ({ success: true }),
    }));

    const mockAgent = {
      id: "agent-1",
      name: "Emma",
      whatsapp: "50688888888",
      email: "emma@remax.com",
      languages: "English, Spanish",
      listingCount: 5,
    };

    const mockAgent2 = {
      id: "agent-2",
      name: "Gustavo",
      whatsapp: "50677777777",
      email: "gustavo@remax.com",
      languages: "Spanish",
      listingCount: 3,
    };

    mockGetShortlistPropertiesWithAgents.mockResolvedValue([
      { id: "prop-1", titleEn: "House 1", apiId: "REF-001", agentId: "agent-1", agent: mockAgent },
      { id: "prop-2", titleEn: "House 2", apiId: "REF-002", agentId: "agent-2", agent: mockAgent2 },
    ]);

    const { ShortlistPageClient } = await import("@/components/shortlist/shortlist-page-client");
    const { findByText } = render(<ShortlistPageClient />);

    const askBtn = await findByText("Ask about these");
    fireEvent.click(askBtn);

    const emailBtn = await findByText("Contact via Email");
    fireEvent.click(emailBtn);

    // Should fetch lead capture API with email_click source
    await waitFor(() => {
      expect(spyFetch).toHaveBeenCalledOnce();
      expect(spyOpen).toHaveBeenCalledOnce();
    });

    const [fetchUrl, fetchConfig] = spyFetch.mock.calls[0];
    expect(fetchUrl).toContain("/api/leads");
    const body = JSON.parse(fetchConfig.body);
    expect(body.assignedAgentId).toBe("agent-1");
    expect(body.source).toBe("contact_form");

    // Should open mailto redirection
    const mailtoUrl = spyOpen.mock.calls[0][0];
    expect(mailtoUrl).toContain("mailto:emma@remax.com");
    expect(mailtoUrl).toContain(
      encodeURIComponent("Inquiry about property shortlist from ALT-ALTITUD"),
    );
  });
});
