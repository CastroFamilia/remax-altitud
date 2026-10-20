import { describe, expect, it } from "vitest";
import { getPropertyDisplayId } from "@/lib/utils/property-id";

describe("getPropertyDisplayId", () => {
  it("extracts 12-digit ListingKey from apiRaw when available", () => {
    const prop = {
      id: "uuid-1234",
      apiId: "165758",
      apiRaw: {
        ListingKey: "400344703015",
        ListingId: "165758",
      },
    };
    expect(getPropertyDisplayId(prop)).toBe("400344703015");
  });

  it("extracts listingKey (camelCase) from apiRaw if uppercase is missing", () => {
    const prop = {
      id: "uuid-1234",
      apiId: "165758",
      apiRaw: {
        listingKey: "400374736001",
      },
    };
    expect(getPropertyDisplayId(prop)).toBe("400374736001");
  });

  it("falls back to apiId when apiRaw has no ListingKey", () => {
    const prop = {
      id: "uuid-1234",
      apiId: "165758",
      apiRaw: {},
    };
    expect(getPropertyDisplayId(prop)).toBe("165758");
  });

  it("falls back to apiRaw.ListingId when apiId is missing", () => {
    const prop = {
      id: "uuid-1234",
      apiRaw: {
        ListingId: "165758",
      },
    };
    expect(getPropertyDisplayId(prop)).toBe("165758");
  });

  it("falls back to id when neither ListingKey nor apiId exists", () => {
    const prop = {
      id: "uuid-1234",
    };
    expect(getPropertyDisplayId(prop)).toBe("uuid-1234");
  });

  it("returns empty string when property is null or undefined", () => {
    expect(getPropertyDisplayId(null)).toBe("");
    expect(getPropertyDisplayId(undefined)).toBe("");
  });
});
