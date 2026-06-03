/**
 * Story 4.3: Agent Profile Pages — ATDD Red-Phase Scaffold
 * Component: src/components/agent/agent-index-filters.tsx
 *
 * TDD Phase: RED — all tests are test() until the component is implemented.
 * Remove test() per test when implementing to verify green phase.
 *
 * Covers:
 *   AC #3  — Agents can be filtered by office (Altitud / Altitud Cero) and language
 *             on the agents index page (FR38)
 *   AC #4  — Agents index shows all active agents with photo, name, languages, office,
 *             and listing count
 *
 * Test IDs from test-design-epic-4.md:
 *   4.3-E2E-004 — Agents index: filter by office shows only agents from that office
 *   4.3-E2E-005 — Agents index: filter by language shows only agents speaking that language
 *   4.3-COMP-001 — Agent filter state resets correctly when switching between offices (P2, R-013)
 *
 * data-testid contract (CANNOT rename once established — shared with dev-story):
 *   data-testid="agent-index-list"         — <ul> container
 *   data-testid="agent-office-filter"      — office filter select/chips
 *   data-testid="agent-language-filter"    — language filter select/chips
 *   data-testid="agent-index-card"         — each agent card article
 *   data-testid="agent-no-match"           — empty state when filters match nothing
 *
 * Environment: jsdom (React component — .spec.tsx → jsdom via vitest.config.mts)
 */

// ---------------------------------------------------------------------------
// Module mocks — declared BEFORE any imports of the module under test
// vi.mock hoisting rule: ALL vi.mock() calls MUST appear before import statements
// ---------------------------------------------------------------------------

import { vi, describe, it, expect, afterEach } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(
    () =>
      (key: string, values?: Record<string, unknown>) =>
        values ? `${key}(${JSON.stringify(values)})` : key,
  ),
}));

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
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} data-testid={testId} {...(props as Record<string, unknown>)} />;
  },
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
    locale?: string;
  }) => <a href={href}>{children}</a>,
}));

