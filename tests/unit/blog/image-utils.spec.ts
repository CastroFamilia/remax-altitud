import { describe, it, expect } from "vitest";
import { normalizeImageUrl } from "@/lib/blog/image-utils";

describe("normalizeImageUrl utility", () => {
  it("converts Google Drive file view links to high-res thumbnail stream", () => {
    const driveView = "https://drive.google.com/file/d/1A2B3C4D5E6F7G8H9I/view?usp=sharing";
    expect(normalizeImageUrl(driveView)).toBe(
      "https://drive.google.com/thumbnail?id=1A2B3C4D5E6F7G8H9I&sz=w2000"
    );
  });

  it("converts Google Drive open id links", () => {
    const driveOpen = "https://drive.google.com/open?id=1A2B3C4D5E6F7G8H9I";
    expect(normalizeImageUrl(driveOpen)).toBe(
      "https://drive.google.com/thumbnail?id=1A2B3C4D5E6F7G8H9I&sz=w2000"
    );
  });

  it("converts Dropbox links from dl=0 to raw=1", () => {
    const dropboxUrl = "https://www.dropbox.com/s/sample123/image.jpg?dl=0";
    expect(normalizeImageUrl(dropboxUrl)).toBe(
      "https://www.dropbox.com/s/sample123/image.jpg?raw=1"
    );
  });

  it("preserves standard direct image URLs", () => {
    const directUrl = "https://images.unsplash.com/photo-123456789?auto=format";
    expect(normalizeImageUrl(directUrl)).toBe(directUrl);
  });

  it("handles null, undefined and empty strings", () => {
    expect(normalizeImageUrl("")).toBe("");
    expect(normalizeImageUrl(null)).toBe("");
    expect(normalizeImageUrl(undefined)).toBe("");
  });
});
