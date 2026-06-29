import { describe, expect, it } from "vitest";
import { resolveAreaSlug } from "@/lib/db/queries/properties";

describe("resolveAreaSlug", () => {
  // Helpers to create raw property objects with minimal fields
  function makeRawInput(overrides: Partial<Parameters<typeof resolveAreaSlug>[0]>) {
    return {
      officeApiId: 235, // default to Dominical office
      location: null,
      titleEn: "",
      titleEs: "",
      publicRemarksEn: null,
      publicRemarksEs: null,
      ...overrides,
    };
  }

  it("[P0] returns 'perez-zeledon' for properties listed by office 218 (Perez Zeledon) without other keywords", () => {
    const raw = makeRawInput({ officeApiId: 218 });
    expect(resolveAreaSlug(raw)).toBe("perez-zeledon");
  });

  it("[P0] returns 'perez-zeledon' for properties listed by office 235 (Dominical) but explicitly located in Perez Zeledon", () => {
    const raw = makeRawInput({
      officeApiId: 235,
      titleEn: "Beautiful farm in Pérez Zeledón",
      publicRemarksEs: "Finca hermosa en San Isidro de El General",
    });
    expect(resolveAreaSlug(raw)).toBe("perez-zeledon");
  });

  it("[P0] returns 'uvita' for cross-office listings from office 218 (Perez Zeledon) but physically in Uvita", () => {
    const raw = makeRawInput({
      officeApiId: 218,
      titleEn: "Lot in Uvita near Whale Tail",
    });
    expect(resolveAreaSlug(raw)).toBe("uvita");
  });

  it("[P0] returns 'ojochal' for properties with Ojochal or Coronado in title/location", () => {
    const raw1 = makeRawInput({ titleEn: "House in Ojochal" });
    const raw2 = makeRawInput({ location: "Coronado, Osa" });
    const raw3 = makeRawInput({ publicRemarksEs: "Ubicado en Chontales" });
    expect(resolveAreaSlug(raw1)).toBe("ojochal");
    expect(resolveAreaSlug(raw2)).toBe("ojochal");
    expect(resolveAreaSlug(raw3)).toBe("ojochal");
  });

  it("[P0] returns 'tinamastes-platanillo' for properties with Tinamastes keywords", () => {
    const raw1 = makeRawInput({ titleEn: "Lot in Platanillo" });
    const raw2 = makeRawInput({ publicRemarksEs: "Finca en Tinamaste" });
    expect(resolveAreaSlug(raw1)).toBe("tinamastes-platanillo");
    expect(resolveAreaSlug(raw2)).toBe("tinamastes-platanillo");
  });

  it("[P1] does NOT return 'ojochal' for properties that mention 'ojo de agua' (water spring) ONLY in public remarks (descriptive)", () => {
    const raw = makeRawInput({
      officeApiId: 235,
      titleEn: "Mountain Lot with Ocean View",
      publicRemarksEs: "Esta hermosa propiedad cuenta con su propio ojo de agua y bosques.",
    });
    expect(resolveAreaSlug(raw)).toBe("dominical"); // falls back to Dominical
  });

  it("[P1] returns 'ojochal' for properties that mention 'ojo de agua' in the title or location", () => {
    const raw = makeRawInput({
      officeApiId: 235,
      location: "Ojo de Agua",
      titleEn: "Ocean View Lot",
    });
    expect(resolveAreaSlug(raw)).toBe("ojochal");
  });

  it("[P1] does NOT return 'ojochal' for properties that mention 'cortesía' in remarks (avoiding courtesy match)", () => {
    const raw = makeRawInput({
      officeApiId: 235,
      titleEn: "Modern Villa with Ocean Views",
      publicRemarksEs: "Fotos por cortesía del desarrollador.",
    });
    expect(resolveAreaSlug(raw)).toBe("dominical"); // should not match 'cortes' substring in 'cortesía'
  });

  it("[P1] returns 'ojochal' if 'cortés' or 'cortes' is used as a whole word in the title or location", () => {
    const raw = makeRawInput({
      officeApiId: 235,
      titleEn: "Lot near Ciudad Cortés",
    });
    expect(resolveAreaSlug(raw)).toBe("ojochal");
  });

  it("[P1] does NOT return 'tinamastes-platanillo' for properties that mention generic 'lagunas' (lagoons/ponds) ONLY in public remarks", () => {
    const raw = makeRawInput({
      officeApiId: 235,
      titleEn: "Valley View Land",
      publicRemarksEs: "La propiedad cuenta con dos lagunas naturales espectaculares.",
    });
    expect(resolveAreaSlug(raw)).toBe("dominical"); // falls back to Dominical
  });

  it("[P1] returns 'tinamastes-platanillo' for properties that mention 'lagunas' in title or location", () => {
    const raw = makeRawInput({
      officeApiId: 235,
      titleEn: "Ocean View Lot in Lagunas",
    });
    expect(resolveAreaSlug(raw)).toBe("tinamastes-platanillo");
  });

  it("[P0] returns 'heredia' for properties containing 'Heredia' in title or remarks", () => {
    const raw1 = makeRawInput({ titleEn: "House in Heredia" });
    const raw2 = makeRawInput({ publicRemarksEn: "Close to Heredia downtown" });
    expect(resolveAreaSlug(raw1)).toBe("heredia");
    expect(resolveAreaSlug(raw2)).toBe("heredia");
  });

  it("[P0] returns 'san-mateo' for properties containing 'San Mateo' in title or remarks", () => {
    const raw = makeRawInput({ titleEn: "Beautiful lot in San Mateo" });
    expect(resolveAreaSlug(raw)).toBe("san-mateo");
  });

  it("[P0] returns 'san-jose' for properties containing 'San Jose' or 'San José' in title or remarks", () => {
    const raw1 = makeRawInput({ titleEn: "Apartment in San Jose" });
    const raw2 = makeRawInput({ titleEs: "Apartamento en San José" });
    expect(resolveAreaSlug(raw1)).toBe("san-jose");
    expect(resolveAreaSlug(raw2)).toBe("san-jose");
  });

  it("[P0] returns 'jaco' for properties containing 'Jaco' or 'Jacó' in title or remarks", () => {
    const raw = makeRawInput({ titleEn: "Condo in Jaco Beach" });
    expect(resolveAreaSlug(raw)).toBe("jaco");
  });

  it("[P2] returns 'dominical' as the default fallback for office 235", () => {
    const raw = makeRawInput({ officeApiId: 235 });
    expect(resolveAreaSlug(raw)).toBe("dominical");
  });
});
