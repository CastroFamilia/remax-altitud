import { describe, expect, it } from "vitest";
import {
  AGENT_PLACEHOLDER_SRC,
  isBlockedAgentPhotoUrl,
  resolveAgentPhotoSrc,
} from "@/lib/utils/agent-photo";

describe("isBlockedAgentPhotoUrl", () => {
  it("detects assets.remax-ccamls.com URLs", () => {
    expect(
      isBlockedAgentPhotoUrl(
        "https://assets.remax-ccamls.com/member-profiles/4014/8682737c0512468292310534b5690f15/Dise_o_sin_t_tulo.jpg",
      ),
    ).toBe(true);
  });

  it("allows balloon.remax-cca.com and azureedge URLs", () => {
    expect(
      isBlockedAgentPhotoUrl("https://balloon.remax-cca.com/userfiles/alejandra-castro/image/8.jpg"),
    ).toBe(false);
    expect(
      isBlockedAgentPhotoUrl(
        "https://remaxcaribbeanandcentralamerica.azureedge.net/images/R1040037/v3/173/Deb%20bio%20photo.png",
      ),
    ).toBe(false);
  });
});

describe("resolveAgentPhotoSrc", () => {
  it("prefers TheHub photo when photoUrl is on assets.remax-ccamls.com", () => {
    const result = resolveAgentPhotoSrc({
      photoOptimizedUrl: null,
      photoUrl:
        "https://assets.remax-ccamls.com/member-profiles/4014/8682737c0512468292310534b5690f15/Dise_o_sin_t_tulo.jpg",
      theHubProfileImageUrl: "https://balloon.remax-cca.com/userfiles/alejandra-castro/image/8.jpg",
    });

    expect(result.src).toBe("https://balloon.remax-cca.com/userfiles/alejandra-castro/image/8.jpg");
    expect(result.fallbackSrc).toBe(AGENT_PLACEHOLDER_SRC);
  });

  it("uses photoOptimizedUrl first and falls back to usable photoUrl or TheHub photo", () => {
    const result = resolveAgentPhotoSrc({
      photoOptimizedUrl: "/agent-images/alejandra.webp",
      photoUrl: "https://balloon.remax-cca.com/userfiles/alejandra-castro/image/14.jpg",
      theHubProfileImageUrl: "https://balloon.remax-cca.com/userfiles/alejandra-castro/image/8.jpg",
    });

    expect(result.src).toBe("/agent-images/alejandra.webp");
    expect(result.fallbackSrc).toBe(
      "https://balloon.remax-cca.com/userfiles/alejandra-castro/image/14.jpg",
    );
  });

  it("returns blocked photoUrl with placeholder fallback when no TheHub photo exists", () => {
    const blockedUrl =
      "https://assets.remax-ccamls.com/member-profiles/9999/test/profile.jpg";
    const result = resolveAgentPhotoSrc({
      photoOptimizedUrl: null,
      photoUrl: blockedUrl,
      theHubProfileImageUrl: null,
    });

    expect(result.src).toBe(blockedUrl);
    expect(result.fallbackSrc).toBe(AGENT_PLACEHOLDER_SRC);
  });

  it("returns placeholder when no photo URLs are present", () => {
    const result = resolveAgentPhotoSrc({
      photoOptimizedUrl: "",
      photoUrl: null,
      theHubProfileImageUrl: null,
    });

    expect(result.src).toBe(AGENT_PLACEHOLDER_SRC);
    expect(result.fallbackSrc).toBe(AGENT_PLACEHOLDER_SRC);
  });
});
