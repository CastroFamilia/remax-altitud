/**
 * Story 4.4: SEO Architecture & WordPress Redirects
 * Unit tests for JSON-LD generator functions in src/lib/seo/structured-data.ts
 *
 * TDD Phase: RED — all tests are it() until structured-data.ts is implemented.
 * Remove it() per test when implementing to verify green phase.
 *
 * Covers:
 *   4.4-UNIT-001 — generateListingJsonLd() produces valid RealEstateListing JSON-LD (AC #1, R-004)
 *   4.4-UNIT-002 — generateAgentJsonLd() produces valid RealEstateAgent JSON-LD (AC #2, R-004)
 *   4.4-UNIT-005 — generateBreadcrumbJsonLd() produces valid BreadcrumbList JSON-LD (AC #4, R-004)
 *   (Place/generatePlaceJsonLd covered as bonus — AC #3)
 *
 * Environment: node (no JSX — .spec.ts runs in node environment by default)
 */

import { vi, describe, it, expect, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Module mocks — MUST appear BEFORE any imports of the module under test
// ---------------------------------------------------------------------------

// Mock server-only to avoid "This module cannot be imported in a client context"
vi.mock("server-only", () => ({}));

// Mock schema imports to avoid triggering DB connection at module load time
vi.mock("@/lib/db/schema/properties", () => ({ properties: {} }));
vi.mock("@/lib/db/schema/agents", () => ({ agents: {} }));
vi.mock("@/lib/db/schema/areas", () => ({ areas: {} }));

// Mock SEO constants module (imported by structured-data.ts)
vi.mock("@/lib/seo/constants", () => ({
  SITE_ORIGIN: "https://remax-altitud.cr",
  LOCALES: ["en", "es"],
}));

// ---------------------------------------------------------------------------
// Imports — AFTER mocks
// ---------------------------------------------------------------------------

// imported AFTER mocks
import {
  generateListingJsonLd,
  generateAgentJsonLd,
  generateBreadcrumbJsonLd,
  generatePlaceJsonLd,
} from "@/lib/seo/structured-data";

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const mockProperty = {
  id: "prop-uuid-1",
  slug: "beautiful-mountain-home",
  titleEn: "Beautiful Mountain Home",
  titleEs: "Hermosa Casa de Montaña",
  descriptionEn: "A stunning 3-bedroom home in the mountains.",
  descriptionEs: "Una impresionante casa de 3 habitaciones en las montañas.",
  priceUsd: 250000,
  bedrooms: 3,
  bathrooms: 2,
  constructionM2: 180,
  latitude: 9.3623,
  longitude: -83.7834,
  areaSlug: "perez-zeledon",
  images: [
    { src: "https://example.com/img1.webp" },
    { src: "https://example.com/img2.webp" },
  ],
  isVisible: true,
  // Optional/nullable fields
  lotM2: null,
  priceColones: null,
  garage: null,
  pool: null,
  beachFront: null,
  mountainView: null,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

const mockPropertyNoGeo = {
  ...mockProperty,
  id: "prop-uuid-2",
  slug: "city-apartment",
  latitude: null,
  longitude: null,
};

const mockAgent = {
  id: "agent-uuid-1",
  slug: "emma-smith",
  name: "Emma Smith",
  bioEn: "Mountain specialist with 10+ years experience.",
  bioEs: "Especialista en montaña con más de 10 años de experiencia.",
  photoOptimizedUrl: "/agent-photos/emma.webp",
  photoUrl: "/agent-photos/emma-original.jpg",
  phone: "+506 8800-0000",
  email: "emma@remax-altitud.cr",
  officeId: "office-uuid-1",
  languagesSpoken: ["en", "es"],
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

const mockAgentNoOptimizedPhoto = {
  ...mockAgent,
  id: "agent-uuid-2",
  slug: "john-doe",
  photoOptimizedUrl: null,
};

const mockArea = {
  id: "area-uuid-1",
  slug: "perez-zeledon",
  nameEn: "Pérez Zeledón",
  nameEs: "Pérez Zeledón",
  region: "Southern Zone",
  descriptionEn: "A beautiful valley in the Southern Zone of Costa Rica.",
  descriptionEs: "Un hermoso valle en la Zona Sur de Costa Rica.",
  propertyCount: 0,
  sortOrder: 0,
  metadata: {},
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

// ---------------------------------------------------------------------------
// 4.4-UNIT-001: generateListingJsonLd
// ---------------------------------------------------------------------------

describe("generateListingJsonLd (4.4-UNIT-001)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it(
    "[P0] 4.4-UNIT-001a: returns object with @type: 'RealEstateListing'",
    () => {
      const result = generateListingJsonLd(mockProperty as never, "en");
      expect(result).toHaveProperty("@type", "RealEstateListing");
    },
  );

  it(
    "[P0] 4.4-UNIT-001b: includes @context: 'https://schema.org'",
    () => {
      const result = generateListingJsonLd(mockProperty as never, "en");
      expect(result).toHaveProperty("@context", "https://schema.org");
    },
  );

  it(
    "[P0] 4.4-UNIT-001c: includes price equal to property.priceUsd",
    () => {
      const result = generateListingJsonLd(mockProperty as never, "en") as Record<string, unknown>;
      expect(result["price"]).toBe(250000);
    },
  );

  it(
    "[P0] 4.4-UNIT-001d: includes address with @type: 'PostalAddress' and addressCountry: 'CR'",
    () => {
      const result = generateListingJsonLd(mockProperty as never, "en") as Record<string, unknown>;
      const address = result["address"] as Record<string, unknown>;
      expect(address).toBeDefined();
      expect(address["@type"]).toBe("PostalAddress");
      expect(address["addressCountry"]).toBe("CR");
    },
  );

  it(
    "[P0] 4.4-UNIT-001e: includes geo with latitude and longitude when property has coordinates",
    () => {
      const result = generateListingJsonLd(mockProperty as never, "en") as Record<string, unknown>;
      const geo = result["geo"] as Record<string, unknown>;
      expect(geo).toBeDefined();
      expect(geo["@type"]).toBe("GeoCoordinates");
      expect(geo["latitude"]).toBe(9.3623);
      expect(geo["longitude"]).toBe(-83.7834);
    },
  );

  it(
    "[P0] 4.4-UNIT-001f: includes image array with image URLs",
    () => {
      const result = generateListingJsonLd(mockProperty as never, "en") as Record<string, unknown>;
      const images = result["image"] as string[];
      expect(Array.isArray(images)).toBe(true);
      expect(images).toContain("https://example.com/img1.webp");
    },
  );

  it(
    "[P0] 4.4-UNIT-001g: includes description from descriptionEn when locale is 'en'",
    () => {
      const result = generateListingJsonLd(mockProperty as never, "en") as Record<string, unknown>;
      expect(result["description"]).toBe("A stunning 3-bedroom home in the mountains.");
    },
  );

  it(
    "[P1] 4.4-UNIT-001h: uses descriptionEs when locale is 'es'",
    () => {
      const result = generateListingJsonLd(mockProperty as never, "es") as Record<string, unknown>;
      expect(result["description"]).toBe(
        "Una impresionante casa de 3 habitaciones en las montañas.",
      );
    },
  );

  it(
    "[P1] 4.4-UNIT-001i: omits geo when latitude and longitude are null",
    () => {
      const result = generateListingJsonLd(mockPropertyNoGeo as never, "en") as Record<
        string,
        unknown
      >;
      expect(result["geo"]).toBeUndefined();
    },
  );

  it(
    "[P1] 4.4-UNIT-001j: URL includes locale prefix and property slug",
    () => {
      const result = generateListingJsonLd(mockProperty as never, "en") as Record<string, unknown>;
      expect(result["url"]).toBe(
        "https://remax-altitud.cr/en/property/beautiful-mountain-home",
      );
    },
  );

  it(
    "[P1] 4.4-UNIT-001k: URL uses 'es' locale when locale is 'es'",
    () => {
      const result = generateListingJsonLd(mockProperty as never, "es") as Record<string, unknown>;
      expect(result["url"]).toBe(
        "https://remax-altitud.cr/es/property/beautiful-mountain-home",
      );
    },
  );

  it(
    "[P1] 4.4-UNIT-001l: includes priceCurrency: 'USD'",
    () => {
      const result = generateListingJsonLd(mockProperty as never, "en") as Record<string, unknown>;
      expect(result["priceCurrency"]).toBe("USD");
    },
  );
});

// ---------------------------------------------------------------------------
// 4.4-UNIT-002: generateAgentJsonLd
// ---------------------------------------------------------------------------

describe("generateAgentJsonLd (4.4-UNIT-002)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it(
    "[P0] 4.4-UNIT-002a: returns object with @type: 'RealEstateAgent'",
    () => {
      const result = generateAgentJsonLd(mockAgent as never, "en");
      expect(result).toHaveProperty("@type", "RealEstateAgent");
    },
  );

  it(
    "[P0] 4.4-UNIT-002b: includes @context: 'https://schema.org'",
    () => {
      const result = generateAgentJsonLd(mockAgent as never, "en");
      expect(result).toHaveProperty("@context", "https://schema.org");
    },
  );

  it(
    "[P0] 4.4-UNIT-002c: includes name equal to agent.name",
    () => {
      const result = generateAgentJsonLd(mockAgent as never, "en") as Record<string, unknown>;
      expect(result["name"]).toBe("Emma Smith");
    },
  );

  it(
    "[P0] 4.4-UNIT-002d: includes image from photoOptimizedUrl",
    () => {
      const result = generateAgentJsonLd(mockAgent as never, "en") as Record<string, unknown>;
      expect(result["image"]).toBe("/agent-photos/emma.webp");
    },
  );

  it(
    "[P0] 4.4-UNIT-002e: includes telephone from agent.phone",
    () => {
      const result = generateAgentJsonLd(mockAgent as never, "en") as Record<string, unknown>;
      expect(result["telephone"]).toBe("+506 8800-0000");
    },
  );

  it(
    "[P0] 4.4-UNIT-002f: includes areaServed with @type: 'Place' and addressCountry: 'CR'",
    () => {
      const result = generateAgentJsonLd(mockAgent as never, "en") as Record<string, unknown>;
      const areaServed = result["areaServed"] as Record<string, unknown>;
      expect(areaServed).toBeDefined();
      expect(areaServed["@type"]).toBe("Place");
      expect(areaServed["addressCountry"]).toBe("CR");
    },
  );

  it(
    "[P1] 4.4-UNIT-002g: falls back to photoUrl when photoOptimizedUrl is null",
    () => {
      const result = generateAgentJsonLd(mockAgentNoOptimizedPhoto as never, "en") as Record<
        string,
        unknown
      >;
      expect(result["image"]).toBe("/agent-photos/emma-original.jpg");
    },
  );

  it(
    "[P1] 4.4-UNIT-002h: URL includes locale prefix and agent slug",
    () => {
      const result = generateAgentJsonLd(mockAgent as never, "en") as Record<string, unknown>;
      expect(result["url"]).toBe("https://remax-altitud.cr/en/agents/emma-smith");
    },
  );

  it(
    "[P1] 4.4-UNIT-002i: uses bioEs for description when locale is 'es'",
    () => {
      const result = generateAgentJsonLd(mockAgent as never, "es") as Record<string, unknown>;
      expect(result["description"]).toContain("Especialista en montaña");
    },
  );

  it(
    "[P1] 4.4-UNIT-002j: includes email when present",
    () => {
      const result = generateAgentJsonLd(mockAgent as never, "en") as Record<string, unknown>;
      expect(result["email"]).toBe("emma@remax-altitud.cr");
    },
  );
});

