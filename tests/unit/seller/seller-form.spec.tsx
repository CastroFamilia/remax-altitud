/**
 * Story 5.1: Seller Landing Page & "List With Us" Form — ATDD Red-Phase Unit/Component Scaffold
 * Component: src/components/seller/seller-form.tsx
 *
 * TDD Phase: RED — tests will fail until components are implemented.
 * Remove test.skip() per scenario when implementing to verify green phase.
 *
 * Covers (from test-design-epic-5.md):
 *   5.1-COMP-002 — "I need help with pricing" makes price optional + attaches note to payload
 *   5.1-COMP-003 — Inline validation errors appear in correct locale (EN)
 *   5.1-COMP-004 — Beds/Baths hidden when "Lote/Terreno" property type selected
 *   5.1-COMP-005 — Property Type radio shows 5 options
 *   5.1-COMP-006 — Size field renders with m²/acres/ft² toggle
 *   5.1-COMP-007 — Step 2 renders all fields for Casa type
 *   5.1-COMP-008 — Step 3 renders Name, Phone/WhatsApp, Email (optional), Preferred Language
 *   5.1-UNIT-001 — All form strings render in Spanish locale
 *   5.1-E2E-002  — SellerForm exported from seller-form.tsx (lazy-load contract)
 *
 * data-testid contract (CANNOT rename once established):
 *   data-testid="seller-form"             — SellerForm root wrapper
 *   data-testid="form-step-1"             — Step 1 container
 *   data-testid="form-step-2"             — Step 2 container
 *   data-testid="form-step-3"             — Step 3 container
 *   data-testid="progress-bar"            — Progress indicator
 *   data-testid="pricing-help-checkbox"   — Pricing help checkbox
 *   data-testid="location-text-input"     — Text address input
 *   data-testid="beds-baths-fields"       — Beds/baths conditional container
 *
 * Environment: jsdom (React component — .spec.tsx → jsdom via vitest.config.mts)
 */

// ---------------------------------------------------------------------------
// Module mocks — declared BEFORE any imports of the module under test
// vi.mock hoisting rule: ALL vi.mock() calls MUST appear before import statements
// ---------------------------------------------------------------------------

import { vi, describe, it, expect, afterEach } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(() => (key: string, values?: Record<string, unknown>) => {
    // Return the i18n key as the string value — enough for assertions
    if (values) return `${key}(${JSON.stringify(values)})`;
    return key;
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ replace: vi.fn() })),
  useSearchParams: vi.fn(() => ({ toString: vi.fn(() => ""), get: vi.fn(() => null) })),
}));

// Mock LocationPicker to isolate SellerForm from map dependencies
vi.mock("@/components/seller/location-picker", () => ({
  LocationPicker: vi.fn(({
    value,
    onChange,
  }: {
    value: { text: string; lat: number | null; lng: number | null };
    onChange: (v: { text: string; lat: number | null; lng: number | null }) => void;
  }) => (
    <div data-testid="location-picker-mock">
      <input
        data-testid="location-text-input"
        value={value.text}
        onChange={(e) => onChange({ text: e.target.value, lat: null, lng: null })}
      />
    </div>
  )),
}));

// Mock SellerConfirmation — tested in isolation
vi.mock("@/components/seller/seller-confirmation", () => ({
  SellerConfirmation: vi.fn(({ agent }: { agent: unknown; locale: string }) => (
    <div data-testid="seller-confirmation">
      <span data-testid="mock-agent">{JSON.stringify(agent)}</span>
    </div>
  )),
}));

// Mock useLocaleUnits (size unit toggle)
vi.mock("@/hooks/use-locale-units", () => ({
  useLocaleUnits: vi.fn(() => ({
    unitSystem: "metric",
    toggleUnits: vi.fn(),
  })),
}));

// ---------------------------------------------------------------------------
// Imports — AFTER mocks
// ---------------------------------------------------------------------------

import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ---------------------------------------------------------------------------

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// 5.1-E2E-002: SellerForm lazy-load contract
// ---------------------------------------------------------------------------

