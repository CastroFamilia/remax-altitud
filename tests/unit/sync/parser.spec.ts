import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseAgentArray, parsePropertyArray } from "@/lib/sync/parser";

const fixturePath = (name: string) => resolve(__dirname, "../../fixtures/remax-api", name);

function loadFixture(name: string): unknown {
  return JSON.parse(readFileSync(fixturePath(name), "utf-8"));
}

describe("parsePropertyArray", () => {
  it("parses 2 valid records + 1 invalid from the PZ sample", () => {
    const { records, parseErrors } = parsePropertyArray(loadFixture("properties-pz-sample.json"));

    expect(records).toHaveLength(2);
    expect(parseErrors).toHaveLength(1);

    const land = records[0];
    expect(land.apiId).toBe("113149");
    expect(land.apiKey).toBe("400142400001");
    expect(land.propertyTypeEn).toBe("Lot/Land");
    expect(land.propertyTypeEs).toBe("Lote/Terreno");
    expect(typeof land.latitude).toBe("number");
    expect(typeof land.longitude).toBe("number");
    expect(land.latitude).toBeCloseTo(9.3549572, 6);
    expect(land.longitude).toBeCloseTo(-83.6350214, 6);
    expect(Array.isArray(land.images)).toBe(true);
    expect(land.images).toHaveLength(2);
    expect(land.images[0]).toBe(
      "https://cdn.example.com/images/400142400001/v3/hd/photo%201.jpeg",
    );
    expect(land.images[1]).toBe(
      "https://cdn.example.com/images/400142400001/v3/hd/photo_(2).jpeg",
    );
    expect(land.publicRemarksEs).toBe("¿Buscas un terreno con vista a la montaña?");
    expect(land.isExpired).toBe(false);
    expect(land.lotSizeUnitWarning).toBe(false);
    expect(land.amenities.view).toBe(true);
    expect(land.amenities.pool).toBe(false);

    const house = records[1];
    expect(house.titleEs).toBe(house.titleEn);
    expect(house.constructionM2).toBe(220.5);
    expect(house.amenities.garage).toBe(true);
    expect(house.amenities.garageSpaces).toBe(2);
  });

  it("returns empty records and no errors for an empty Altitud Cero array", () => {
    const result = parsePropertyArray(loadFixture("properties-pz-empty.json"));
    expect(result.records).toEqual([]);
    expect(result.parseErrors).toEqual([]);
  });

  it("flags Lot/Land with tiny LotSizeArea + 'hectares' description as lotSizeUnitWarning", () => {
    const { records } = parsePropertyArray(loadFixture("properties-pz-lot-warning.json"));
    expect(records).toHaveLength(1);
    expect(records[0].lotSizeUnitWarning).toBe(true);
    expect(records[0].lotSizeM2).toBe(31);
  });

  it("sets isExpired=false even for past ExpirationDate (expiration ignored)", () => {
    const { records } = parsePropertyArray(loadFixture("properties-pz-expired.json"));
    expect(records).toHaveLength(1);
    expect(records[0].isExpired).toBe(false);
  });

  it("returns an error payload when the root is not an array", () => {
    const result = parsePropertyArray({ oops: "not an array" });
    expect(result.records).toEqual([]);
    expect(result.parseErrors).toHaveLength(1);
    expect(result.parseErrors[0].message).toMatch(/array/i);
  });
});

describe("parseAgentArray", () => {
  it("parses agents and strips Birthday from the output", () => {
    const { records, parseErrors } = parseAgentArray(loadFixture("agents-pz-sample.json"));

    expect(parseErrors).toEqual([]);
    expect(records).toHaveLength(3);

    for (const agent of records) {
      expect(Object.keys(agent)).not.toContain("Birthday");
      expect(Object.keys(agent)).not.toContain("birthday");
    }

    expect(records[0].whatsapp).toBe("+50688887777");
    expect(records[0].role).toBe("owner");
    expect(records[0].primaryLang).toBe("en");

    expect(records[1].whatsapp).toBe("+50677776666");
    expect(records[1].role).toBe("associate");
    expect(records[1].primaryLang).toBe("es");

    expect(records[2].whatsapp).toBeNull();
    expect(records[2].phone).toBeNull();
  });
});
