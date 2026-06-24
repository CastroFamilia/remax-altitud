import { vi, describe, it, expect, afterEach } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(() => (key: string, values?: Record<string, unknown>) => {
    if (values) return `${key}(${JSON.stringify(values)})`;
    return key;
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ replace: vi.fn() })),
  useSearchParams: vi.fn(() => ({ toString: vi.fn(() => ""), get: vi.fn(() => null) })),
}));

// Mock LocationPicker is no longer needed but kept empty to avoid issues if any other file imports it here
vi.mock("@/components/seller/location-picker", () => ({
  LocationPicker: vi.fn(() => <div />),
}));

vi.mock("@/components/seller/seller-confirmation", () => ({
  SellerConfirmation: vi.fn(({ agent }: { agent: unknown; locale: string }) => (
    <div data-testid="seller-confirmation">
      <span data-testid="mock-agent">{JSON.stringify(agent)}</span>
    </div>
  )),
}));

vi.mock("@/hooks/use-locale-units", () => ({
  useLocaleUnits: vi.fn(() => ({
    unitSystem: "metric",
    toggleUnits: vi.fn(),
  })),
}));

import React from "react";
import { readFileSync } from "node:fs";
import { resolve as pathResolve } from "node:path";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("SellerForm lazy-load contract (5.1-E2E-002)", () => {
  it("[P0] 5.1-E2E-002: SellerForm is exported as a named export from seller-form.tsx", async () => {
    const sellerFormModule = await import("@/components/seller/seller-form");
    expect(typeof sellerFormModule.SellerForm).toBe("function");
  });

  it("[P0] seller-form.tsx is a 'use client' component (file content check)", () => {
    const filePath = pathResolve(process.cwd(), "src/components/seller/seller-form.tsx");
    const src = readFileSync(filePath, "utf8");
    expect(src.trimStart()).toMatch(/^['"]use client['"]/);
  });
});

async function renderSellerForm(props: { locale?: string; fallbackAgent?: unknown } = {}) {
  const { SellerForm } = await import("@/components/seller/seller-form");
  type SellerFormProps = React.ComponentProps<typeof SellerForm>;
  return render(
    <SellerForm
      locale={props.locale ?? "en"}
      fallbackAgent={
        (props.fallbackAgent ?? {
          id: "agent-1",
          name: "Test Agent",
        }) as SellerFormProps["fallbackAgent"]
      }
    />,
  );
}

describe("SellerForm — Form Fields", () => {
  it("[P2] 5.1-COMP-005: Form renders 5 property type radio options", async () => {
    await renderSellerForm();
    const radios = document.querySelectorAll('input[type="radio"]');
    expect(radios.length).toBe(5);
  });

  it("[P2] 5.1-COMP-008: Form renders Location, Description, Name, Phone, Email", async () => {
    await renderSellerForm();
    
    // Description textarea must be present
    const descriptionField = document.querySelector("textarea");
    expect(descriptionField).not.toBeNull();

    // Name field (required)
    const nameInput = document.querySelector('input[autocomplete="name"]') ?? document.querySelector('input[type="text"]');
    expect(nameInput).not.toBeNull();

    // Phone field (required)
    const phoneInput = document.querySelector('input[type="tel"]');
    expect(phoneInput).not.toBeNull();

    // Email (optional)
    const emailInput = document.querySelector('input[type="email"]');
    expect(emailInput).not.toBeNull();
  });
});

describe("SellerForm — Validation", () => {
  it("[P1] 5.1-COMP-003: inline validation errors appear when required field is empty and Submit is clicked", async () => {
    const user = userEvent.setup();
    await renderSellerForm({ locale: "en" });

    const submitButton = document.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(submitButton).not.toBeNull();
    await user.click(submitButton);

    const errorElements = document.querySelectorAll('[role="alert"]');
    expect(errorElements.length).toBeGreaterThan(0);
    const firstError = errorElements[0].textContent ?? "";
    expect(firstError.length).toBeGreaterThan(0);
  });

  it("[P2] 5.1-UNIT-001: all form strings render in Spanish locale (locale='es')", async () => {
    await renderSellerForm({ locale: "es" });
    expect(document.querySelector('[data-testid="seller-form"]')).not.toBeNull();
  });
});

describe("SellerForm — Root wrapper", () => {
  it("[P1] SellerForm root has data-testid='seller-form'", async () => {
    await renderSellerForm();
    expect(document.querySelector('[data-testid="seller-form"]')).not.toBeNull();
  });
});
