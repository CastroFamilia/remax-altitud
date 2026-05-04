/**
 * Story 4.3: Agent Profile Pages — ATDD Red-Phase Scaffold
 * Component: src/components/agent/agent-profile-hero.tsx
 *
 * TDD Phase: RED — all tests are test() until the component is implemented.
 * Remove test() per test when implementing to verify green phase.
 *
 * Covers:
 *   AC #1  — Agent profile page displays photo, name, bio (bilingual), languages, office,
 *             listing count, WhatsApp + Email CTAs (FR37)
 *   AC #5  — Agent profile URLs load as shareable, standalone pages with full context
 *
 * Test IDs from test-design-epic-4.md:
 *   4.3-UNIT-002 — Agent profile renders gracefully with empty listings array
 *   4.3-COMP-001 — Agent filter state resets correctly (indirectly validated via hero isolation)
 *
 * data-testid contract (CANNOT rename once established — shared with dev-story):
 *   data-testid="agent-profile-hero"         — root <section>
 *   data-testid="agent-profile-photo"        — agent photo (next/image)
 *   data-testid="agent-profile-languages"    — languages display
 *   data-testid="agent-profile-listing-count"— listing count
 *
 * Environment: jsdom (React component — .spec.tsx → jsdom via vitest.config.mts)
 */

// ---------------------------------------------------------------------------
// Module mocks — declared BEFORE any imports of the module under test
// vi.mock hoisting rule: ALL vi.mock() calls MUST appear before import statements
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
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} data-testid={testId} {...(props as Record<string, unknown>)} />;
  },
}));

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(() =>
    Promise.resolve(
      (key: string, values?: Record<string, unknown>) =>
        values ? `${key}(${JSON.stringify(values)})` : key,
    ),
  ),
}));

vi.mock("@/components/agent/agent-profile-ctas", () => ({
  AgentProfileCTAs: vi.fn(({ agentName }: { agentName: string }) => (
    <div data-testid="agent-profile-ctas-mock">{agentName}</div>
  )),
}));

// imported AFTER mocks
import React from "react";
import { render, screen, cleanup } from "@testing-library/react";

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
  bioEn: "Mountain specialist with 10 years experience.",
  bioEs: "Especialista en montaña con 10 años de experiencia.",
  listingCount: 12,
  isActive: true,
  syncedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Test suite — RED PHASE (all test.skip until AgentProfileHero is implemented)
// ---------------------------------------------------------------------------