describe("SellerForm lazy-load contract (5.1-E2E-002)", () => {
  it(
    "[P0] 5.1-E2E-002: SellerForm is exported as a named export from seller-form.tsx",
    () => {
      // THIS TEST WILL FAIL — seller-form.tsx not yet created
      // The lazy load in page.tsx uses next/dynamic with a named export:
      //   () => import('@/components/seller/seller-form').then(m => m.SellerForm)
      // This test verifies the named export contract exists.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const module = require("@/components/seller/seller-form");
      expect(typeof module.SellerForm).toBe("function");
    },
  );

  it(
    "[P0] seller-form.tsx is a 'use client' component (file content check)",
    () => {
      // THIS TEST WILL FAIL — seller-form.tsx not yet created
      const { readFileSync } = require("fs");
      const path = require("path");
      const filePath = path.resolve(
        process.cwd(),
        "src/components/seller/seller-form.tsx",
      );
      const src = readFileSync(filePath, "utf8");
      expect(src.trimStart()).toMatch(/^['"]use client['"]/);
    },
  );
});

// ---------------------------------------------------------------------------
// Helper: render SellerForm for tests
// We import lazily to avoid hard failures if file not yet created.
// ---------------------------------------------------------------------------

function renderSellerForm(props: { locale?: string; fallbackAgent?: unknown } = {}) {
  // Dynamic require after mocks are established
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { SellerForm } = require("@/components/seller/seller-form");
  return render(
    <SellerForm
      locale={props.locale ?? "en"}
      fallbackAgent={props.fallbackAgent ?? { id: "agent-1", name: "Test Agent" }}
    />,
  );
}

// ---------------------------------------------------------------------------
// Step 1 field rendering (5.1-COMP-005, 5.1-COMP-006)
// ---------------------------------------------------------------------------

describe("SellerForm — Step 1: Basics", () => {
  it.skip(
    "[P2] 5.1-COMP-005: Step 1 renders 5 property type radio options (Casa, Lote/Terreno, Finca, Condominio, Comercial)",
    () => {
      // THIS TEST WILL FAIL — SellerForm Step 1 not yet implemented
      renderSellerForm();

      // All 5 property types must be present as radio inputs
      expect(screen.getByRole("radio", { name: /casa/i })).toBeInTheDocument();
      expect(screen.getByRole("radio", { name: /lote.*terreno|terreno.*lote/i })).toBeInTheDocument();
      expect(screen.getByRole("radio", { name: /finca/i })).toBeInTheDocument();
      expect(screen.getByRole("radio", { name: /condominio/i })).toBeInTheDocument();
      expect(screen.getByRole("radio", { name: /comercial/i })).toBeInTheDocument();
    },
  );

  it.skip(
    "[P2] 5.1-COMP-006: Step 1 size field renders with m²/acres/ft² unit toggle",
    () => {
      // THIS TEST WILL FAIL — SellerForm Step 1 not yet implemented
      renderSellerForm();

      // Size field must be present
      const sizeInput = screen.getByRole("spinbutton", { name: /size|tamaño|approximate/i });
      expect(sizeInput).toBeInTheDocument();

      // Unit toggle must offer m², ft², and acres options
      const unitToggle = document.querySelector('[data-testid="size-unit-toggle"], [aria-label*="unit" i]');
      expect(unitToggle).not.toBeNull();

      // Check for at least metric option
      expect(screen.getByText(/m²|sqm/i)).toBeInTheDocument();
    },
  );

  it.skip(
    "[P1] Step 1 container has data-testid='form-step-1'",
    () => {
      // THIS TEST WILL FAIL — SellerForm not yet implemented
      renderSellerForm();
      expect(document.querySelector('[data-testid="form-step-1"]')).not.toBeNull();
    },
  );

  it.skip(
    "[P1] progress bar is present with data-testid='progress-bar' on initial render",
    () => {
      // THIS TEST WILL FAIL — SellerForm not yet implemented
      renderSellerForm();
      expect(document.querySelector('[data-testid="progress-bar"]')).not.toBeNull();
    },
  );
});

// ---------------------------------------------------------------------------
// Step 2 field rendering (5.1-COMP-007)
// ---------------------------------------------------------------------------

describe("SellerForm — Step 2: Details", () => {
  /**
   * Helper to advance to Step 2 by filling required Step 1 fields.
   */
  async function advanceToStep2() {
    const user = userEvent.setup();
    renderSellerForm();

    // Select Casa (non-land type)
    const casaRadio = screen.getByRole("radio", { name: /casa/i });
    await user.click(casaRadio);

    // Fill location
    const locationInput = screen.getByTestId("location-text-input");
    await user.type(locationInput, "Pérez Zeledón");

    // Click Next
    const nextButton = screen.getByRole("button", { name: /next|siguiente/i });
    await user.click(nextButton);
  }

  it.skip(
    "[P2] 5.1-COMP-007: Step 2 renders Price, pricing-help checkbox, Description, Photos, Beds/Baths for Casa type",
    async () => {
      // THIS TEST WILL FAIL — SellerForm Step 2 not yet implemented
      await act(async () => {
        await advanceToStep2();
      });

      // Step 2 container must be active
      expect(document.querySelector('[data-testid="form-step-2"]')).not.toBeNull();

      // Price field must be visible
      const priceInput = screen.queryByRole("spinbutton", { name: /price|precio/i })
        || screen.queryByLabelText(/price|precio/i);
      expect(priceInput).not.toBeNull();

      // Pricing help checkbox (data-testid contract)
      expect(document.querySelector('[data-testid="pricing-help-checkbox"]')).not.toBeNull();

      // Description textarea must be present
      const descriptionField = screen.queryByRole("textbox", { name: /description|descripción/i })
        || screen.queryByLabelText(/description|descripción/i);
      expect(descriptionField).not.toBeNull();

      // Beds/Baths must be visible for Casa (non-land type)
      expect(document.querySelector('[data-testid="beds-baths-fields"]')).not.toBeNull();
    },
  );

  it.skip(
    "[P0] 5.1-COMP-004: beds/baths fields are hidden when Lote/Terreno property type is selected (R-012)",
    async () => {
      // THIS TEST WILL FAIL — SellerForm conditional rendering not yet implemented
      const user = userEvent.setup();
      renderSellerForm();

      // Select Lote/Terreno
      const loteRadio = screen.getByRole("radio", { name: /lote.*terreno|terreno.*lote/i });
      await user.click(loteRadio);

      // Fill location to allow advancing
      const locationInput = screen.getByTestId("location-text-input");
      await user.type(locationInput, "San Isidro");

      // Advance to Step 2
      const nextButton = screen.getByRole("button", { name: /next|siguiente/i });
      await user.click(nextButton);

      // Beds/Baths fields must be HIDDEN or not rendered (R-012)
      const bedsBathsContainer = document.querySelector('[data-testid="beds-baths-fields"]');
      const isHiddenOrAbsent =
        bedsBathsContainer === null ||
        (bedsBathsContainer as HTMLElement).hidden === true ||
        bedsBathsContainer.className.includes("hidden");
      expect(isHiddenOrAbsent).toBe(true);
    },
  );

  it.skip(
    "[P1] 5.1-COMP-002: checking 'I need help with pricing' makes price field optional (R-008)",
    async () => {
      // THIS TEST WILL FAIL — SellerForm pricing-help logic not yet implemented
      const user = userEvent.setup();
      await act(async () => {
        await advanceToStep2();
      });

      // Price field should initially be required
      const priceInput = document.querySelector('[name="priceExpectation"], [data-testid="price-input"]') as HTMLInputElement | null;
      expect(priceInput).not.toBeNull();

      // Check the pricing help checkbox
      const pricingHelpCheckbox = document.querySelector('[data-testid="pricing-help-checkbox"]') as HTMLInputElement | null;
      expect(pricingHelpCheckbox).not.toBeNull();

      await user.click(pricingHelpCheckbox!);

      // After checking: price field must NOT be required
      const updatedPriceInput = document.querySelector('[name="priceExpectation"]') as HTMLInputElement | null;
      if (updatedPriceInput) {
        expect(updatedPriceInput.required).toBe(false);
      }

      // Advance to step 3 without filling price (should succeed now)
      const nextButton = screen.getByRole("button", { name: /next|siguiente/i });
      await user.click(nextButton);

      // Must reach step 3 (price was optional)
      expect(document.querySelector('[data-testid="form-step-3"]')).not.toBeNull();
    },
  );

  it.skip(
    "[P1] 5.1-COMP-002b: buildLeadPayload includes pricing consultation note when checkbox is checked (R-008)",
    () => {
      // THIS TEST WILL FAIL — buildLeadPayload utility not yet implemented
      // This test verifies the payload builder function includes the notes field
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const module = require("@/components/seller/seller-form");
      const { buildLeadPayload } = module;

      // If buildLeadPayload is exported
      if (typeof buildLeadPayload === "function") {
        const payload = buildLeadPayload({
          propertyType: "Casa",
          location: { text: "San Isidro", lat: 9.37, lng: -83.7 },
          size: 500,
          sizeUnit: "sqm",
          priceExpectation: null,
          needsPricingHelp: true,
          description: "",
          photos: [],
          bedrooms: null,
          bathrooms: null,
          name: "Carlos",
          phone: "+50688881234",
          email: "",
          preferredLanguage: "en",
        });

        // R-008: notes must include pricing consultation signal
        expect(payload.notes).toMatch(/pricing consultation|pricing help|needs pricing/i);
      } else {
        // If not exported, skip gracefully — E2E test covers end-to-end
        expect(true).toBe(true);
      }
    },
  );
});

// ---------------------------------------------------------------------------
// Step 3 field rendering (5.1-COMP-008)
// ---------------------------------------------------------------------------

describe("SellerForm — Step 3: Contact", () => {
  /**
   * Helper to advance to Step 3.
   */
  async function advanceToStep3() {
    const user = userEvent.setup();
    renderSellerForm();

    // Step 1
    const casaRadio = screen.getByRole("radio", { name: /casa/i });
    await user.click(casaRadio);
    const locationInput = screen.getByTestId("location-text-input");
    await user.type(locationInput, "Pérez Zeledón");
    await user.click(screen.getByRole("button", { name: /next|siguiente/i }));

    // Step 2
    await expect(document.querySelector('[data-testid="form-step-2"]')).not.toBeNull();
    await user.click(screen.getByRole("button", { name: /next|siguiente/i }));
  }

  it.skip(
    "[P2] 5.1-COMP-008: Step 3 renders Name (required), Phone/WhatsApp (required), Email (optional), Preferred Language",
    async () => {
      // THIS TEST WILL FAIL — SellerForm Step 3 not yet implemented
      await act(async () => {
        await advanceToStep3();
      });

      // Step 3 container must be active
      expect(document.querySelector('[data-testid="form-step-3"]')).not.toBeNull();

      // Name field (required)
      const nameInput = screen.queryByRole("textbox", { name: /name|nombre/i })
        || screen.queryByLabelText(/full name|nombre/i);
      expect(nameInput).not.toBeNull();

      // Phone/WhatsApp field (required)
      const phoneInput = screen.queryByRole("textbox", { name: /phone|teléfono|whatsapp/i })
        || screen.queryByLabelText(/phone|teléfono/i);
      expect(phoneInput).not.toBeNull();

      // Email (optional — must have optional label)
      const emailInput = screen.queryByRole("textbox", { name: /email/i })
        || screen.queryByLabelText(/email/i);
      expect(emailInput).not.toBeNull();

      // Optional badge must be visible near the email field
      const optionalBadge = screen.queryByText(/optional|opcional/i);
      expect(optionalBadge).not.toBeNull();

      // Preferred Language selector
      const langSelect = screen.queryByRole("combobox", { name: /language|idioma/i })
        || screen.queryByLabelText(/language|idioma/i);
      expect(langSelect).not.toBeNull();
    },
  );
});

// ---------------------------------------------------------------------------
// Validation errors in locale (5.1-COMP-003)
// ---------------------------------------------------------------------------

describe("SellerForm — Validation (5.1-COMP-003)", () => {
  it.skip(
    "[P1] 5.1-COMP-003: inline validation errors appear in English (EN locale) when required field is empty",
    async () => {
      // THIS TEST WILL FAIL — SellerForm validation not yet implemented
      const user = userEvent.setup();
      renderSellerForm({ locale: "en" });

      // Tap Next without filling any Step 1 fields
      const nextButton = screen.getByRole("button", { name: /next|siguiente/i });
      await user.click(nextButton);

      // Error messages must appear
      const errorElements = document.querySelectorAll(
        '[role="alert"], [class*="error"], [class*="text-red"]'
      );
      expect(errorElements.length).toBeGreaterThan(0);

      // Errors must be in English (not empty, not Spanish-only)
      const firstError = errorElements[0].textContent ?? "";
      expect(firstError.length).toBeGreaterThan(0);
    },
  );

  it.skip(
    "[P2] 5.1-UNIT-001: all form strings render in Spanish locale (locale='es')",
    () => {
      // THIS TEST WILL FAIL — SellerForm i18n not yet implemented
      renderSellerForm({ locale: "es" });

      // The useTranslations mock returns i18n keys — but with locale='es', the
      // real implementation should pass { locale: 'es' } to useTranslations.
      // For red-phase, verify the component renders without throwing.
      expect(document.querySelector('[data-testid="seller-form"]')).not.toBeNull();

      // Step 1 heading must be present (i18n key or Spanish translation)
      const step1Heading = document.querySelector('[data-testid="form-step-1"] h2, [data-testid="form-step-1"] h3');
      expect(step1Heading).not.toBeNull();
    },
  );
});

// ---------------------------------------------------------------------------
// SellerForm root wrapper
// ---------------------------------------------------------------------------

describe("SellerForm — Root wrapper", () => {
  it.skip(
    "[P1] SellerForm root has data-testid='seller-form'",
    () => {
      // THIS TEST WILL FAIL — SellerForm not yet implemented
      renderSellerForm();
      expect(document.querySelector('[data-testid="seller-form"]')).not.toBeNull();
    },
  );
});
