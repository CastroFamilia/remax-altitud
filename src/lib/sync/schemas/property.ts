import "server-only";
import { z } from "zod";
import { splitAndEncodeImages } from "../utils/images";
import { getCrcToUsdRate } from "../../utils/currency";

/**
 * Zod schema for a single record in the REMAX CCA `PropertiesPerOffice` feed.
 * Accepts the API's literal field set (including the lowercase-`p`
 * `publicRemarks_es` key — API1) and emits a normalized `RawProperty` via a
 * single chained `.transform(...)` call so there is no separate hand-rolled
 * type (LLM anti-pattern guardrail) and no double-parse.
 */

const yn = z.string().transform((v) => v.trim().toUpperCase() === "Y");

const nullableNumberFromString = z
  .union([z.number(), z.string()])
  .nullish()
  .transform((v) => {
    if (v === null || v === undefined || v === "") return null;
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : null;
  });

const isoDateOrNull = z
  .string()
  .nullish()
  .transform((v) => {
    if (!v) return null;
    const d = new Date(v);
    return Number.isFinite(d.getTime()) ? d : null;
  });

const latLng = z
  .preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : v),
    z.coerce.number().catch(NaN),
  )
  .transform((n) => (Number.isFinite(n) ? n : null));

const rawPropertyApiSchemaBase = z
  .object({
    ListingId: z.union([z.number(), z.string()]).transform((v) => String(v)),
    ListingKey: z.string(),
    PropertyTypeName_en: z.string().transform((v) => v.trim()),
    PropertyTypeName_es: z.string().transform((v) => v.trim()),
    ListingContractType: z.number().nullish(),
    ContractType_en: z.string().nullish(),
    ContractType_es: z.string().nullish(),
    ListingTitle_en: z.string(),
    ListingTitle_es: z.string().nullish(),
    PublicRemarks_en: z.string().nullish(),
    publicRemarks_es: z.string().nullish(),
    ListingProbableuseId: z.number().nullish(),
    ProbableUse: z.string().nullish(),
    Status: z.string(),
    Furnishedyn: yn,
    ListingContractDate: isoDateOrNull,
    ExpirationDate: isoDateOrNull,
    Listingagreementyn: yn.optional(),
    CountryId: z.number().nullish(),
    Country: z.string().nullish(),
    StateDepProvId: z.number().nullish(),
    StateDepProv: z.string().nullish(),
    LocationId: z.number().nullish(),
    Location: z.string().nullish(),
    Garage: yn,
    GarageCovered: yn.optional(),
    GarageOpen: yn.optional(),
    GarageSpaces: z.number().nullish(),
    MaidRoom: yn,
    Cooling: yn,
    PoolPrivate: yn,
    Viewyn: yn,
    BedroomsTotal: z.number().nullish(),
    BathroomsFull: z.number().nullish(),
    Stories: z.number().nullish(),
    LotSizeArea: nullableNumberFromString,
    LotSizeUnitsId: z.number().nullish(),
    LotSizeUnits: z.string().nullish(),
    ConstructionSizeLiving: nullableNumberFromString,
    ConstructionSizeUnits: z.string().nullish(),
    ConstructionSizeTotal: nullableNumberFromString,
    ConstructionSize: nullableNumberFromString,
    AssociationNotes: z.string().nullish(),
    GatedCommunity: yn,
    ListPrice: z.union([z.number(), z.string()]).transform((v) => {
      const n = typeof v === "number" ? v : Number(v);
      if (!Number.isFinite(n)) throw new Error("ListPrice is not a number");
      return n;
    }),
    CurrencyId: z.number(),
    CurrencyListPrice: z.string(),
    Videolink: z.string().nullish(),
    EmbeddedVideoCode: z.string().nullish(),
    Latitude: latLng,
    Longitude: latLng,
    UnparsedAddress: z.string().nullish(),
    AssociateId: z.union([z.number(), z.string()]).transform((v) => String(v)),
    Images: z.string().nullish(),
    FirstName: z.string().nullish(),
    LastName: z.string().nullish(),
    OfficeID: z.number(),
    OfficeName: z.string().nullish(),
  })
  .passthrough();

/**
 * Resolves the listing transaction type ("Sale" or "Lease") using multiple
 * signals from the API payload. The REMAX CCA API sometimes returns
 * `ContractType_en` as null for rental properties, so we cascade through
 * several fallback strategies before defaulting to "Sale".
 *
 * Signal priority:
 *   1. ContractType_en (English text: "Sale", "Lease")
 *   2. ContractType_es (Spanish text: "Venta", "Alquiler" / "Arriendo")
 *   3. ListingContractType (numeric ID: 2 = Lease in REMAX CCA)
 *   4. Title heuristic (rent/lease/alquiler keywords in EN or ES title)
 *   5. Default: "Sale"
 */
