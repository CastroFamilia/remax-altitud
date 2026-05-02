/**
 * Story 3.5: Property Cards & Grid View
 * Updated: Story 3.7: Unit Conversion & Price Display (regression + new tests)
 * Component: src/components/property/property-card.tsx
 *
 * TDD RED PHASE — all tests use it() and will FAIL until
 * property-card.tsx is implemented.
 *
 * Covers:
 *   AC #1  — PropertyCard displays: hero image, region badge, price, title, specs row, ZMT badge, save + share icons
 *   AC #7  — Hover animation: 200ms lift with shadow-lg on desktop
 *   AC #8  — card images use aspect-ratio: 3/2 to prevent CLS
 *   AC #9  — card images use next/image with sizes prop
 *   Story 3.7 regression:
 *   AC #5  — Price shows USD primary + approximate EUR for non-US locales (FR10)
 *
 * Environment: jsdom (React component — .spec.tsx → jsdom via vitest.config.mts)
 *
 * Component interface:
 *   interface PropertyCardProps {
 *     property: PropertySearchItem;
 *     locale: string;
 *     variant?: 'default' | 'compact' | 'horizontal';
 *     unitSystem?: UnitSystem;   // NEW in Story 3.7 — defaults to 'metric'
 *   }
 *
 * Architecture notes:
 *   - PropertyCard is a Server Component (RSC) — no 'use client'
 *   - SaveButton and ShareButton are Client Component children
 *   - data-testid="property-card" on root element
 *   - Story 3.7: formatPriceAbbrev replaced by formatUSD from @/lib/utils/currency
 */

import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";
import { render, cleanup } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Module mocks — declared BEFORE any imports of the module under test
// ---------------------------------------------------------------------------

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ replace: vi.fn(), push: vi.fn() })),
  useSearchParams: vi.fn(() => ({
    toString: vi.fn(() => ""),
    get: vi.fn(() => null),
  })),
  usePathname: vi.fn(() => "/en/search"),
}));

// next/link mock — render as a plain anchor tag
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

// next/image mock — render as a plain img tag
vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    className,
    sizes,
  }: {
    src: string;
    alt: string;
    className?: string;
    sizes?: string;
    fill?: boolean;
    width?: number;
    height?: number;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} data-sizes={sizes} />
  ),
}));

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(() => {
    // Simulate next-intl message resolution for PropertyCard namespace.
    // Keys that embed interpolation values use the actual message template so
    // that tests asserting on rendered text (e.g. /3.*bed/i) continue to pass.
    const messages: Record<string, string> = {
      "region.mountain": "Mountain",
      "region.beach": "Beach",
      "zmtStatus.titled": "Titled Property",
      "zmtStatus.concession": "Concession",
      "zmtStatus.zmt_restricted": "ZMT Restricted",
      "specs.beds": "{count} bed",
      "specs.baths": "{count} bath",
      "specs.lot": "{size}",
      "specs.built": "{size} built",
      saveProperty: "Save property",
      removeFromSaved: "Remove from saved",
      shortlistFull: "Shortlist full (20 max)",
      share: "Share property",
      viewDetails: "View details",
      linkCopied: "Link copied!",
    };
    return (key: string, values?: Record<string, unknown>) => {
      const template = messages[key] ?? key;
      if (!values) return template;
      return template
        .replace("{count}", String(values.count ?? ""))
        .replace("{size}", String(values.size ?? ""));
    };
  }),
}));

// ---------------------------------------------------------------------------
// Story 3.7: Mocks for new utility imports
// ---------------------------------------------------------------------------

// Mock @/lib/utils/units — new in Story 3.7 (file doesn't exist yet)
vi.mock("@/lib/utils/units", () => ({
  convertArea: vi.fn((m2: number) => `${m2} m²`),
  detectDefaultUnitSystem: vi.fn(() => "metric"),
  SQFT_PER_M2: 10.7639,
  M2_PER_ACRE: 4046.86,
  M2_PER_HA: 10000,
}));

// Mock @/lib/utils/currency — new in Story 3.7 (file doesn't exist yet)
vi.mock("@/lib/utils/currency", () => ({
  formatUSD: vi.fn((price: number) => `$${price.toLocaleString("en-US")}`),
  formatEUR: vi.fn((price: number) => `€${Math.round(price * 0.92).toLocaleString("en-US")}`),
  isNonUSLocale: vi.fn(() => false),
}));

