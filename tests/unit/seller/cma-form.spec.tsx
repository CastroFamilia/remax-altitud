/**
 * Tests: Story 5.2 — CMA Request Form
 *
 * data-testid contracts:
 *   cma-form             — CmaForm wrapper
 *   cma-form-fields      — form fields container
 *   cma-confirmation     — CMA confirmation screen (rendered by SellerConfirmation source="cma")
 *   cma-hero             — CMA value proposition section
 *   cma-submit-button    — submit button
 *
 * Test IDs:
 *   5.2-COMP-001  CMA form renders all fields
 *   5.2-COMP-002  Validation (name + phone required, email optional)
 *   5.2-COMP-003  Lead payload has source="cma_form" intent="sell"
 *   5.2-COMP-004  CMA confirmation heading differs from seller confirmation
 *   5.2-COMP-005  LocationPicker reused (not duplicated)
 *   5.2-COMP-006  CMA form strings use CmaForm i18n namespace
 *   5.2-COMP-007  Size unit toggle uses useLocaleUnits hook
 *   5.2-E2E-001   CMA hero section renders with CTA
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const { mockToggleUnits } = vi.hoisted(() => ({
  mockToggleUnits: vi.fn(),
}));

vi.mock("next-intl", () => ({
  useTranslations: vi.fn().mockReturnValue((key: string) => key),
}));

vi.mock("@/hooks/use-locale-units", () => ({
  useLocaleUnits: vi.fn().mockReturnValue({
    unitSystem: "metric",
    toggleUnits: mockToggleUnits,
  }),
}));

vi.mock("@/components/seller/location-picker", () => ({
  LocationPicker: ({
    value,
    onChange,
    placeholder,
  }: Record<string, unknown>) => (
    <div data-testid="location-picker-mock">
      <input
        data-testid="location-text-input"
        value={(value as { text: string }).text}
        onChange={(e) =>
          (
            onChange as (val: {
              text: string;
              lat: number | null;
              lng: number | null;
            }) => void
          )({
            text: e.target.value,
            lat: null,
            lng: null,
          })
        }
        placeholder={placeholder as string}
      />
    </div>
  ),
}));

vi.mock("@/components/seller/seller-confirmation", () => ({
  SellerConfirmation: ({ source }: { source?: string }) => (
    <div
      data-testid={source === "cma" ? "cma-confirmation" : "seller-confirmation"}
    >
      {`confirmation-${source ?? "seller"}`}
    </div>
  ),
}));

// imported AFTER mocks
import { CmaForm, buildCmaLeadPayload } from "@/components/seller/cma-form";
import { CmaHero } from "@/components/seller/cma-hero";
import { useLocaleUnits } from "@/hooks/use-locale-units";

const MOCK_AGENT = {
  id: "agent-1",
  remaxId: "A001",
  firstName: "Test",
  lastName: "Agent",
  email: "test@agent.com",
  phone: "+50688881234",
  bio: null,
  bioEs: null,
  photoUrl: null,
  languages: ["en", "es"],
  officeId: "office-1",
  slug: "test-agent",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
} as const;

function renderCmaForm() {
  return render(
    <CmaForm locale="en" fallbackAgent={MOCK_AGENT as never} officeName="RE/MAX Altitud" />,
  );
}

describe("CmaForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5.2-COMP-001: CMA form renders all fields
  // ──────────────────────────────────────────────────────────────────────────
  it("renders all CMA form fields (name, phone, email, type, location, size, comment)", () => {
    renderCmaForm();

    expect(screen.getByTestId("cma-form")).not.toBeNull();
    expect(screen.getByTestId("cma-form-fields")).not.toBeNull();

    // Name, phone, email inputs
    expect(screen.getByPlaceholderText("form.namePlaceholder")).not.toBeNull();
    expect(screen.getByPlaceholderText("form.phonePlaceholder")).not.toBeNull();
    expect(screen.getByPlaceholderText("form.emailPlaceholder")).not.toBeNull();

    // Property type dropdown
    expect(screen.getByText("form.propertyTypePlaceholder")).not.toBeNull();

    // LocationPicker (mock)
    expect(screen.getByTestId("location-picker-mock")).not.toBeNull();

    // Size input
    expect(screen.getByPlaceholderText("form.sizePlaceholder")).not.toBeNull();

    // Comment textarea
    expect(screen.getByPlaceholderText("form.commentPlaceholder")).not.toBeNull();

    // Submit button
    expect(screen.getByTestId("cma-submit-button")).not.toBeNull();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5.2-COMP-002: Validation — name and phone required, email optional
  // ──────────────────────────────────────────────────────────────────────────
  it("shows validation errors when name is empty on submit", async () => {
    const user = userEvent.setup();
    renderCmaForm();

    await user.click(screen.getByTestId("cma-submit-button"));

    expect(screen.getByText("form.validation.nameRequired")).not.toBeNull();
  });

  it("shows validation errors when phone is empty on submit", async () => {
    const user = userEvent.setup();
    renderCmaForm();

    // Fill name but leave phone empty
    await user.type(
      screen.getByPlaceholderText("form.namePlaceholder"),
      "John Doe",
    );
    await user.click(screen.getByTestId("cma-submit-button"));

    expect(screen.getByText("form.validation.phoneRequired")).not.toBeNull();
  });

  it("does NOT require email — form submits without email", async () => {
    const user = userEvent.setup();
    renderCmaForm();

    await user.type(
      screen.getByPlaceholderText("form.namePlaceholder"),
      "John Doe",
    );
    await user.type(
      screen.getByPlaceholderText("form.phonePlaceholder"),
      "+50688881234",
    );
    await user.click(screen.getByTestId("cma-submit-button"));

    // No email error should appear
    expect(screen.queryByText("form.validation.emailInvalid")).toBeNull();
  });

  it("shows email validation error for invalid email format", async () => {
    const user = userEvent.setup();
    renderCmaForm();

    await user.type(
      screen.getByPlaceholderText("form.namePlaceholder"),
      "John Doe",
    );
    await user.type(
      screen.getByPlaceholderText("form.phonePlaceholder"),
      "+50688881234",
    );
    await user.type(
      screen.getByPlaceholderText("form.emailPlaceholder"),
      "not-an-email",
    );
    await user.click(screen.getByTestId("cma-submit-button"));

    expect(screen.getByText("form.validation.emailInvalid")).not.toBeNull();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5.2-COMP-003: Lead payload has source="cma_form" and intent="sell"
  // ──────────────────────────────────────────────────────────────────────────
  it("buildCmaLeadPayload sets source to 'cma_form' and intent to 'sell'", () => {
    const payload = buildCmaLeadPayload({
      name: "Test",
      phone: "+50688881234",
      email: "",
      propertyType: "Casa",
      location: { text: "Test location", lat: null, lng: null },
      approximateSize: "500",
      sizeUnit: "sqm",
      comment: "Test comment",
    });

    expect(payload.source).toBe("cma_form");
    expect(payload.intent).toBe("sell");
    expect(payload.name).toBe("Test");
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5.2-COMP-004: CMA confirmation screen after submission
  // ──────────────────────────────────────────────────────────────────────────
  it("shows CMA-specific confirmation screen after successful submission", async () => {
    const user = userEvent.setup();
    renderCmaForm();

    await user.type(
      screen.getByPlaceholderText("form.namePlaceholder"),
      "John Doe",
    );
    await user.type(
      screen.getByPlaceholderText("form.phonePlaceholder"),
      "+50688881234",
    );
    await user.click(screen.getByTestId("cma-submit-button"));

    // Wait for the 500ms stub delay + state update
    await waitFor(
      () => {
        expect(screen.getByTestId("cma-confirmation")).not.toBeNull();
      },
      { timeout: 2000 },
    );

    // Confirm it's the CMA variant, not seller
    expect(screen.queryByTestId("seller-confirmation")).toBeNull();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5.2-COMP-005: LocationPicker reused (not duplicated)
  // ──────────────────────────────────────────────────────────────────────────
  it("uses LocationPicker from seller/location-picker (shared component)", () => {
    renderCmaForm();

    // The mock LocationPicker renders data-testid="location-picker-mock"
    // Confirms CmaForm imports LocationPicker rather than duplicating it
    expect(screen.getByTestId("location-picker-mock")).not.toBeNull();
    expect(screen.getByTestId("location-text-input")).not.toBeNull();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5.2-COMP-006: CMA form strings use CmaForm i18n namespace
  // ──────────────────────────────────────────────────────────────────────────
  it("renders all form labels using CmaForm i18n namespace", () => {
    renderCmaForm();

    // The mock useTranslations returns the key itself.
    // Verify the keys come from CmaForm namespace (form.* keys).
    expect(screen.getByText("form.heading")).not.toBeNull();
    expect(screen.getByText("form.nameLabel")).not.toBeNull();
    expect(screen.getByText("form.phoneLabel")).not.toBeNull();
    expect(screen.getByText("form.propertyTypeLabel")).not.toBeNull();
    expect(screen.getByText("form.sizeLabel")).not.toBeNull();
    expect(screen.getByText("form.commentLabel")).not.toBeNull();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5.2-COMP-007: Size unit toggle uses useLocaleUnits hook
  // ──────────────────────────────────────────────────────────────────────────
  it("size field uses useLocaleUnits for unit toggle", async () => {
    const user = userEvent.setup();
    renderCmaForm();

    expect(useLocaleUnits).toHaveBeenCalledWith("en");

    // Unit toggle button shows m² (metric mock)
    const toggleButton = screen.getByTestId("cma-size-unit-toggle");
    expect(toggleButton.textContent).toContain("m²");

    // Click triggers toggleUnits
    await user.click(toggleButton);
    expect(mockToggleUnits).toHaveBeenCalledTimes(1);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Lazy-load contract
  // ──────────────────────────────────────────────────────────────────────────
  it("CmaForm is exported from cma-form.tsx (lazy-load contract)", async () => {
    const mod = await import("@/components/seller/cma-form");
    expect(typeof mod.CmaForm).toBe("function");
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 5.2-E2E-001: CMA hero section renders
// ──────────────────────────────────────────────────────────────────────────────
describe("CmaHero", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders CMA hero section with CTA button", () => {
    render(
      <CmaHero locale="en">
        <div data-testid="cma-form-mock" />
      </CmaHero>,
    );

    expect(screen.getByTestId("cma-hero")).not.toBeNull();
    // CTA button should be visible (unexpanded state)
    expect(screen.getByText("hero.ctaButton")).not.toBeNull();
    // Form should NOT be visible yet
    expect(screen.queryByTestId("cma-form-mock")).toBeNull();
  });

  it("expands to show children when CTA is clicked", async () => {
    const user = userEvent.setup();
    render(
      <CmaHero locale="en">
        <div data-testid="cma-form-mock" />
      </CmaHero>,
    );

    await user.click(screen.getByText("hero.ctaButton"));

    // Now the form (children) should be visible
    expect(screen.getByTestId("cma-form-mock")).not.toBeNull();
    // CTA button should be hidden after expanding
    expect(screen.queryByText("hero.ctaButton")).toBeNull();
  });
});