function resolveListingType(p: {
  ContractType_en?: string | null;
  ContractType_es?: string | null;
  ListingContractType?: number | null;
  ListingTitle_en: string;
  ListingTitle_es?: string | null;
}): "Sale" | "Lease" {
  // 1. Explicit English contract type
  if (p.ContractType_en) {
    const ct = p.ContractType_en.trim();
    if (/lease|rent/i.test(ct)) return "Lease";
    if (/sale|sell/i.test(ct)) return "Sale";
    // If it's some other value, continue to fallbacks
  }

  // 2. Explicit Spanish contract type
  if (p.ContractType_es) {
    const ct = p.ContractType_es.trim();
    if (/alquiler|arriendo|renta/i.test(ct)) return "Lease";
    if (/venta/i.test(ct)) return "Sale";
  }

  // 3. Numeric contract type ID (REMAX CCA convention: 2 = Lease)
  if (p.ListingContractType === 2) return "Lease";
  if (p.ListingContractType === 1) return "Sale";

  // 4. Title-based heuristic — look for rental keywords in either language
  const titleText = `${p.ListingTitle_en} ${p.ListingTitle_es ?? ""}`.toLowerCase();
  if (
    /\bfor rent\b|\bfor lease\b|\brental\b|\balquiler\b|\barriendo\b|\ben renta\b/.test(titleText)
  ) {
    return "Lease";
  }

  // 5. Default fallback
  return "Sale";
}

export const rawPropertyApiSchema = rawPropertyApiSchemaBase.transform((p) => {
  const titleEn = p.ListingTitle_en;
  const titleEsRaw = (p.ListingTitle_es ?? "").trim();
  const titleEs = titleEsRaw.length > 0 ? titleEsRaw : titleEn;

  const lotSizeM2 = p.LotSizeArea !== null && p.LotSizeUnits === "Sq Mt" ? p.LotSizeArea : null;

  const description = `${p.PublicRemarks_en ?? ""} ${p.publicRemarks_es ?? ""}`;
  const mentionsLargeUnit = /hectare|hectárea|manzana/i.test(description);
  const lotSizeUnitWarning = mentionsLargeUnit && lotSizeM2 !== null && lotSizeM2 < 1000;

  // ExpirationDate is unreliable in the REMAX CCA feed — all properties
  // present in the API response are considered active. Expiration-based
  // soft-deletion is disabled; removal is driven solely by absence from the feed.
  const isExpired = false;

  const isCrc = p.CurrencyId === 12 || /crc|colon/i.test(p.CurrencyListPrice ?? "");
  const priceUsd = isCrc ? Math.round(p.ListPrice / getCrcToUsdRate()) : p.ListPrice;

  return {
    apiId: p.ListingId,
    apiKey: p.ListingKey,
    propertyTypeEn: p.PropertyTypeName_en,
    propertyTypeEs: p.PropertyTypeName_es,
    listingType: resolveListingType(p),
    titleEn,
    titleEs,
    publicRemarksEn: p.PublicRemarks_en ?? null,
    publicRemarksEs: p.publicRemarks_es ?? null,
    latitude: p.Latitude,
    longitude: p.Longitude,
    priceUsd,
    currency: isCrc ? "CRC" : "USD",
    currencyId: p.CurrencyId,
    currencyListPrice: p.CurrencyListPrice,
    bedrooms: p.BedroomsTotal ?? null,
    bathrooms: p.BathroomsFull ?? null,
    stories: p.Stories ?? 0,
    lotSizeM2,
    constructionM2: p.ConstructionSize,
    images: splitAndEncodeImages(p.Images),
    videoUrl:
      p.Videolink ??
      (p.EmbeddedVideoCode ? `https://www.youtube.com/watch?v=${p.EmbeddedVideoCode}` : null),
    expirationDate: p.ExpirationDate,
    isExpired,
    lotSizeUnitWarning,
    agentApiId: p.AssociateId,
    officeApiId: p.OfficeID,
    amenities: {
      furnished: p.Furnishedyn,
      pool: p.PoolPrivate,
      garage: p.Garage,
      garageCovered: p.GarageCovered ?? false,
      garageOpen: p.GarageOpen ?? false,
      garageSpaces: p.GarageSpaces ?? 0,
      cooling: p.Cooling,
      view: p.Viewyn,
      gated: p.GatedCommunity,
      maidRoom: p.MaidRoom,
    },
    apiStatus: p.Status,
    unparsedAddress: p.UnparsedAddress ?? null,
    country: p.Country ?? null,
    stateProv: p.StateDepProv ?? null,
    location: p.Location ?? null,
  };
});

type RawPropertySchemaOutput = z.infer<typeof rawPropertyApiSchema>;

/** Narrow Y/N-derived boolean bag exposed on `RawProperty.amenities`. */
export type RawPropertyAmenities = RawPropertySchemaOutput["amenities"];

/**
 * Normalized, downstream-safe shape of a REMAX property record. Coordinates
 * are numbers (or `null`), images are split and URL-encoded, and `apiRaw`
 * preserves the untouched original payload for Story 2.3's JSONB column.
 * Derived via `z.infer` on the schema (single source of truth) plus the
 * parser-supplied `apiRaw` pass-through.
 */
export type RawProperty = RawPropertySchemaOutput & { apiRaw: unknown };