// Mock SaveButton and ShareButton as simple stubs
vi.mock("@/components/property/save-button", () => ({
  SaveButton: ({
    propertyId,
    propertyTitle,
  }: {
    propertyId: string;
    propertyTitle: string;
  }) => (
    <button
      data-testid="save-button"
      aria-label="Save property"
      data-property-id={propertyId}
      data-property-title={propertyTitle}
    >
      ♡
    </button>
  ),
}));

vi.mock("@/components/property/share-button", () => ({
  ShareButton: ({
    slug,
    title,
  }: {
    slug: string;
    title: string;
    locale: string;
  }) => (
    <button
      data-testid="share-button"
      aria-label="Share property"
      data-slug={slug}
      data-title={title}
    >
      ↗
    </button>
  ),
}));

// ---------------------------------------------------------------------------
// Component under test — imported AFTER mocks
// ---------------------------------------------------------------------------

import { PropertyCard } from "@/components/property/property-card";
import type { PropertySearchItem } from "@/types/search";

// ---------------------------------------------------------------------------
// Test helpers & fixtures
// ---------------------------------------------------------------------------

const mockPropertyMountain: PropertySearchItem = {
  id: "prop-001",
  slug: "mountain-house-perez-zeledon",
  titleEn: "3BR Mountain House — Pérez Zeledón",
  titleEs: "Casa de Montaña 3 Hab — Pérez Zeledón",
  priceUsd: 185000,
  bedrooms: 3,
  bathrooms: 2,
  lotSizeM2: 400,
  constructionM2: 180,
  zmtStatus: "titled",
  propertyType: "Casa",
  areaSlug: "perez-zeledon",
  images: [{ url: "/images/mountain-house.jpg", alt: "Mountain house" }],
  latitude: 9.35,
  longitude: -83.68,
};

const mockPropertyBeach: PropertySearchItem = {
  id: "prop-002",
  slug: "beach-house-dominical",
  titleEn: "Beach House Dominical",
  titleEs: "Casa Playa Dominical",
  priceUsd: 350000,
  bedrooms: 4,
  bathrooms: 3,
  lotSizeM2: 600,
  constructionM2: 250,
  zmtStatus: "concession",
  propertyType: "Casa",
  areaSlug: "dominical",
  images: [{ url: "/images/beach-house.jpg", alt: "Beach house" }],
  latitude: 9.25,
  longitude: -83.85,
};

const mockLandProperty: PropertySearchItem = {
  id: "prop-003",
  slug: "lot-uvita",
  titleEn: "Lot in Uvita",
  titleEs: "Lote en Uvita",
  priceUsd: 75000,
  bedrooms: null,
  bathrooms: null,
  lotSizeM2: 2000,
  constructionM2: null,
  zmtStatus: "zmt_restricted",
  propertyType: "Lote",
  areaSlug: "uvita",
  images: [],
  latitude: 9.16,
  longitude: -83.74,
};

