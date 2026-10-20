import { describe, expect, it } from "vitest";
import { resolveAreaSlug, resolveSubLocation } from "@/lib/db/queries/properties";
import { resolvePropertyType } from "@/lib/sync/schemas/property";

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

describe("resolveSubLocation (Issue #410)", () => {
  it("resolves property 166077 (El Jardín de Páramo) to 'paramo' despite poetic 'sobre las nubes' in title", () => {
    // Property 166077 had location 'Jardín' and title containing 'sobre las nubes'
    // Before fix: 'las nubes' matched Santa Elena barrio before paramo.
    // After fix: explicit location/address is checked first and 'jardin de paramo' alias matches paramo.
    const sub = resolveSubLocation(
      "Jardin",
      "perez-zeledon",
      "Mountain Cabins at 2,200m ASL in El Jardin de Paramo",
      "Cabañas de Montaña a 2,200m de Altitud en El Jardin de Paramo, sobre las nubes",
      "El Jardin de Paramo",
    );
    expect(sub).toBe("paramo");
  });

  it("resolves 'jardin de paramo' location to 'paramo'", () => {
    const sub = resolveSubLocation("Jardín de Páramo", "perez-zeledon");
    expect(sub).toBe("paramo");
  });

  it("resolves 'Pueblo Nuevo, Rivas' to 'rivas'", () => {
    const sub = resolveSubLocation("Pueblo Nuevo, Rivas", "perez-zeledon");
    expect(sub).toBe("rivas");
  });

  it("resolves 'Santa Elena' explicitly to 'santa-elena-de-el-general'", () => {
    const sub = resolveSubLocation("Santa Elena", "perez-zeledon");
    expect(sub).toBe("santa-elena-de-el-general");
  });
});

describe("resolvePropertyType (Issue #410)", () => {
  it("corrects House/Villa to Lot/Land when property has 0 bedrooms, 0 construction, and title is a farm/lot", () => {
    // Property 165758 in feed: House/Villa, 0 beds, 0 m2, title is 1.4-Hectare Farm
    const res = resolvePropertyType({
      PropertyTypeName_en: "House/Villa",
      PropertyTypeName_es: "Casa/Villa",
      ListingTitle_en: "1.4-Hectare Farm in Pueblo Nuevo de Rivas",
      ListingTitle_es: "Finca de 1.4 Hectáreas en Pueblo Nuevo de Rivas",
      ConstructionSize: 0,
      BedroomsTotal: 0,
      LotSizeArea: 14000,
    });
    expect(res.propertyTypeEn).toBe("Lot/Land");
    expect(res.propertyTypeEs).toBe("Lote/Terreno");
  });

  it("preserves House/Villa when property actually has bedrooms or construction", () => {
    const res = resolvePropertyType({
      PropertyTypeName_en: "House/Villa",
      PropertyTypeName_es: "Casa/Villa",
      ListingTitle_en: "Lovely Mountain House",
      ListingTitle_es: "Hermosa Casa de Montaña",
      ConstructionSize: 180,
      BedroomsTotal: 3,
      LotSizeArea: 1000,
    });
    expect(res.propertyTypeEn).toBe("House/Villa");
    expect(res.propertyTypeEs).toBe("Casa/Villa");
  });

  it("preserves Lot/Land when already Lot/Land", () => {
    const res = resolvePropertyType({
      PropertyTypeName_en: "Lot/Land",
      PropertyTypeName_es: "Lote/Terreno",
      ListingTitle_en: "Panoramic View Lot",
      ListingTitle_es: "Lote con Vista Panorámica",
      ConstructionSize: 0,
      BedroomsTotal: 0,
      LotSizeArea: 5000,
    });
    expect(res.propertyTypeEn).toBe("Lot/Land");
    expect(res.propertyTypeEs).toBe("Lote/Terreno");
  });
});

