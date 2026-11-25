/**
 * Resolves the best usable photo URL for an agent and detects hosts known to
 * block server-side / cross-origin image requests (e.g. Cloudflare challenge
 * on assets.remax-ccamls.com).
 */

export const AGENT_PLACEHOLDER_SRC = "/images/agent-placeholder.svg";

const BLOCKED_AGENT_PHOTO_HOSTS = new Set(["assets.remax-ccamls.com"]);

export function isBlockedAgentPhotoUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return BLOCKED_AGENT_PHOTO_HOSTS.has(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
}

export interface AgentPhotoInput {
  photoOptimizedUrl?: string | null;
  photoUrl?: string | null;
  theHubProfileImageUrl?: string | null;
}

export function resolveAgentPhotoSrc(
  agent: AgentPhotoInput,
  theHubProfileImageUrl?: string | null,
): { src: string; fallbackSrc: string } {
  const hubUrl = theHubProfileImageUrl ?? agent.theHubProfileImageUrl ?? null;

  const candidates = [agent.photoOptimizedUrl, agent.photoUrl, hubUrl].filter(
    (u): u is string => typeof u === "string" && u.trim().length > 0,
  );

  // Prefer the first candidate not hosted on a blocked domain.
  const usable = candidates.filter((u) => !isBlockedAgentPhotoUrl(u));

  if (usable.length > 0) {
    return {
      src: usable[0],
      fallbackSrc: usable[1] ?? AGENT_PLACEHOLDER_SRC,
    };
  }

  // If all candidates are on a blocked host, still return the first so
  // AgentAvatar can attempt it and fall back to AGENT_PLACEHOLDER_SRC on error.
  if (candidates.length > 0) {
    return {
      src: candidates[0],
      fallbackSrc: AGENT_PLACEHOLDER_SRC,
    };
  }

  return {
    src: AGENT_PLACEHOLDER_SRC,
    fallbackSrc: AGENT_PLACEHOLDER_SRC,
  };
}
