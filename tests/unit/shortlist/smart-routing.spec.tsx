/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
/**
 * Story 7.4: Direct Listing Agent Routing from Shortlist — Component & Routing Unit Tests
 * Component: src/components/shortlist/shortlist-page-client.tsx
 *
 * Covers:
 *   - WhatsApp opens directly to the single agent when all properties belong to 1 agent.
 *   - Inquiry Modal displays properties grouped by listing agent when multiple agents are present.
 *   - Pre-populated WhatsApp and Email messages contain only the specific agent's properties.
 *   - Background lead capture is triggered with correct fields per agent group.
 *   - Contact form automatically splits properties by agent and triggers parallel lead capture calls.
 *
 * Environment: jsdom (.spec.tsx → jsdom)
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
    contactFormHeading: "Contact an Agent",
    contactFormSubheading: "Your inquiries will be automatically split and sent directly to the listing agents of your saved properties.",
    nameLabel: "Your Full Name",
    namePlaceholder: "Enter your name",
    emailLabel: "Email Address",
    emailPlaceholder: "you@example.com",
    phoneLabel: "Phone / WhatsApp",
    phonePlaceholder: "+506 8888-8888",
    messageLabel: "Personal Message",
    messagePlaceholder: "Tell us about your schedule preference...",
    submitForm: "Send My Shortlist",
    submittingForm: "Sending...",
    successHeading: "Shortlist Sent Successfully!",
    successText: "Your saved property list has been sent.",
    backToShortlist: "Back to My List",
    nameError: "Please enter your name",
    emailError: "Please enter a valid email address",
    phoneError: "Please enter a valid phone number (min. 7 digits)",
    formSubmitError: "Failed to send form. Please try again.",

    // ShortlistRouting
    autoSuggestText: "{name} represents properties you're exploring. Direct contact ensures the fastest planning.",
    contactAgent: "Contact {name}",
    chooseDifferent: "Contact agents individually",
    modalTitle: "Contact Listing Agents",
    educationInterstitial: "🏠 Direct Agent Routing — To coordinate your visits, you will contact each listing agent directly for their properties.",
    languages: "Languages Spoken:",
    listings: "listings",
    contactWhatsApp: "Contact via WhatsApp",
    contactEmail: "Contact via Email",
    whatsappMessageIntro: "Hi {agentName}, I'm interested in these properties you represent from my shortlist:",
    whatsappMessageOutro: "Could we coordinate a visit? Thank you.",
    emailSubject: "Inquiry about your listed properties from my shortlist",
    emailBody: "Hi {agentName},\n\nI am interested in viewing the following saved properties you represent:\n\n{list}\n\nCould we coordinate these visits?\n\nThank you!",
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
  getActiveAgentsList: () => Promise.resolve([]),
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
  default: ({ isOpen, onClose, agentGroups, onContactAgent, onOpenContactForm }: any) => {
    if (!isOpen) return null;
    return (
      <div data-testid="agent-selection-modal">
        <h2>Contact Listing Agents</h2>
        <div>
          🏠 Direct Agent Routing — To coordinate your visits, you will contact each listing agent directly for their properties.
        </div>
        {agentGroups.map((group: any) => {
          const name = group.agent ? group.agent.name : "RE/MAX Altitud";
          return (
            <div key={group.agent?.id || "office"} data-testid={`agent-group-${group.agent?.id || "office"}`}>
              <span>{name}</span>
              <button
                onClick={() => {
                  onContactAgent(group.agent, group.properties, "whatsapp");
                }}
              >
                WhatsApp {name}
              </button>
              <button
                onClick={() => {
                  onContactAgent(group.agent, group.properties, "email");
                }}
              >
                Email {name}
              </button>
            </div>
          );
        })}
      </div>
    );
  },
}));

describe("Story 7.4: Direct Listing Agent Routing Unit Tests", () => {
  let spyOpen: any;
  let spyFetch: any;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    spyOpen = vi.spyOn(window, "open").mockImplementation(() => null);
    spyFetch = vi.spyOn(global, "fetch").mockImplementation(() =>
      Promise.resolve({
        ok: true,
        status: 201,
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

  it("[P0] 7.4-UNIT-001: routes to single agent directly when all shortlisted properties belong to 1 agent", async () => {
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

  it("[P0] 7.4-UNIT-002: opens Inquiry Modal showing properties grouped by agent when multiple listing agents are present", async () => {
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
    const { findByText, getByTestId, getByText } = render(<ShortlistPageClient />);

    const askBtn = await findByText("Ask about these");
    fireEvent.click(askBtn);

    // Should open modal
    await waitFor(() => {
      expect(getByText("Contact Listing Agents")).toBeTruthy();
    });

    // WhatsApp Emma button
    const whatsappEmmaBtn = getByText("WhatsApp Emma");
    fireEvent.click(whatsappEmmaBtn);

    // Should fetch lead capture for Emma's properties only and open Emma's WhatsApp
    await waitFor(() => {
      expect(spyFetch).toHaveBeenCalledOnce();
      expect(spyOpen).toHaveBeenCalledOnce();
    });

    const [fetchUrl, fetchConfig] = spyFetch.mock.calls[0];
    expect(fetchUrl).toContain("/api/leads");
    const body = JSON.parse(fetchConfig.body);
    expect(body.assignedAgentId).toBe("agent-emma");
    expect(body.shortlistPropertyIds).toEqual(["prop-1", "prop-2"]);

    const whatsappUrl = spyOpen.mock.calls[0][0];
    expect(whatsappUrl).toContain("wa.me/50688888888");
    expect(whatsappUrl).toContain(encodeURIComponent("House 1 (Ref: REF-001)"));
    expect(whatsappUrl).toContain(encodeURIComponent("House 2 (Ref: REF-002)"));
    expect(whatsappUrl).not.toContain(encodeURIComponent("House 3"));
  });

  it("[P1] 7.4-UNIT-003: supports email contact fallback per agent group with mailto links", async () => {
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
      { id: "prop-1", titleEn: "House 1", apiId: "REF-001", agentId: "agent-emma", agent: agentEmma },
      { id: "prop-2", titleEn: "House 2", apiId: "REF-002", agentId: "agent-gustavo", agent: agentGustavo },
    ]);

    const { ShortlistPageClient } = await import("@/components/shortlist/shortlist-page-client");
    const { findByText, getByText } = render(<ShortlistPageClient />);

    const askBtn = await findByText("Ask about these");
    fireEvent.click(askBtn);

    // Open Modal and click Email for Gustavo
    await waitFor(() => {
      expect(getByText("Contact Listing Agents")).toBeTruthy();
    });

    const emailGustavoBtn = getByText("Email Gustavo");
    fireEvent.click(emailGustavoBtn);

    await waitFor(() => {
      expect(spyFetch).toHaveBeenCalledOnce();
      expect(spyOpen).toHaveBeenCalledOnce();
    });

    const [fetchUrl, fetchConfig] = spyFetch.mock.calls[0];
    const body = JSON.parse(fetchConfig.body);
    expect(body.assignedAgentId).toBe("agent-gustavo");
    expect(body.shortlistPropertyIds).toEqual(["prop-2"]);
    expect(body.source).toBe("contact_form");

    const mailtoUrl = spyOpen.mock.calls[0][0];
    expect(mailtoUrl).toContain("mailto:gustavo@remax.com");
    expect(mailtoUrl).toContain(encodeURIComponent("Inquiry about your listed properties from my shortlist"));
    expect(mailtoUrl).toContain(encodeURIComponent("House 2 (Ref: REF-002)"));
  });

  it("[P0] 7.4-UNIT-004: unified contact form splits properties by agent and triggers parallel background POST /api/leads", async () => {
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
      { id: "prop-1", titleEn: "House 1", apiId: "REF-001", agentId: "agent-emma", agent: agentEmma },
      { id: "prop-2", titleEn: "House 2", apiId: "REF-002", agentId: "agent-gustavo", agent: agentGustavo },
    ]);

    const { ShortlistPageClient } = await import("@/components/shortlist/shortlist-page-client");
    const { findByText, getByLabelText } = render(<ShortlistPageClient />);

    // Toggle contact form
    const toggleFormBtn = await findByText("Contact via Form");
    fireEvent.click(toggleFormBtn);

    // Fill form fields
    const nameInput = getByLabelText(/Your Full Name/);
    const emailInput = getByLabelText(/Email Address/);
    const phoneInput = getByLabelText(/Phone \/ WhatsApp/);

    fireEvent.change(nameInput, { target: { value: "John Doe" } });
    fireEvent.change(emailInput, { target: { value: "john@example.com" } });
    fireEvent.change(phoneInput, { target: { value: "+50688888888" } });

    const submitBtn = await findByText("Send My Shortlist");
    fireEvent.click(submitBtn);

    // Verify three API requests are triggered (1 for shortlist share link, 2 in parallel for Emma and Gustavo leads)
    await waitFor(() => {
      expect(spyFetch).toHaveBeenCalledTimes(3);
    });

    // The first call is to /api/shortlist
    expect(spyFetch.mock.calls[0][0]).toContain("/api/shortlist");

    // The next two calls are to /api/leads
    expect(spyFetch.mock.calls[1][0]).toContain("/api/leads");
    expect(spyFetch.mock.calls[2][0]).toContain("/api/leads");

    const body1 = JSON.parse(spyFetch.mock.calls[1][1].body);
    const body2 = JSON.parse(spyFetch.mock.calls[2][1].body);

    const agentIds = [body1.assignedAgentId, body2.assignedAgentId];
    expect(agentIds).toContain("agent-emma");
    expect(agentIds).toContain("agent-gustavo");

    const shortlistIds = [body1.shortlistPropertyIds, body2.shortlistPropertyIds];
    expect(shortlistIds).toContainEqual(["prop-1"]);
    expect(shortlistIds).toContainEqual(["prop-2"]);
  });
});