// imported AFTER mocks
import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const mockAgents = [
  {
    id: "a1",
    apiId: "api-1",
    officeId: "office-pz",
    slug: "emma-smith",
    name: "Emma Smith",
    email: null,
    phone: null,
    whatsapp: "50688000000",
    photoUrl: null,
    photoOptimizedUrl: null,
    videoUrl: null,
    languages: ["en", "es"],
    specializations: [],
    bioEn: "",
    bioEs: "",
    listingCount: 5,
    isActive: true,
    syncedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "a2",
    apiId: "api-2",
    officeId: "office-dom",
    slug: "gustavo-valverde",
    name: "Gustavo Valverde",
    email: null,
    phone: null,
    whatsapp: null,
    photoUrl: null,
    photoOptimizedUrl: null,
    videoUrl: null,
    languages: ["es"],
    specializations: [],
    bioEn: "",
    bioEs: "",
    listingCount: 3,
    isActive: true,
    syncedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockOfficeMap: Record<string, string> = {
  "office-pz": "REMAX Altitud",
  "office-dom": "REMAX Altitud Cero",
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Test suite — RED PHASE (all test.skip until AgentIndexFilters is implemented)
// ---------------------------------------------------------------------------

describe("Story 4.3: AgentIndexFilters component (ATDD Red Phase)", () => {
  // [P0] Core rendering

  it("[P0] 4.3-COMP-011: renders data-testid='agent-index-list' element", async () => {
    // THIS TEST WILL FAIL — AgentIndexFilters not yet implemented
    const { AgentIndexFilters } = await import("@/components/agent/agent-index-filters");
    render(
      <AgentIndexFilters
        agents={mockAgents}
        locale="en"
        officeMap={mockOfficeMap}
      />,
    );
    const list = screen.getByTestId("agent-index-list");
    expect(list).toBeTruthy();
  });

  it("[P0] 4.3-COMP-012: renders all agents by default (no filter applied)", async () => {
    // THIS TEST WILL FAIL — AgentIndexFilters not yet implemented
    const { AgentIndexFilters } = await import("@/components/agent/agent-index-filters");
    render(
      <AgentIndexFilters
        agents={mockAgents}
        locale="en"
        officeMap={mockOfficeMap}
      />,
    );
    const cards = screen.getAllByTestId("agent-index-card");
    expect(cards).toHaveLength(2);
  });

  it("[P0] 4.3-COMP-013: renders data-testid='agent-office-filter' control", async () => {
    // THIS TEST WILL FAIL — AgentIndexFilters not yet implemented
    const { AgentIndexFilters } = await import("@/components/agent/agent-index-filters");
    render(
      <AgentIndexFilters
        agents={mockAgents}
        locale="en"
        officeMap={mockOfficeMap}
      />,
    );
    const officeFilter = screen.getByTestId("agent-office-filter");
    expect(officeFilter).toBeTruthy();
  });

  it("[P0] 4.3-COMP-014: renders data-testid='agent-language-filter' control", async () => {
    // THIS TEST WILL FAIL — AgentIndexFilters not yet implemented
    const { AgentIndexFilters } = await import("@/components/agent/agent-index-filters");
    render(
      <AgentIndexFilters
        agents={mockAgents}
        locale="en"
        officeMap={mockOfficeMap}
      />,
    );
    const langFilter = screen.getByTestId("agent-language-filter");
    expect(langFilter).toBeTruthy();
  });

  // [P1] Filter behavior

  it("[P1] 4.3-COMP-015: filters to one agent when office 'office-pz' is selected", async () => {
    // THIS TEST WILL FAIL — AgentIndexFilters not yet implemented
    const { AgentIndexFilters } = await import("@/components/agent/agent-index-filters");
    render(
      <AgentIndexFilters
        agents={mockAgents}
        locale="en"
        officeMap={mockOfficeMap}
      />,
    );
    const officeFilter = screen.getByTestId("agent-office-filter");
    fireEvent.change(officeFilter, { target: { value: "office-pz" } });

    // After filtering by office-pz (REMAX Altitud), only Emma Smith should show
    const cards = screen.getAllByTestId("agent-index-card");
    expect(cards).toHaveLength(1);
    expect(screen.getByText("Emma Smith")).toBeTruthy();
  });

  it("[P1] 4.3-COMP-016: filters to English-speaking agents when language filter 'en' selected", async () => {
    // THIS TEST WILL FAIL — AgentIndexFilters not yet implemented
    const { AgentIndexFilters } = await import("@/components/agent/agent-index-filters");
    render(
      <AgentIndexFilters
        agents={mockAgents}
        locale="en"
        officeMap={mockOfficeMap}
      />,
    );
    const langFilter = screen.getByTestId("agent-language-filter");
    fireEvent.change(langFilter, { target: { value: "en" } });

    // Only Emma Smith speaks English (languages: ["en", "es"])
    const cards = screen.getAllByTestId("agent-index-card");
    expect(cards).toHaveLength(1);
    expect(screen.getByText("Emma Smith")).toBeTruthy();
  });

  it("[P1] 4.3-COMP-017: shows data-testid='agent-no-match' when no agents match combined filters", async () => {
    // THIS TEST WILL FAIL — AgentIndexFilters not yet implemented
    const { AgentIndexFilters } = await import("@/components/agent/agent-index-filters");
    render(
      <AgentIndexFilters
        agents={mockAgents}
        locale="en"
        officeMap={mockOfficeMap}
      />,
    );

    // Select office-dom AND language "en" — Gustavo only speaks "es", no match
    const officeFilter = screen.getByTestId("agent-office-filter");
    fireEvent.change(officeFilter, { target: { value: "office-dom" } });

    const langFilter = screen.getByTestId("agent-language-filter");
    fireEvent.change(langFilter, { target: { value: "en" } });

    const noMatch = screen.getByTestId("agent-no-match");
    expect(noMatch).toBeTruthy();
  });

  it("[P1] 4.3-COMP-018: clearing filters (selecting 'all') restores full agent list", async () => {
    // THIS TEST WILL FAIL — AgentIndexFilters not yet implemented
    const { AgentIndexFilters } = await import("@/components/agent/agent-index-filters");
    render(
      <AgentIndexFilters
        agents={mockAgents}
        locale="en"
        officeMap={mockOfficeMap}
      />,
    );

    // Apply a filter first
    const officeFilter = screen.getByTestId("agent-office-filter");
    fireEvent.change(officeFilter, { target: { value: "office-pz" } });

    // Verify filtered
    expect(screen.getAllByTestId("agent-index-card")).toHaveLength(1);

    // Clear filter
    fireEvent.change(officeFilter, { target: { value: "all" } });

    // Full list restored
    expect(screen.getAllByTestId("agent-index-card")).toHaveLength(2);
  });

  // [P2] Edge cases and agent card rendering

  it("[P2] 4.3-COMP-019: renders data-testid='agent-index-card' for each visible agent", async () => {
    // THIS TEST WILL FAIL — AgentIndexFilters not yet implemented
    const { AgentIndexFilters } = await import("@/components/agent/agent-index-filters");
    render(
      <AgentIndexFilters
        agents={mockAgents}
        locale="en"
        officeMap={mockOfficeMap}
      />,
    );
    const cards = screen.getAllByTestId("agent-index-card");
    expect(cards).toHaveLength(2);
  });

  it("[P2] 4.3-COMP-020: filter state resets correctly when switching between offices (R-013)", async () => {
    // THIS TEST WILL FAIL — AgentIndexFilters not yet implemented
    // Verifies R-013: filter state not cleared on second office selection is NOT a bug
    const { AgentIndexFilters } = await import("@/components/agent/agent-index-filters");
    render(
      <AgentIndexFilters
        agents={mockAgents}
        locale="en"
        officeMap={mockOfficeMap}
      />,
    );

    const officeFilter = screen.getByTestId("agent-office-filter");

    // First selection: office-pz → 1 agent
    fireEvent.change(officeFilter, { target: { value: "office-pz" } });
    expect(screen.getAllByTestId("agent-index-card")).toHaveLength(1);

    // Second selection (switching to): office-dom → 1 different agent
    fireEvent.change(officeFilter, { target: { value: "office-dom" } });
    const cardsAfterSwitch = screen.getAllByTestId("agent-index-card");
    expect(cardsAfterSwitch).toHaveLength(1);
    expect(screen.getByText("Gustavo Valverde")).toBeTruthy();

    // Previous office results (Emma) must NOT still be showing
    expect(screen.queryByText("Emma Smith")).toBeNull();
  });

  // [P1] Edge case — explicit "Clear filters" button restores list (no-match → all)
  // Closes coverage gap surfaced in test review: the clearFilters button click was not asserted.
  it("[P1] 4.3-COMP-021: clicking the 'Clear filters' button from no-match state restores the full list", async () => {
    const { AgentIndexFilters } = await import("@/components/agent/agent-index-filters");
    render(
      <AgentIndexFilters
        agents={mockAgents}
        locale="en"
        officeMap={mockOfficeMap}
      />,
    );

    // Force a no-match state: office-dom + en (Gustavo only speaks es)
    fireEvent.change(screen.getByTestId("agent-office-filter"), {
      target: { value: "office-dom" },
    });
    fireEvent.change(screen.getByTestId("agent-language-filter"), {
      target: { value: "en" },
    });
    expect(screen.getByTestId("agent-no-match")).toBeTruthy();

    // Click the "Clear filters" button rendered inside the no-match panel
    const clearButton = screen.getByRole("button", { name: /clearFilters/ });
    fireEvent.click(clearButton);

    // Full list restored
    expect(screen.queryByTestId("agent-no-match")).toBeNull();
    expect(screen.getAllByTestId("agent-index-card")).toHaveLength(2);
  });

  // [P2] Defensive — passing zero agents must not crash (R-010 parallel for index page)
  it("[P2] 4.3-COMP-022: renders no-match empty state when agents prop is an empty array", async () => {
    const { AgentIndexFilters } = await import("@/components/agent/agent-index-filters");
    render(
      <AgentIndexFilters
        agents={[]}
        locale="en"
        officeMap={mockOfficeMap}
      />,
    );

    // No cards
    expect(screen.queryAllByTestId("agent-index-card")).toHaveLength(0);
    // No-match empty state visible by default (filteredAgents.length === 0)
    expect(screen.getByTestId("agent-no-match")).toBeTruthy();
  });
});
