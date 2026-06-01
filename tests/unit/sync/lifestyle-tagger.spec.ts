import { describe, expect, it } from "vitest";
import { makeRawProperty } from "./factories";
import { applyLifestyleTags, tagBatch } from "@/lib/sync/lifestyle-tagger";

describe("applyLifestyleTags — new lifestyle rules mapping", () => {
  it("tags 'Casa' correctly", () => {
    const rawEn = makeRawProperty({ propertyTypeEn: "House", propertyTypeEs: "Casa" });
    const rawEs = makeRawProperty({ propertyTypeEn: "Other", propertyTypeEs: "Casa" });
    const rawNo = makeRawProperty({ propertyTypeEn: "Lot", propertyTypeEs: "Lote" });

    expect(applyLifestyleTags(rawEn, [])).toContain("Casa");
    expect(applyLifestyleTags(rawEs, [])).toContain("Casa");
    expect(applyLifestyleTags(rawNo, [])).not.toContain("Casa");
  });

  it("tags 'Lote' correctly", () => {
    const rawEn = makeRawProperty({ propertyTypeEn: "Lot", propertyTypeEs: "Lote" });
    const rawEs = makeRawProperty({ propertyTypeEn: "Other", propertyTypeEs: "Lote" });
    const rawNo = makeRawProperty({ propertyTypeEn: "House", propertyTypeEs: "Casa" });

    expect(applyLifestyleTags(rawEn, [])).toContain("Lote");
    expect(applyLifestyleTags(rawEs, [])).toContain("Lote");
    expect(applyLifestyleTags(rawNo, [])).not.toContain("Lote");
  });

  it("tags 'Finca' correctly", () => {
    const rawEn = makeRawProperty({ propertyTypeEn: "Farm", propertyTypeEs: "Finca" });
    const rawEs = makeRawProperty({ propertyTypeEn: "Other", propertyTypeEs: "Finca" });
    const rawNo = makeRawProperty({ propertyTypeEn: "House", propertyTypeEs: "Casa" });

    expect(applyLifestyleTags(rawEn, [])).toContain("Finca");
    expect(applyLifestyleTags(rawEs, [])).toContain("Finca");
    expect(applyLifestyleTags(rawNo, [])).not.toContain("Finca");
  });

  it("tags 'Con río' correctly from description", () => {
    const raw = makeRawProperty({
      propertyTypeEn: "House",
      propertyTypeEs: "Casa",
      publicRemarksEn: "Beautiful property with a river flowing through.",
    });
    expect(applyLifestyleTags(raw, [])).toContain("Con río");
  });

  it("tags 'Con cascada' correctly from description", () => {
    const raw = makeRawProperty({
      propertyTypeEn: "House",
      propertyTypeEs: "Casa",
      publicRemarksEn: "Beautiful property with a waterfall.",
    });
    expect(applyLifestyleTags(raw, [])).toContain("Con cascada");
  });

  it("tags 'Con vista al mar' correctly from description", () => {
    const raw = makeRawProperty({
      propertyTypeEn: "House",
      propertyTypeEs: "Casa",
      publicRemarksEn: "Beautiful property with an ocean view.",
    });
    expect(applyLifestyleTags(raw, [])).toContain("Con vista al mar");
  });

  it("tags 'Con vista a la montaña' correctly from description", () => {
    const raw = makeRawProperty({
      propertyTypeEn: "House",
      propertyTypeEs: "Casa",
      publicRemarksEn: "Beautiful property with a mountain view.",
    });
    expect(applyLifestyleTags(raw, [])).toContain("Con vista a la montaña");
  });
});

describe("applyLifestyleTags — manual override preservation & deduplication", () => {
  it("preserves admin-set manual override tags", () => {
    const raw = makeRawProperty({
      propertyTypeEn: "House",
      propertyTypeEs: "Casa",
    });
    // Casa matches auto-rule, but manual tag "Con río" should be preserved and combined
    const result = applyLifestyleTags(raw, ["Con río"]);
    expect(result).toContain("Con río");
    expect(result).toContain("Casa");
  });

  it("deduplicates tags", () => {
    const raw = makeRawProperty({
      propertyTypeEn: "House",
      propertyTypeEs: "Casa",
    });
    const result = applyLifestyleTags(raw, ["Casa"]);
    const casaCount = result.filter((t) => t === "Casa").length;
    expect(casaCount).toBe(1);
  });
});

describe("tagBatch — batch processing", () => {
  it("returns correct tagging results for a batch of properties", () => {
    const props = [
      { raw: makeRawProperty({ apiId: "P1", propertyTypeEn: "House", propertyTypeEs: "Casa" }), existingTags: [] },
      { raw: makeRawProperty({ apiId: "P2", propertyTypeEn: "Lot", propertyTypeEs: "Lote" }), existingTags: [] },
    ];

    const results = tagBatch(props);
    expect(results).toHaveLength(2);
    expect(results[0].apiId).toBe("P1");
    expect(results[0].tagged).toBe(true);
    expect(results[0].tags).toContain("Casa");
    expect(results[1].apiId).toBe("P2");
    expect(results[1].tagged).toBe(true);
    expect(results[1].tags).toContain("Lote");
  });

  it("sets tagged=false when no new tags are added", () => {
    const props = [
      { raw: makeRawProperty({ apiId: "P1", propertyTypeEn: "House", propertyTypeEs: "Casa" }), existingTags: ["Casa"] },
    ];
    const results = tagBatch(props);
    expect(results[0].tagged).toBe(false);
  });
});