// ---------------------------------------------------------------------------
// 4.4-UNIT-005: generateBreadcrumbJsonLd
// ---------------------------------------------------------------------------

describe("generateBreadcrumbJsonLd (4.4-UNIT-005)", () => {
  const breadcrumbItems = [
    { position: 1, name: "Home", href: "https://remax-altitud.cr/en" },
    { position: 2, name: "Search", href: "https://remax-altitud.cr/en/search" },
    {
      position: 3,
      name: "Beautiful Mountain Home",
      href: "https://remax-altitud.cr/en/property/beautiful-mountain-home",
    },
  ];

  it(
    "[P0] 4.4-UNIT-005a: returns object with @type: 'BreadcrumbList'",
    () => {
      const result = generateBreadcrumbJsonLd(breadcrumbItems);
      expect(result).toHaveProperty("@type", "BreadcrumbList");
    },
  );

  it(
    "[P0] 4.4-UNIT-005b: includes @context: 'https://schema.org'",
    () => {
      const result = generateBreadcrumbJsonLd(breadcrumbItems);
      expect(result).toHaveProperty("@context", "https://schema.org");
    },
  );

  it(
    "[P0] 4.4-UNIT-005c: itemListElement is an array with correct length",
    () => {
      const result = generateBreadcrumbJsonLd(breadcrumbItems) as Record<string, unknown>;
      const items = result["itemListElement"] as unknown[];
      expect(Array.isArray(items)).toBe(true);
      expect(items).toHaveLength(3);
    },
  );

  it(
    "[P0] 4.4-UNIT-005d: each item has @type: 'ListItem', position, name, and item (href)",
    () => {
      const result = generateBreadcrumbJsonLd(breadcrumbItems) as Record<string, unknown>;
      const items = result["itemListElement"] as Record<string, unknown>[];

      for (const item of items) {
        expect(item["@type"]).toBe("ListItem");
        expect(typeof item["position"]).toBe("number");
        expect(typeof item["name"]).toBe("string");
        expect(typeof item["item"]).toBe("string");
      }
    },
  );

  it(
    "[P1] 4.4-UNIT-005e: positions are correctly numbered (1-based)",
    () => {
      const result = generateBreadcrumbJsonLd(breadcrumbItems) as Record<string, unknown>;
      const items = result["itemListElement"] as Record<string, unknown>[];
      expect(items[0]?.["position"]).toBe(1);
      expect(items[1]?.["position"]).toBe(2);
      expect(items[2]?.["position"]).toBe(3);
    },
  );

  it(
    "[P1] 4.4-UNIT-005f: item (href) values match the provided breadcrumb hrefs",
    () => {
      const result = generateBreadcrumbJsonLd(breadcrumbItems) as Record<string, unknown>;
      const items = result["itemListElement"] as Record<string, unknown>[];
      expect(items[0]?.["item"]).toBe("https://remax-altitud.cr/en");
      expect(items[2]?.["item"]).toBe(
        "https://remax-altitud.cr/en/property/beautiful-mountain-home",
      );
    },
  );

  it(
    "[P1] 4.4-UNIT-005g: name values match the provided breadcrumb names",
    () => {
      const result = generateBreadcrumbJsonLd(breadcrumbItems) as Record<string, unknown>;
      const items = result["itemListElement"] as Record<string, unknown>[];
      expect(items[0]?.["name"]).toBe("Home");
      expect(items[1]?.["name"]).toBe("Search");
      expect(items[2]?.["name"]).toBe("Beautiful Mountain Home");
    },
  );

  it(
    "[P2] 4.4-UNIT-005h: handles single-item breadcrumb (e.g. homepage only)",
    () => {
      const singleItem = [{ position: 1, name: "Home", href: "https://remax-altitud.cr/en" }];
      const result = generateBreadcrumbJsonLd(singleItem) as Record<string, unknown>;
      const items = result["itemListElement"] as unknown[];
      expect(items).toHaveLength(1);
    },
  );
});