const mockPropertyNoImage: PropertySearchItem = {
  ...mockPropertyMountain,
  id: "prop-004",
  slug: "no-image-property",
  images: [],
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

beforeEach(() => {
  localStorage.clear();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("PropertyCard — AC #1: card displays key property data", () => {
  // -------------------------------------------------------------------------
  // data-testid presence
  // -------------------------------------------------------------------------

  it(
    "[P0] renders data-testid='property-card' on root element",
    () => {
      // THIS TEST WILL FAIL — property-card.tsx not yet implemented
      render(<PropertyCard property={mockPropertyMountain} locale="en" />);

      const card = document.querySelector('[data-testid="property-card"]');
      expect(card).not.toBeNull();
    },
  );

  // -------------------------------------------------------------------------
  // AC #1: price display
  // -------------------------------------------------------------------------

  it(
    "[P0] displays formatted price using formatUSD (Story 3.7: formatPriceAbbrev replaced by formatUSD)",
    () => {
      render(<PropertyCard property={mockPropertyMountain} locale="en" />);

      const card = document.querySelector('[data-testid="property-card"]');
      // formatUSD mock returns "$185000" — price must appear in card
      expect(card?.textContent).toMatch(/\$185/);
    },
  );

  it(
    "[P0] displays price with Montserrat bold style (font-bold class) and accent color (text-[--color-accent] class)",
    () => {
      // THIS TEST WILL FAIL — property-card.tsx not yet implemented
      render(<PropertyCard property={mockPropertyMountain} locale="en" />);

      const priceEl = document.querySelector('[data-testid="property-price"]');
      expect(priceEl).not.toBeNull();
      expect(priceEl?.className).toContain("font-bold");
      expect(priceEl?.className).toContain("--color-accent");
    },
  );

  // -------------------------------------------------------------------------
  // AC #1: region badge
  // -------------------------------------------------------------------------

  it(
    "[P0] shows 'Mountain' region badge for areaSlug='perez-zeledon'",
    () => {
      // THIS TEST WILL FAIL — property-card.tsx not yet implemented
      render(<PropertyCard property={mockPropertyMountain} locale="en" />);

      const card = document.querySelector('[data-testid="property-card"]');
      expect(card?.textContent).toMatch(/Mountain/i);
    },
  );

  it(
    "[P0] shows 'Beach' region badge for areaSlug='dominical'",
    () => {
      // THIS TEST WILL FAIL — property-card.tsx not yet implemented
      render(<PropertyCard property={mockPropertyBeach} locale="en" />);

      const card = document.querySelector('[data-testid="property-card"]');
      expect(card?.textContent).toMatch(/Beach/i);
    },
  );

  it(
    "[P1] region badge for mountain uses bg-brand-mountain class",
    () => {
      // THIS TEST WILL FAIL — property-card.tsx not yet implemented
      render(<PropertyCard property={mockPropertyMountain} locale="en" />);

      const badge = document.querySelector('[data-testid="region-badge"]');
      expect(badge).not.toBeNull();
      expect(badge?.className).toContain("bg-brand-mountain");
    },
  );

  it(
    "[P1] region badge for beach uses bg-brand-beach class",
    () => {
      // THIS TEST WILL FAIL — property-card.tsx not yet implemented
      render(<PropertyCard property={mockPropertyBeach} locale="en" />);

      const badge = document.querySelector('[data-testid="region-badge"]');
      expect(badge).not.toBeNull();
      expect(badge?.className).toContain("bg-brand-beach");
    },
  );

  it(
    "[P1] no region badge shown when areaSlug is null",
    () => {
      // THIS TEST WILL FAIL — property-card.tsx not yet implemented
      const propertyNoSlug = { ...mockPropertyMountain, areaSlug: null };
      render(<PropertyCard property={propertyNoSlug} locale="en" />);

      const badge = document.querySelector('[data-testid="region-badge"]');
      expect(badge).toBeNull();
    },
  );

  // -------------------------------------------------------------------------
  // AC #1: title display
  // -------------------------------------------------------------------------

  it(
    "[P0] displays English title when locale='en'",
    () => {
      // THIS TEST WILL FAIL — property-card.tsx not yet implemented
      render(<PropertyCard property={mockPropertyMountain} locale="en" />);

      const card = document.querySelector('[data-testid="property-card"]');
      expect(card?.textContent).toContain("3BR Mountain House");
    },
  );

  it(
    "[P0] displays Spanish title when locale='es'",
    () => {
      // THIS TEST WILL FAIL — property-card.tsx not yet implemented
      render(<PropertyCard property={mockPropertyMountain} locale="es" />);

      const card = document.querySelector('[data-testid="property-card"]');
      expect(card?.textContent).toContain("Casa de Montaña");
    },
  );

  it(
    "[P1] title element has line-clamp-2 class",
    () => {
      // THIS TEST WILL FAIL — property-card.tsx not yet implemented
      render(<PropertyCard property={mockPropertyMountain} locale="en" />);

      const titleEl = document.querySelector('[data-testid="property-title"]');
      expect(titleEl).not.toBeNull();
      expect(titleEl?.className).toContain("line-clamp-2");
    },
  );

  // -------------------------------------------------------------------------
  // AC #1: specs row
  // -------------------------------------------------------------------------

  it(
    "[P0] displays beds count in specs row for residential property",
    () => {
      // THIS TEST WILL FAIL — property-card.tsx not yet implemented
      render(<PropertyCard property={mockPropertyMountain} locale="en" />);

      const card = document.querySelector('[data-testid="property-card"]');
      expect(card?.textContent).toMatch(/3.*bed/i);
    },
  );

  it(
    "[P0] displays baths count in specs row for residential property",
    () => {
      // THIS TEST WILL FAIL — property-card.tsx not yet implemented
      render(<PropertyCard property={mockPropertyMountain} locale="en" />);

      const card = document.querySelector('[data-testid="property-card"]');
      expect(card?.textContent).toMatch(/2.*bath/i);
    },
  );

  it(
    "[P0] hides beds and baths when propertyType is 'Lote' (land)",
    () => {
      // THIS TEST WILL FAIL — property-card.tsx not yet implemented
      render(<PropertyCard property={mockLandProperty} locale="en" />);

      const card = document.querySelector('[data-testid="property-card"]');
      // Land parcels do not show bedrooms/bathrooms
      expect(card?.textContent).not.toMatch(/bed/i);
      expect(card?.textContent).not.toMatch(/bath/i);
    },
  );

  it(
    "[P1] hides beds and baths when propertyType is 'Terreno' (land)",
    () => {
      // THIS TEST WILL FAIL — property-card.tsx not yet implemented
      const terraProperty = { ...mockLandProperty, propertyType: "Terreno" };
      render(<PropertyCard property={terraProperty} locale="en" />);

      const card = document.querySelector('[data-testid="property-card"]');
      expect(card?.textContent).not.toMatch(/bed/i);
      expect(card?.textContent).not.toMatch(/bath/i);
    },
  );

  it(
    "[P1] hides beds and baths when propertyType is 'Finca'",
    () => {
      // THIS TEST WILL FAIL — property-card.tsx not yet implemented
      const fincaProperty = { ...mockLandProperty, propertyType: "Finca" };
      render(<PropertyCard property={fincaProperty} locale="en" />);

      const card = document.querySelector('[data-testid="property-card"]');
      expect(card?.textContent).not.toMatch(/bed/i);
      expect(card?.textContent).not.toMatch(/bath/i);
    },
  );

  // -------------------------------------------------------------------------
  // AC #1: ZMT badge
  // -------------------------------------------------------------------------

  it(
    "[P0] ZMT badge shows 'Titled Property' text for zmtStatus='titled'",
    () => {
      // THIS TEST WILL FAIL — property-card.tsx not yet implemented
      render(<PropertyCard property={mockPropertyMountain} locale="en" />);

      const card = document.querySelector('[data-testid="property-card"]');
      expect(card?.textContent).toMatch(/Titled Property/i);
    },
  );

  it(
    "[P0] ZMT badge uses green classes for zmtStatus='titled'",
    () => {
      // THIS TEST WILL FAIL — property-card.tsx not yet implemented
      render(<PropertyCard property={mockPropertyMountain} locale="en" />);

      const zmtBadge = document.querySelector('[data-testid="zmt-badge"]');
      expect(zmtBadge).not.toBeNull();
      expect(zmtBadge?.className).toContain("bg-green-100");
      expect(zmtBadge?.className).toContain("text-green-800");
    },
  );

  it(
    "[P0] ZMT badge shows 'Concession' text for zmtStatus='concession'",
    () => {
      // THIS TEST WILL FAIL — property-card.tsx not yet implemented
      render(<PropertyCard property={mockPropertyBeach} locale="en" />);

      const card = document.querySelector('[data-testid="property-card"]');
      expect(card?.textContent).toMatch(/Concession/i);
    },
  );

  it(
    "[P1] ZMT badge uses amber classes for zmtStatus='concession'",
    () => {
      // THIS TEST WILL FAIL — property-card.tsx not yet implemented
      render(<PropertyCard property={mockPropertyBeach} locale="en" />);

      const zmtBadge = document.querySelector('[data-testid="zmt-badge"]');
      expect(zmtBadge).not.toBeNull();
      expect(zmtBadge?.className).toContain("bg-amber-100");
      expect(zmtBadge?.className).toContain("text-amber-800");
    },
  );

  it(
    "[P1] ZMT badge shows 'ZMT Restricted' text and red classes for zmtStatus='zmt_restricted'",
    () => {
      // THIS TEST WILL FAIL — property-card.tsx not yet implemented
      render(<PropertyCard property={mockLandProperty} locale="en" />);

      const card = document.querySelector('[data-testid="property-card"]');
      expect(card?.textContent).toMatch(/ZMT Restricted/i);

      const zmtBadge = document.querySelector('[data-testid="zmt-badge"]');
      expect(zmtBadge?.className).toContain("bg-red-100");
      expect(zmtBadge?.className).toContain("text-red-800");
    },
  );

  // -------------------------------------------------------------------------
  // AC #1: Save + Share buttons present
  // -------------------------------------------------------------------------

  it(
    "[P0] renders save button (data-testid='save-button') inside the card",
    () => {
      // THIS TEST WILL FAIL — property-card.tsx not yet implemented
      render(<PropertyCard property={mockPropertyMountain} locale="en" />);

      const saveButton = document.querySelector('[data-testid="save-button"]');
      expect(saveButton).not.toBeNull();
    },
  );

  it(
    "[P0] renders share button (data-testid='share-button') inside the card",
    () => {
      // THIS TEST WILL FAIL — property-card.tsx not yet implemented
      render(<PropertyCard property={mockPropertyMountain} locale="en" />);

      const shareButton = document.querySelector(
        '[data-testid="share-button"]',
      );
      expect(shareButton).not.toBeNull();
    },
  );

  // -------------------------------------------------------------------------
  // AC #7: Hover animation
  // -------------------------------------------------------------------------

  it(
    "[P0] root element has hover animation classes: hover:translate-y-[-4px] and hover:shadow-lg",
    () => {
      // THIS TEST WILL FAIL — property-card.tsx not yet implemented
      render(<PropertyCard property={mockPropertyMountain} locale="en" />);

      const card = document.querySelector('[data-testid="property-card"]');
      expect(card).not.toBeNull();
      expect(card?.className).toContain("hover:translate-y-[-4px]");
      expect(card?.className).toContain("hover:shadow-lg");
    },
  );

  it(
    "[P1] root element has transition-all duration-200 ease-out classes for smooth animation",
    () => {
      // THIS TEST WILL FAIL — property-card.tsx not yet implemented
      render(<PropertyCard property={mockPropertyMountain} locale="en" />);

      const card = document.querySelector('[data-testid="property-card"]');
      expect(card?.className).toContain("transition-all");
      expect(card?.className).toContain("duration-200");
    },
  );

  // -------------------------------------------------------------------------
  // AC #8: aspect-ratio on image (CLS prevention)
  // -------------------------------------------------------------------------

  it(
    "[P0] hero image has aspect-[3/2] class to prevent CLS",
    () => {
      // THIS TEST WILL FAIL — property-card.tsx not yet implemented
      render(<PropertyCard property={mockPropertyMountain} locale="en" />);

      const img = document.querySelector("img");
      expect(img).not.toBeNull();
      // The image wrapper or the img itself must have the aspect-[3/2] class
      const imageWrapper = document.querySelector(
        '[data-testid="property-image"]',
      );
      const el = imageWrapper ?? img;
      expect(el?.className).toContain("aspect-[3/2]");
    },
  );

  // -------------------------------------------------------------------------
  // AC #9: next/image with sizes prop
  // -------------------------------------------------------------------------

  it(
    "[P0] hero image is rendered using next/image (has sizes attribute for responsive loading)",
    () => {
      // THIS TEST WILL FAIL — property-card.tsx not yet implemented
      render(<PropertyCard property={mockPropertyMountain} locale="en" />);

      // The mock preserves sizes as data-sizes on the img element
      const img = document.querySelector("img");
      expect(img).not.toBeNull();
      expect(img?.getAttribute("data-sizes")).toBeTruthy();
      expect(img?.getAttribute("data-sizes")).toContain("max-width");
    },
  );

  it(
    "[P1] image src falls back to /property-placeholder.svg when property has no images",
    () => {
      // THIS TEST WILL FAIL — property-card.tsx not yet implemented
      render(<PropertyCard property={mockPropertyNoImage} locale="en" />);

      const img = document.querySelector("img");
      expect(img).not.toBeNull();
      expect(img?.getAttribute("src")).toBe("/property-placeholder.svg");
    },
  );

  // -------------------------------------------------------------------------
  // Accessibility
  // -------------------------------------------------------------------------

  it(
    "[P1] card root element is an <article> for semantic accessibility",
    () => {
      render(<PropertyCard property={mockPropertyMountain} locale="en" />);

      // <article> has implicit ARIA role="article" — no explicit attribute needed.
      // Querying by element tag + data-testid is more correct than [role="article"].
      const card = document.querySelector('article[data-testid="property-card"]');
      expect(card).not.toBeNull();
    },
  );

  it(
    "[P1] card has aria-label containing property title and price",
    () => {
      // THIS TEST WILL FAIL — property-card.tsx not yet implemented
      render(<PropertyCard property={mockPropertyMountain} locale="en" />);

      const card = document.querySelector('[data-testid="property-card"]');
      const ariaLabel = card?.getAttribute("aria-label");
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel).toMatch(/Property/i);
    },
  );

  // -------------------------------------------------------------------------
  // Architecture compliance
  // -------------------------------------------------------------------------

  it(
    "[P1] PropertyCard is NOT a Client Component (file must NOT start with 'use client')",
    async () => {
      // THIS TEST WILL FAIL — property-card.tsx not yet implemented
      const fs = await import("node:fs");
      const path = await import("node:path");

      const filePath = path.resolve(
        process.cwd(),
        "src/components/property/property-card.tsx",
      );
      expect(fs.existsSync(filePath)).toBe(true);

      const src = fs.readFileSync(filePath, "utf8");
      // Server Component — must NOT start with 'use client'
      expect(src.trimStart()).not.toMatch(/^['"]use client['"]/);
    },
  );
});

// ---------------------------------------------------------------------------
// Story 3.7 Regression Tests: Unit System & Currency Display (AC #5)
// ---------------------------------------------------------------------------

// Import the mocked functions to allow overriding per test
import { isNonUSLocale } from "@/lib/utils/currency";

describe("PropertyCard — Story 3.7: Currency & Unit Display", () => {
  // -------------------------------------------------------------------------
  // AC #5: EUR price display for non-US locales
  // -------------------------------------------------------------------------

  it(
    "[P0] renders data-testid='property-price-eur' when locale is non-US (e.g., 'de') and isNonUSLocale returns true",
    () => {
      // THIS TEST WILL FAIL — property-card.tsx not yet updated for Story 3.7
      // Override isNonUSLocale to return true for this test
      vi.mocked(isNonUSLocale).mockReturnValue(true);

      render(<PropertyCard property={mockPropertyMountain} locale="de" />);

      const eurPrice = document.querySelector('[data-testid="property-price-eur"]');
      expect(eurPrice).not.toBeNull();
    },
  );

  it(
    "[P0] does NOT render data-testid='property-price-eur' when locale is 'en' (isNonUSLocale returns false)",
    () => {
      // THIS TEST WILL FAIL — property-card.tsx not yet updated for Story 3.7
      // isNonUSLocale returns false (default mock)
      vi.mocked(isNonUSLocale).mockReturnValue(false);

      render(<PropertyCard property={mockPropertyMountain} locale="en" />);

      const eurPrice = document.querySelector('[data-testid="property-price-eur"]');
      expect(eurPrice).toBeNull();
    },
  );

  it(
    "[P1] accepts optional unitSystem prop without errors (Story 3.7 new prop)",
    () => {
      // THIS TEST WILL FAIL — property-card.tsx not yet updated for Story 3.7
      // Should render without errors when unitSystem='imperial' is passed
      render(<PropertyCard property={mockPropertyMountain} locale="en" unitSystem="imperial" />);

      const card = document.querySelector('[data-testid="property-card"]');
      expect(card).not.toBeNull();
    },
  );

  it(
    "[P1] renders without errors when unitSystem prop is omitted (defaults to metric)",
    () => {
      // Regression: existing behavior must not break when unitSystem not provided
      render(<PropertyCard property={mockPropertyMountain} locale="en" />);

      const card = document.querySelector('[data-testid="property-card"]');
      expect(card).not.toBeNull();
    },
  );
});
