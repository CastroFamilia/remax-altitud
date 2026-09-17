import { getTheHubApiExternalUrl } from "./config";
import { normalizeAgentName } from "@/lib/constants/agent-overrides";

export interface TheHubAgent {
  id: string;
  name: string;
  slug: string;
  role: string;
  officeName: string;
  bio?: string | null;
  languages?: string | null;
  coverageAreas?: string | null;
  propertyTypes?: string | null;
  whyChooseMe?: string | null;
  profileImageUrl?: string | null;
  phone?: string | null;
  email?: string | null;
}

/**
 * Fetches all agents published by TheHub referral directory.
 * Cached with Next.js ISR revalidation:
 * - In development: 0 (immediate, no caching)
 * - In production/staging: 60 seconds (1 minute TTL)
 * Tolerant to network errors — returns an empty array on failure.
 */
export async function fetchTheHubAgents(): Promise<TheHubAgent[]> {
  try {
    const url = getTheHubApiExternalUrl();
    const isDev = process.env.NODE_ENV === "development";
    const res = await fetch(url, {
      next: { revalidate: isDev ? 0 : 60 },
      signal: AbortSignal.timeout(5000),
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      console.warn(`[TheHub] Failed to fetch agents from ${url}: status ${res.status}`);
      return [];
    }

    const data = await res.json();
    return Array.isArray(data) ? (data as TheHubAgent[]) : [];
  } catch (error) {
    console.warn("[TheHub] Network error fetching agents:", error);
    return [];
  }
}

export interface TheHubAgentLookups {
  byEmail: Map<string, TheHubAgent>;
  byName: Map<string, TheHubAgent>;
  bySlug: Map<string, TheHubAgent>;
}

export function buildTheHubLookups(theHubAgents: TheHubAgent[]): TheHubAgentLookups {
  const byEmail = new Map<string, TheHubAgent>();
  const byName = new Map<string, TheHubAgent>();
  const bySlug = new Map<string, TheHubAgent>();

  for (const agent of theHubAgents) {
    if (agent.email) {
      const emailKey = agent.email.toLowerCase().trim();
      byEmail.set(emailKey, agent);

      // Known alias / fallback: Alejandra Castro
      if (emailKey === "acastro@remax-altitud.cr") {
        byName.set(normalizeAgentName("Alejandra Castro"), agent);
        bySlug.set("alejandra-castro", agent);
      }
    }
    if (agent.name && agent.name.trim().length > 0) {
      byName.set(normalizeAgentName(agent.name), agent);
    }
    if (agent.slug && agent.slug.trim().length > 0) {
      bySlug.set(agent.slug.toLowerCase().trim(), agent);
    }
  }

  return { byEmail, byName, bySlug };
}

/**
 * Finds matching TheHub agent record by email, normalized name, or slug.
 */
export function findMatchingTheHubAgent(
  lookups: TheHubAgentLookups,
  email?: string | null,
  name?: string | null,
  slug?: string | null,
): TheHubAgent | null {
  if (email) {
    const match = lookups.byEmail.get(email.toLowerCase().trim());
    if (match) return match;
  }

  if (name) {
    const match = lookups.byName.get(normalizeAgentName(name));
    if (match) return match;
  }

  if (slug) {
    const match = lookups.bySlug.get(slug.toLowerCase().trim());
    if (match) return match;
  }

  // Resilient fallback for Alejandra Castro if name or slug references her
  if (
    (name && normalizeAgentName(name).includes("alejandra")) ||
    (slug && slug.toLowerCase().includes("alejandra"))
  ) {
    const match =
      lookups.byEmail.get("acastro@remax-altitud.cr") ||
      lookups.bySlug.get("alejandra-castro") ||
      lookups.byName.get("alejandra castro");
    if (match) return match;
  }

  return null;
}
