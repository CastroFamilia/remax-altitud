/**
 * Shared test factories for Story 2.3 unit tests.
 * Extracted to avoid duplication across differ.spec.ts, pipeline*.spec.ts.
 *
 * All factories use fixed / deterministic values by default.
 * Use override params to vary specific fields per test.
 */

import type { RawProperty, RawAgent } from "@/types/remax-api";

/** Fixed reference timestamp used in sync-log factories (deterministic). */
export const FIXED_STARTED_AT = new Date("2026-04-25T12:00:00.000Z");

// ---------------------------------------------------------------------------
// RawProperty factory
// ---------------------------------------------------------------------------

/**
 * Creates a minimal, fully-typed RawProperty with deterministic defaults.
 * All fields required by computePropertyHash and diffProperties are populated.
 */
export function makeRawProperty(overrides: Partial<RawProperty> = {}): RawProperty {
  return {
    apiId: "113149",
    apiKey: "400142400001",
    officeId: "FEA8746D-CC1D-41B8-89F3-D04AC98274AF",
    officeApiId: 218,
    agentApiId: "2400",
    propertyTypeEn: "Lot/Land",
    propertyTypeEs: "Lote/Terreno",
    contractTypeEn: "Sale",
    contractTypeEs: "Venta",
    titleEn: "Mountain View Land",
    titleEs: "Terreno con vista",
    publicRemarksEn: "A great land parcel.",
    publicRemarksEs: "Un buen terreno.",
    apiStatus: "Active",
    priceUsd: 199000,
    currencyId: 1,
    currencyListPrice: "199000",
    stories: 0,
    latitude: 9.3549572,
    longitude: -83.6350214,
    bedrooms: null,
    bathrooms: null,
    lotSizeM2: 14757,
    constructionM2: 0,
    images: ["https://cdn.example.com/photo1.jpg"],
    amenities: {
      garage: false,
      garageCovered: false,
      garageOpen: false,
      garageSpaces: 0,
      maidRoom: false,
      cooling: false,
      pool: false,
      view: true,
      gated: false,
      furnished: false,
    },
    slug: null,
    videoUrl: null,
    address: "San Francisco, Perez Zeledon",
    agentFirstName: "Emma",
    agentLastName: "Bennett",
    agentId: "2400",
    expirationDate: null,
    unparsedAddress: null,
    country: null,
    stateProv: null,
    location: null,
    isExpired: false,
    lotSizeUnitWarning: false,
    apiRaw: {},
    ...overrides,
  } as RawProperty;
}

// ---------------------------------------------------------------------------
// RawAgent factory
// ---------------------------------------------------------------------------

export function makeRawAgent(overrides: Partial<RawAgent> = {}): RawAgent {
  return {
    apiId: "2400",
    name: "Emma Bennett",
    firstName: "Emma",
    lastName: "Bennett",
    email: "emma@remax-altitud.cr",
    phone: "+50688887777",
    whatsapp: "+50688887777",
    role: "owner",
    primaryLang: "en",
    officeApiId: 218,
    officeId: "FEA8746D-CC1D-41B8-89F3-D04AC98274AF",
    photoUrl: "https://cdn.example.com/emma.jpg",
    apiRaw: {},
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// SyncLog factory
// ---------------------------------------------------------------------------

export interface SyncLogShape {
  id: string;
  status: string;
  startedAt: Date;
  completedAt: Date | null;
  propertiesFetched: number;
  propertiesCreated: number;
  propertiesUpdated: number;
  propertiesRemoved: number;
  agentsSynced: number;
  imagesOptimized: number;
  /** Story 2.5: count of new+updated listings sent to the DeepL translation batch. */
  translationsQueued?: number;
  errors: unknown[];
  errorMessage: string | null;
}

/**
 * Creates a minimal SyncLog shape with a fixed startedAt timestamp.
 * Uses FIXED_STARTED_AT to keep tests deterministic.
 *
 * Story 2.5 added `translationsQueued` to the sync log. Pipeline tests use
 * `expect.objectContaining({ translationsQueued: N })` so the factory default
 * (undefined) is intentionally omitted — override via `makeSyncLog({ translationsQueued: 0 })`.
 */
export function makeSyncLog(overrides: Partial<SyncLogShape> = {}): SyncLogShape {
  return {
    id: "sync-log-uuid-1",
    status: "running",
    startedAt: FIXED_STARTED_AT,
    completedAt: null,
    propertiesFetched: 0,
    propertiesCreated: 0,
    propertiesUpdated: 0,
    propertiesRemoved: 0,
    agentsSynced: 0,
    imagesOptimized: 0,
    errors: [],
    errorMessage: null,
    ...overrides,
  };
}