describe("Story 4.3: AgentProfileHero component (ATDD Red Phase)", () => {
  // [P0] Core rendering

  it("[P0] 4.3-COMP-001: renders data-testid='agent-profile-hero' root element", async () => {
    // THIS TEST WILL FAIL — AgentProfileHero not yet implemented
    const { AgentProfileHero } = await import("@/components/agent/agent-profile-hero");
    const { container } = render(
      await (AgentProfileHero as unknown as (props: {
        agent: typeof mockAgent;
        officeName: string;
        locale: string;
      }) => Promise<React.ReactElement>)({
        agent: mockAgent,
        officeName: "RE/MAX Altitud",
        locale: "en",
      }),
    );
    void container;
    const hero = screen.getByTestId("agent-profile-hero");
    expect(hero).toBeTruthy();
  });

  it("[P0] 4.3-COMP-002: renders agent name as h1 heading", async () => {
    // THIS TEST WILL FAIL — AgentProfileHero not yet implemented
    const { AgentProfileHero } = await import("@/components/agent/agent-profile-hero");
    render(
      await (AgentProfileHero as unknown as (props: {
        agent: typeof mockAgent;
        officeName: string;
        locale: string;
      }) => Promise<React.ReactElement>)({
        agent: mockAgent,
        officeName: "RE/MAX Altitud",
        locale: "en",
      }),
    );
    // Agent name must be h1 (primary page heading per AC #1)
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toBeTruthy();
    expect(heading.textContent).toContain("Emma Smith");
  });

  it("[P0] 4.3-COMP-003: renders data-testid='agent-profile-photo' with photoOptimizedUrl", async () => {
    // THIS TEST WILL FAIL — AgentProfileHero not yet implemented
    const { AgentProfileHero } = await import("@/components/agent/agent-profile-hero");
    render(
      await (AgentProfileHero as unknown as (props: {
        agent: typeof mockAgent;
        officeName: string;
        locale: string;
      }) => Promise<React.ReactElement>)({
        agent: mockAgent,
        officeName: "RE/MAX Altitud",
        locale: "en",
      }),
    );
    const photo = screen.getByTestId("agent-profile-photo");
    expect(photo).toBeTruthy();
    expect(photo.getAttribute("src")).toBe("/agent-photos/emma-400w.webp");
  });

  it("[P0] 4.3-COMP-004: renders data-testid='agent-profile-languages' element", async () => {
    // THIS TEST WILL FAIL — AgentProfileHero not yet implemented
    const { AgentProfileHero } = await import("@/components/agent/agent-profile-hero");
    render(
      await (AgentProfileHero as unknown as (props: {
        agent: typeof mockAgent;
        officeName: string;
        locale: string;
      }) => Promise<React.ReactElement>)({
        agent: mockAgent,
        officeName: "RE/MAX Altitud",
        locale: "en",
      }),
    );
    const languages = screen.getByTestId("agent-profile-languages");
    expect(languages).toBeTruthy();
  });

  it("[P0] 4.3-COMP-005: renders data-testid='agent-profile-listing-count' with count", async () => {
    // THIS TEST WILL FAIL — AgentProfileHero not yet implemented
    const { AgentProfileHero } = await import("@/components/agent/agent-profile-hero");
    render(
      await (AgentProfileHero as unknown as (props: {
        agent: typeof mockAgent;
        officeName: string;
        locale: string;
      }) => Promise<React.ReactElement>)({
        agent: mockAgent,
        officeName: "RE/MAX Altitud",
        locale: "en",
      }),
    );
    const listingCount = screen.getByTestId("agent-profile-listing-count");
    expect(listingCount).toBeTruthy();
    // Must contain the numeric count somewhere in the element text
    expect(listingCount.textContent).toContain("12");
  });

  // [P1] Locale and bio behavior

  it("[P1] 4.3-COMP-006: renders English bio (bioEn) when locale is 'en'", async () => {
    // THIS TEST WILL FAIL — AgentProfileHero not yet implemented
    const { AgentProfileHero } = await import("@/components/agent/agent-profile-hero");
    render(
      await (AgentProfileHero as unknown as (props: {
        agent: typeof mockAgent;
        officeName: string;
        locale: string;
      }) => Promise<React.ReactElement>)({
        agent: mockAgent,
        officeName: "RE/MAX Altitud",
        locale: "en",
      }),
    );
    expect(screen.getByText("Mountain specialist with 10 years experience.")).toBeTruthy();
  });

  it("[P1] 4.3-COMP-007: renders Spanish bio (bioEs) when locale is 'es'", async () => {
    // THIS TEST WILL FAIL — AgentProfileHero not yet implemented
    const { AgentProfileHero } = await import("@/components/agent/agent-profile-hero");
    render(
      await (AgentProfileHero as unknown as (props: {
        agent: typeof mockAgent;
        officeName: string;
        locale: string;
      }) => Promise<React.ReactElement>)({
        agent: mockAgent,
        officeName: "RE/MAX Altitud",
        locale: "es",
      }),
    );
    expect(
      screen.getByText("Especialista en montaña con 10 años de experiencia."),
    ).toBeTruthy();
  });

  it("[P1] 4.3-COMP-008: does NOT render bio paragraph when bioEn is empty string", async () => {
    // THIS TEST WILL FAIL — AgentProfileHero not yet implemented
    const agentNoBio = { ...mockAgent, bioEn: "", bioEs: "" };
    const { AgentProfileHero } = await import("@/components/agent/agent-profile-hero");
    render(
      await (AgentProfileHero as unknown as (props: {
        agent: typeof agentNoBio;
        officeName: string;
        locale: string;
      }) => Promise<React.ReactElement>)({
        agent: agentNoBio,
        officeName: "RE/MAX Altitud",
        locale: "en",
      }),
    );
    // Bio paragraph must not exist when bio is empty (matches: {bio && <p>{bio}</p>} pattern)
    expect(screen.queryByText("Mountain specialist with 10 years experience.")).toBeNull();
  });

  // [P2] Edge cases

  it("[P2] 4.3-COMP-009: uses placeholder image when both photoOptimizedUrl and photoUrl are null", async () => {
    // THIS TEST WILL FAIL — AgentProfileHero not yet implemented
    const agentNoPhoto = { ...mockAgent, photoUrl: null, photoOptimizedUrl: null };
    const { AgentProfileHero } = await import("@/components/agent/agent-profile-hero");
    render(
      await (AgentProfileHero as unknown as (props: {
        agent: typeof agentNoPhoto;
        officeName: string;
        locale: string;
      }) => Promise<React.ReactElement>)({
        agent: agentNoPhoto,
        officeName: "RE/MAX Altitud",
        locale: "en",
      }),
    );
    const photo = screen.getByTestId("agent-profile-photo");
    expect(photo.getAttribute("src")).toBe("/images/agent-placeholder.svg");
  });

  it("[P2] 4.3-COMP-010: root section has aria-labelledby attribute pointing to agent name heading", async () => {
    // THIS TEST WILL FAIL — AgentProfileHero not yet implemented
    const { AgentProfileHero } = await import("@/components/agent/agent-profile-hero");
    render(
      await (AgentProfileHero as unknown as (props: {
        agent: typeof mockAgent;
        officeName: string;
        locale: string;
      }) => Promise<React.ReactElement>)({
        agent: mockAgent,
        officeName: "RE/MAX Altitud",
        locale: "en",
      }),
    );
    const hero = screen.getByTestId("agent-profile-hero");
    expect(hero.getAttribute("aria-labelledby")).toBe("agent-name-heading");
  });

  // [P0] AC #1 explicit office display (gap closure from test-review)
  it("[P0] 4.3-COMP-011: renders office name passed via props (AC #1 — office display)", async () => {
    const { AgentProfileHero } = await import("@/components/agent/agent-profile-hero");
    render(
      await (AgentProfileHero as unknown as (props: {
        agent: typeof mockAgent;
        officeName: string;
        locale: string;
      }) => Promise<React.ReactElement>)({
        agent: mockAgent,
        officeName: "RE/MAX Altitud Cero",
        locale: "en",
      }),
    );
    // The office name is required content per AC #1; assert it is rendered
    expect(screen.getByText("RE/MAX Altitud Cero")).toBeTruthy();
  });

  // [P0] AC #1 — explicit assertion that contact CTAs are wired into the hero.
  // Without this, the hero could silently drop the AgentProfileCTAs render and tests would still pass.
  it("[P0] 4.3-COMP-012: renders the AgentProfileCTAs subtree (AC #1 — WhatsApp + Email CTAs present)", async () => {
    const { AgentProfileHero } = await import("@/components/agent/agent-profile-hero");
    render(
      await (AgentProfileHero as unknown as (props: {
        agent: typeof mockAgent;
        officeName: string;
        locale: string;
      }) => Promise<React.ReactElement>)({
        agent: mockAgent,
        officeName: "RE/MAX Altitud",
        locale: "en",
      }),
    );
    // The mocked AgentProfileCTAs renders <div data-testid="agent-profile-ctas-mock">{agentName}</div>
    const ctas = screen.getByTestId("agent-profile-ctas-mock");
    expect(ctas).toBeTruthy();
    // Verifies the parent passes the agent name into the CTAs (prop wiring contract)
    expect(ctas.textContent).toContain("Emma Smith");
  });
});
