import { describe, expect, it } from "vitest";
import { encodeImageUrl, splitAndEncodeImages } from "@/lib/sync/utils/images";

describe("encodeImageUrl", () => {
  it("encodes spaces in the filename segment only", () => {
    expect(encodeImageUrl("https://cdn.example.com/images/400142400001/v3/hd/photo 1.jpeg")).toBe(
      "https://cdn.example.com/images/400142400001/v3/hd/photo%201.jpeg",
    );
  });

  it("preserves safe filename characters per encodeURIComponent", () => {
    expect(encodeImageUrl("https://cdn.example.com/a/photo_(2).jpeg")).toBe(
      "https://cdn.example.com/a/photo_(2).jpeg",
    );
  });

  it("returns empty string for empty / whitespace input", () => {
    expect(encodeImageUrl("")).toBe("");
    expect(encodeImageUrl("   ")).toBe("");
  });

  it("falls back to encodeURI for URLs without a path separator", () => {
    expect(encodeImageUrl("no slash here.jpeg")).toBe("no%20slash%20here.jpeg");
  });
});

describe("splitAndEncodeImages", () => {
  it("returns an empty array for null / undefined / empty input", () => {
    expect(splitAndEncodeImages(null)).toEqual([]);
    expect(splitAndEncodeImages(undefined)).toEqual([]);
    expect(splitAndEncodeImages("")).toEqual([]);
  });

  it("splits on pipe, trims, drops empty entries (including trailing pipe)", () => {
    const raw = " https://cdn.example.com/a/one.jpg | https://cdn.example.com/a/two.jpg |";
    expect(splitAndEncodeImages(raw)).toEqual([
      "https://cdn.example.com/a/one.jpg",
      "https://cdn.example.com/a/two.jpg",
    ]);
  });

  it("URL-encodes each filename after splitting", () => {
    const raw = "https://cdn.example.com/a/photo 1.jpeg|https://cdn.example.com/a/photo 2.jpeg";
    expect(splitAndEncodeImages(raw)).toEqual([
      "https://cdn.example.com/a/photo%201.jpeg",
      "https://cdn.example.com/a/photo%202.jpeg",
    ]);
  });
});