// ---------------------------------------------------------------------------
// generatePlaceJsonLd — AC #3 (area pages, Epic 6 scope but generator is created now)
// ---------------------------------------------------------------------------

describe("generatePlaceJsonLd (AC #3 — Place schema for area pages)", () => {
  it(
    "[P1] returns object with @type: 'Place'",
    () => {
      const result = generatePlaceJsonLd(mockArea as never, "en");
      expect(result).toHaveProperty("@type", "Place");
    },
  );

  it(
    "[P1] includes area name for locale 'en'",
    () => {
      const result = generatePlaceJsonLd(mockArea as never, "en") as Record<string, unknown>;
      expect(result["name"]).toBe("Pérez Zeledón");
    },
  );

  it(
    "[P1] includes area description from descriptionEn for locale 'en'",
    () => {
      const result = generatePlaceJsonLd(mockArea as never, "en") as Record<string, unknown>;
      expect(result["description"]).toContain("beautiful valley");
    },
  );

  it(
    "[P1] includes address with addressCountry: 'CR'",
    () => {
      const result = generatePlaceJsonLd(mockArea as never, "en") as Record<string, unknown>;
      const address = result["address"] as Record<string, unknown>;
      expect(address["addressCountry"]).toBe("CR");
    },
  );

  it(
    "[P1] URL includes locale prefix and area slug",
    () => {
      const result = generatePlaceJsonLd(mockArea as never, "en") as Record<string, unknown>;
      expect(result["url"]).toBe("https://remax-altitud.cr/en/areas/perez-zeledon");
    },
  );
});
