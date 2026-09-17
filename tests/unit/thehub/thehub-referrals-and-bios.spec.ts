import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  getTheHubBaseUrl,
  getTheHubReferralDirectoryUrl,
  getTheHubAgentReferralUrl,
  getTheHubOfficeReferralUrl,
  getTheHubApiExternalUrl,
  DEFAULT_THEHUB_URL,
} from "@/lib/thehub/config";
import {
  buildTheHubLookups,
  findMatchingTheHubAgent,
  type TheHubAgent,
} from "@/lib/thehub/agents";
import {
  AGENT_LANGUAGE_OVERRIDES,
  normalizeAgentName,
} from "@/lib/constants/agent-overrides";

describe("TheHub Referral Configuration & URLs", () => {
  const originalEnv = process.env.NEXT_PUBLIC_THEHUB_URL;

  afterEach(() => {
    process.env.NEXT_PUBLIC_THEHUB_URL = originalEnv;
  });

  it("defaults to dev.hub.remax-altitud.cr when no environment variable is set", () => {
    delete process.env.NEXT_PUBLIC_THEHUB_URL;
    delete process.env.THE_HUB_API_URL;
    delete process.env.THEHUB_API_URL;
    delete process.env.THEHUB_BASE_URL;
    expect(getTheHubBaseUrl()).toBe(DEFAULT_THEHUB_URL);
    expect(getTheHubBaseUrl()).toBe("https://dev.hub.remax-altitud.cr");
  });

  it("respects THE_HUB_API_URL from Coolify environment", () => {
    delete process.env.NEXT_PUBLIC_THEHUB_URL;
    process.env.THE_HUB_API_URL = "https://dev.hub.remax-altitud.cr";
    expect(getTheHubBaseUrl()).toBe("https://dev.hub.remax-altitud.cr");

    process.env.THE_HUB_API_URL = "https://hub.remax-altitud.cr/";
    expect(getTheHubBaseUrl()).toBe("https://hub.remax-altitud.cr");
  });

  it("respects NEXT_PUBLIC_THEHUB_URL when set to production", () => {
    delete process.env.THE_HUB_API_URL;
    process.env.NEXT_PUBLIC_THEHUB_URL = "https://hub.remax-altitud.cr/";
    expect(getTheHubBaseUrl()).toBe("https://hub.remax-altitud.cr");
  });

  it("builds correct bilingual referral directory URLs", () => {
    process.env.NEXT_PUBLIC_THEHUB_URL = "https://dev.hub.remax-altitud.cr";
    expect(getTheHubReferralDirectoryUrl("es")).toBe("https://dev.hub.remax-altitud.cr/es/referrals");
    expect(getTheHubReferralDirectoryUrl("en")).toBe("https://dev.hub.remax-altitud.cr/en/referrals");
  });

  it("builds correct agent referral report URLs with slug", () => {
    process.env.NEXT_PUBLIC_THEHUB_URL = "https://dev.hub.remax-altitud.cr";
    expect(getTheHubAgentReferralUrl("es", "luis-carlos-martinez")).toBe(
      "https://dev.hub.remax-altitud.cr/es/referrals/report?to=luis-carlos-martinez"
    );
    expect(getTheHubAgentReferralUrl("en", "alejandra-castro")).toBe(
      "https://dev.hub.remax-altitud.cr/en/referrals/report?to=alejandra-castro"
    );
  });

  it("builds correct central office referral report URLs", () => {
    process.env.NEXT_PUBLIC_THEHUB_URL = "https://hub.remax-altitud.cr";
    expect(getTheHubOfficeReferralUrl("es")).toBe(
      "https://hub.remax-altitud.cr/es/referrals/report?to=office"
    );
    expect(getTheHubOfficeReferralUrl("en")).toBe(
      "https://hub.remax-altitud.cr/en/referrals/report?to=office"
    );
  });

  it("builds correct API external endpoint URL", () => {
    process.env.NEXT_PUBLIC_THEHUB_URL = "https://dev.hub.remax-altitud.cr";
    expect(getTheHubApiExternalUrl()).toBe(
      "https://dev.hub.remax-altitud.cr/api/referrals/external"
    );
  });
});

describe("Luis Carlos Martinez Language Override (Issue #335)", () => {
  it("forces Luis Carlos Martinez to strictly Spanish", () => {
    const luisNormalized = normalizeAgentName("Luis Carlos Martinez");
    expect(AGENT_LANGUAGE_OVERRIDES[luisNormalized]).toEqual(["es"]);

    const luisAlt = normalizeAgentName("Luis Martinez");
    expect(AGENT_LANGUAGE_OVERRIDES[luisAlt]).toEqual(["es"]);

    const luisShort = normalizeAgentName("Luis Carlos");
    expect(AGENT_LANGUAGE_OVERRIDES[luisShort]).toEqual(["es"]);
  });
});

describe("TheHub Agent Matching & Lookups", () => {
  const mockTheHubAgents: TheHubAgent[] = [
    {
      id: "agent-1",
      name: "Luis Carlos Martinez",
      slug: "luis-carlos-martinez",
      role: "agent",
      officeName: "RE/MAX Altitud",
      bio: "Experto en fincas y propiedades residenciales en Pérez Zeledón.",
      phone: "+506 8888 1234",
      email: "luis@remax-altitud.cr",
    },
    {
      id: "agent-2",
      name: "Alejandra Castro",
      slug: "alejandra-castro",
      role: "broker",
      officeName: "RE/MAX Altitud Cero",
      bio: "Broker y fundadora con más de 15 años de experiencia.",
      phone: "+506 8888 5678",
      email: "acastro@remax-altitud.cr",
    },
  ];

  it("matches agent by exact or normalized email", () => {
    const lookups = buildTheHubLookups(mockTheHubAgents);
    const match = findMatchingTheHubAgent(lookups, "LUIS@REMAX-ALTITUD.CR", "Luis");
    expect(match).not.toBeNull();
    expect(match?.name).toBe("Luis Carlos Martinez");
    expect(match?.slug).toBe("luis-carlos-martinez");
    expect(match?.bio).toContain("Experto en fincas");
  });

  it("matches agent by normalized name when email is missing or different", () => {
    const lookups = buildTheHubLookups(mockTheHubAgents);
    const match = findMatchingTheHubAgent(lookups, null, "luis carlos martínez");
    expect(match).not.toBeNull();
    expect(match?.slug).toBe("luis-carlos-martinez");
  });

  it("returns null if no agent matches", () => {
    const lookups = buildTheHubLookups(mockTheHubAgents);
    const match = findMatchingTheHubAgent(lookups, "unknown@test.com", "John Doe");
    expect(match).toBeNull();
  });
});
