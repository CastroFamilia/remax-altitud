import { describe, expect, it } from "vitest";
import { normalizeCostaRicaPhone } from "@/lib/sync/utils/phone";

describe("normalizeCostaRicaPhone", () => {
  it("normalizes canonical '506 XXXXXXXX' with a space", () => {
    expect(normalizeCostaRicaPhone("506 88887777")).toBe("+50688887777");
  });

  it("normalizes no-space '50688887777'", () => {
    expect(normalizeCostaRicaPhone("50688887777")).toBe("+50688887777");
  });

  it("prepends +506 to a bare 8-digit local number", () => {
    expect(normalizeCostaRicaPhone("88887777")).toBe("+50688887777");
  });

  it("strips dashes", () => {
    expect(normalizeCostaRicaPhone("506-8888-7777")).toBe("+50688887777");
  });

  it("returns null for empty, null, and undefined", () => {
    expect(normalizeCostaRicaPhone("")).toBeNull();
    expect(normalizeCostaRicaPhone(null)).toBeNull();
    expect(normalizeCostaRicaPhone(undefined)).toBeNull();
  });

  it("returns null for too-short input", () => {
    expect(normalizeCostaRicaPhone("123")).toBeNull();
  });

  it("returns null for invalid length after 506 prefix (7 digits)", () => {
    expect(normalizeCostaRicaPhone("506 1234567")).toBeNull();
  });
});
