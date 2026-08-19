import { describe, it, expect } from "vitest";
import { getReadingTime } from "@/lib/blog/reading-time";

describe("getReadingTime utility", () => {
  it("returns 1 for empty or very short content", () => {
    expect(getReadingTime("")).toBe(1);
    expect(getReadingTime("Hello world")).toBe(1);
  });

  it("calculates reading time correctly based on 200 words per minute", () => {
    const text200Words = Array(200).fill("word").join(" ");
    expect(getReadingTime(text200Words)).toBe(1);

    const text450Words = Array(450).fill("word").join(" ");
    expect(getReadingTime(text450Words)).toBe(3);
  });
});
