"use client";

/**
 * SellerForm — Story 5.1 (AC #2–#14)
 *
 * 3-step progressive form for seller lead capture.
 * Lazy-loaded via next/dynamic in sell/page.tsx (R-006 compliance).
 *
 * Step 1 (Basics ~60s):  Property Type, Location (LocationPicker), Size
 * Step 2 (Details ~90s): Price, Pricing Help, Description, Photos, Beds/Baths
 * Step 3 (Contact ~30s): Name, Phone, Email, Preferred Language
 *
 * data-testid contract (CANNOT rename):
 *   seller-form         — root wrapper
 *   progress-bar        — segmented progress indicator
 *   form-step-1         — step 1 container
 *   form-step-2         — step 2 container
 *   form-step-3         — step 3 container
 *   pricing-help-checkbox — pricing help checkbox
 *   beds-baths-fields   — conditional bedrooms/bathrooms container
 *   seller-confirmation — rendered by SellerConfirmation component
 */

import { useState, useId, type FormEvent, type ChangeEvent } from "react";
import { useTranslations } from "next-intl";
import { useLocaleUnits } from "@/hooks/use-locale-units";
import { LocationPicker, type LocationValue } from "@/components/seller/location-picker";
import { SellerConfirmation } from "@/components/seller/seller-confirmation";
import type { Agent } from "@/lib/db/schema/agents";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SellerFormData {
  // Step 1
  propertyType: "Casa" | "Lote/Terreno" | "Finca" | "Condominio" | "Comercial" | "";
  location: LocationValue;
  size: string;
  sizeUnit: "sqm" | "sqft" | "acres";
  // Step 2
  priceExpectation: string;
  needsPricingHelp: boolean;
  description: string;
  photos: File[];
  bedrooms: string;
  bathrooms: string;
  // Step 3
  name: string;
  phone: string;
  email: string;
  preferredLanguage: "en" | "es";
}

type Step1Errors = Partial<Record<"propertyType" | "location" | "size", string>>;
type Step2Errors = Partial<Record<"priceExpectation", string>>;
type Step3Errors = Partial<Record<"name" | "phone" | "email", string>>;

type PropertyType = SellerFormData["propertyType"];

const PROPERTY_TYPES: {
  value: Exclude<PropertyType, "">;
  labelKey: keyof ReturnType<typeof useTranslations>;
}[] = [
  { value: "Casa", labelKey: "form.step1.typeCasa" as never },
  { value: "Lote/Terreno", labelKey: "form.step1.typeLote" as never },
  { value: "Finca", labelKey: "form.step1.typeFinca" as never },
  { value: "Condominio", labelKey: "form.step1.typeCondominio" as never },
  { value: "Comercial", labelKey: "form.step1.typeComericial" as never },
];

// ---------------------------------------------------------------------------
// buildLeadPayload — exported for test 5.1-COMP-002b
// ---------------------------------------------------------------------------

export interface LeadPayload {
  propertyType: string;
  location: LocationValue;
  size: string;
  sizeUnit: string;
  priceExpectation: string | null;
  needsPricingHelp: boolean;
  description: string;
  bedrooms: string | null;
  bathrooms: string | null;
  name: string;
  phone: string;
  email: string;
  preferredLanguage: string;
  notes: string;
}

export function buildLeadPayload(data: SellerFormData): LeadPayload {
  const notes = data.needsPricingHelp ? "Seller needs pricing consultation" : "";
  return {
    propertyType: data.propertyType,
    location: data.location,
    size: data.size,
    sizeUnit: data.sizeUnit,
    priceExpectation: data.priceExpectation || null,
    needsPricingHelp: data.needsPricingHelp,
    description: data.description,
    bedrooms: data.bedrooms || null,
    bathrooms: data.bathrooms || null,
    name: data.name,
    phone: data.phone,
    email: data.email,
    preferredLanguage: data.preferredLanguage,
    notes,
  };
}

// ---------------------------------------------------------------------------
// Field helper component
// ---------------------------------------------------------------------------

interface FieldProps {
  label: string;
  error?: string;
  required?: boolean;
  optional?: boolean;
  children: (id: string) => React.ReactNode;
}

function Field({ label, error, required, optional, children }: FieldProps) {
  const reactId = useId();
  const id = `sf-${reactId}`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-brand-navy">
        {label}
        {required && (
          <span aria-hidden className="ml-0.5 text-red-500">
            *
          </span>
        )}
        {optional && <span className="ml-1 text-xs font-normal text-text-muted">(Optional)</span>}
      </label>
      {children(id)}
      {error && (
        <span role="alert" className="text-xs text-[var(--color-error,#dc2626)]">
          {error}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main SellerForm component
// ---------------------------------------------------------------------------

interface SellerFormProps {
  locale: string;
  fallbackAgent: Agent | null;
  officeName?: string;
}

export function SellerForm({
  locale,
  fallbackAgent,
  officeName = "RE/MAX Altitud",
}: SellerFormProps) {
  const t = useTranslations("SellerPage");
  const { unitSystem, toggleUnits } = useLocaleUnits(locale);

  // ---- Form state ----
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<SellerFormData>({
    propertyType: "",
    location: { text: "", lat: null, lng: null },
    size: "",
    sizeUnit: unitSystem === "metric" ? "sqm" : "sqft",
    priceExpectation: "",
    needsPricingHelp: false,
    description: "",
    photos: [],
    bedrooms: "",
    bathrooms: "",
    name: "",
    phone: "",
    email: "",
    preferredLanguage: locale === "es" ? "es" : "en",
  });

  // ---- Validation errors ----
  const [step1Errors, setStep1Errors] = useState<Step1Errors>({});
  const [step2Errors, setStep2Errors] = useState<Step2Errors>({});
  const [step3Errors, setStep3Errors] = useState<Step3Errors>({});

  // ---- Field update helpers ----
  function updateField<K extends keyof SellerFormData>(key: K, value: SellerFormData[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  // ---- Step navigation ----
  const PHONE_RE = /^\+?[\d\s\-()+]{7,}$/;
  const EMAIL_RE = /^[^@]+@[^@]+\.[^@]+$/;

  function validateStep1(): Step1Errors {
    const errors: Step1Errors = {};
    if (!formData.propertyType) {
      errors.propertyType = t("form.validation.propertyTypeRequired");
    }
    if (!formData.location.text.trim()) {
      errors.location = t("form.validation.locationRequired");
    }
    return errors;
  }

  function validateStep2(): Step2Errors {
    const errors: Step2Errors = {};
    if (!formData.needsPricingHelp && formData.priceExpectation) {
      const price = Number(formData.priceExpectation);
      if (Number.isNaN(price)) {
        errors.priceExpectation = t("form.validation.priceInvalid");
      }
    }
    return errors;
  }

  function validateStep3(): Step3Errors {
    const errors: Step3Errors = {};
    if (!formData.name.trim()) {
      errors.name = t("form.validation.nameRequired");
    }
    if (!formData.phone.trim()) {
      errors.phone = t("form.validation.phoneRequired");
    } else if (!PHONE_RE.test(formData.phone)) {
      errors.phone = t("form.validation.phoneInvalid");
    }
    if (formData.email && !EMAIL_RE.test(formData.email)) {
      errors.email = t("form.validation.emailInvalid");
    }
    return errors;
  }

  function handleNext() {
    if (step === 1) {
      const errors = validateStep1();
      if (Object.keys(errors).length > 0) {
        setStep1Errors(errors);
        return;
      }
      setStep1Errors({});
      setStep(2);
    } else if (step === 2) {
      const errors = validateStep2();
      if (Object.keys(errors).length > 0) {
        setStep2Errors(errors);
        return;
      }
      setStep2Errors({});
      setStep(3);
    }
  }

  function handleBack() {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const errors = validateStep3();
    if (Object.keys(errors).length > 0) {
      setStep3Errors(errors);
      return;
    }
    setStep3Errors({});
    setSubmitting(true);

    // 5.1 stub — Story 5.3 replaces with real API call
    const payload = buildLeadPayload(formData);
    console.log("[5.1 stub] seller form payload:", payload);

    await new Promise((resolve) => setTimeout(resolve, 500));
    setSubmitting(false);
    setSubmitted(true);
  }

  // Beds/Baths visibility (R-012 mitigation, AC #5)
  const showBedsBaths = formData.propertyType !== "Lote/Terreno";

  // Price required unless needsPricingHelp (R-008 mitigation, AC #6)
  const priceRequired = !formData.needsPricingHelp;

  // Unit label
  const sizeUnitLabel = unitSystem === "metric" ? "m²" : "ft²";

  // ---- Post-submit: show confirmation screen ----
  if (submitted && fallbackAgent) {
    return <SellerConfirmation agent={fallbackAgent} officeName={officeName} locale={locale} />;
  }

  // Progress bar step labels
  const stepLabels = [
    { label: t("form.step1Label"), estimate: t("form.step1TimeEstimate") },
    { label: t("form.step2Label"), estimate: t("form.step2TimeEstimate") },
    { label: t("form.step3Label"), estimate: t("form.step3TimeEstimate") },
  ];

  return (
    <div id="seller-form" data-testid="seller-form" className="mx-auto max-w-2xl px-4 py-10">
      {/* Progress bar (AC #2) */}
      <nav
        data-testid="progress-bar"
        aria-label={t("form.progressAriaLabel", { current: step, total: 3 })}
        className="mb-8"
      >
        <ol className="flex items-center gap-0">
          {stepLabels.map((s, i) => {
            const stepNum = (i + 1) as 1 | 2 | 3;
            const isActive = stepNum === step;
            const isCompleted = stepNum < step;
            return (
              <li key={stepNum} className="flex flex-1 flex-col items-center">
                <div className="flex w-full items-center">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                      isCompleted
                        ? "bg-brand-navy text-white"
                        : isActive
                          ? "bg-brand-gold text-brand-navy"
                          : "bg-gray-200 text-gray-400"
                    }`}
                    aria-current={isActive ? "step" : undefined}
                  >
                    {isCompleted ? "✓" : stepNum}
                  </div>
                  {i < 2 && (
                    <div
                      className={`h-1 flex-1 transition-colors ${
                        isCompleted ? "bg-brand-navy" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
                <span
                  className={`mt-1 text-xs ${
                    isActive ? "font-semibold text-brand-navy" : "text-text-muted"
                  }`}
                >
                  {s.label}
                </span>
                <span className="text-xs text-text-muted">{s.estimate}</span>
              </li>
            );
          })}
        </ol>
      </nav>

      <form onSubmit={handleSubmit} noValidate>
        {/* ---------------------------------------------------------------- */}
        {/* STEP 1 — Basics */}
        {/* ---------------------------------------------------------------- */}
        {step === 1 && (
          <div data-testid="form-step-1" className="space-y-6">
            <h2 className="text-xl font-bold text-brand-navy">{t("form.step1.heading")}</h2>

            {/* Property Type — 5 radio options (AC #3, 5.1-COMP-005) */}
            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-brand-navy">
                {t("form.step1.propertyTypeLabel")}
                <span aria-hidden className="ml-0.5 text-red-500">
                  *
                </span>
              </legend>
              <div
                className="grid grid-cols-2 gap-2 sm:grid-cols-3"
                role="radiogroup"
                aria-label={t("form.step1.propertyTypeAriaLabel")}
              >
                {PROPERTY_TYPES.map(({ value }) => {
                  const labelKey = `form.step1.${
                    value === "Casa"
                      ? "typeCasa"
                      : value === "Lote/Terreno"
                        ? "typeLote"
                        : value === "Finca"
                          ? "typeFinca"
                          : value === "Condominio"
                            ? "typeCondominio"
                            : "typeComericial"
                  }` as Parameters<typeof t>[0];
                  return (
                    <label
                      key={value}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                        formData.propertyType === value
                          ? "border-brand-navy bg-brand-navy/5 font-semibold"
                          : "border-border hover:border-brand-navy/30"
                      }`}
                    >
                      <input
                        type="radio"
                        name="propertyType"
                        value={value}
                        checked={formData.propertyType === value}
                        onChange={() =>
                          updateField("propertyType", value as Exclude<PropertyType, "">)
                        }
                        className="sr-only"
                        aria-label={t(labelKey)}
                      />
                      <span
                        className={`h-4 w-4 shrink-0 rounded-full border-2 ${
                          formData.propertyType === value
                            ? "border-brand-navy bg-brand-navy"
                            : "border-gray-300"
                        }`}
                        aria-hidden
                      />
                      {t(labelKey)}
                    </label>
                  );
                })}
              </div>
              {step1Errors.propertyType && (
                <span role="alert" className="mt-1 text-xs text-[var(--color-error,#dc2626)]">
                  {step1Errors.propertyType}
                </span>
              )}
            </fieldset>

            {/* Location — LocationPicker (AC #3, #4) */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-brand-navy">
                {t("form.step1.locationLabel")}
                <span aria-hidden className="ml-0.5 text-red-500">
                  *
                </span>
              </label>
              <LocationPicker
                value={formData.location}
                onChange={(val) => updateField("location", val)}
                locale={locale}
                placeholder={t("form.step1.locationPlaceholder")}
              />
              {step1Errors.location && (
                <span role="alert" className="mt-1 text-xs text-[var(--color-error,#dc2626)]">
                  {step1Errors.location}
                </span>
              )}
            </div>

            {/* Size + unit toggle (AC #3, 5.1-COMP-006) */}
            <Field label={t("form.step1.sizeLabel")}>
              {(id) => (
                <div className="flex gap-2">
                  <input
                    id={id}
                    type="number"
                    value={formData.size}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      updateField("size", e.target.value)
                    }
                    placeholder={t("form.step1.sizePlaceholder")}
                    aria-label={t("form.step1.sizeAriaLabel")}
                    min="0"
                    className="flex-1 rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy"
                  />
                  <button
                    type="button"
                    data-testid="size-unit-toggle"
                    onClick={toggleUnits}
                    aria-label={t("form.step1.sizeUnitAriaLabel")}
                    className="rounded-lg border border-border px-4 py-3 text-sm font-semibold text-brand-navy hover:bg-gray-50"
                  >
                    {sizeUnitLabel}
                  </button>
                </div>
              )}
            </Field>

            {/* Step navigation */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleNext}
                aria-label={t("form.nextButtonAriaLabel")}
                className="rounded-lg bg-brand-navy px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-navy/90"
              >
                {t("form.nextButton")}
              </button>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* STEP 2 — Details */}
        {/* ---------------------------------------------------------------- */}
        {step === 2 && (
          <div data-testid="form-step-2" className="space-y-6">
            <h2 className="text-xl font-bold text-brand-navy">{t("form.step2.heading")}</h2>

            {/* Price Expectation (AC #5) */}
            <Field
              label={t("form.step2.priceLabel")}
              required={priceRequired}
              optional={!priceRequired}
              error={step2Errors.priceExpectation}
            >
              {(id) => (
                <input
                  id={id}
                  name="priceExpectation"
                  type="number"
                  value={formData.priceExpectation}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    updateField("priceExpectation", e.target.value)
                  }
                  placeholder={t("form.step2.pricePlaceholder")}
                  aria-label={t("form.step2.priceAriaLabel")}
                  required={priceRequired}
                  min="0"
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy"
                />
              )}
            </Field>

            {/* Pricing Help checkbox (AC #6, R-008) */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="pricing-help"
                data-testid="pricing-help-checkbox"
                checked={formData.needsPricingHelp}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  updateField("needsPricingHelp", e.target.checked)
                }
                className="mt-0.5 h-4 w-4 rounded border-border text-brand-navy"
              />
              <div>
                <label
                  htmlFor="pricing-help"
                  className="text-sm font-semibold text-brand-navy cursor-pointer"
                >
                  {t("form.step2.pricingHelpLabel")}
                </label>
                <p className="mt-0.5 text-xs text-text-muted">
                  {t("form.step2.pricingHelpDescription")}
                </p>
              </div>
            </div>

            {/* Description (optional) (AC #5) */}
            <Field label={t("form.step2.descriptionLabel")}>
              {(id) => (
                <textarea
                  id={id}
                  value={formData.description}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                    updateField("description", e.target.value)
                  }
                  placeholder={t("form.step2.descriptionPlaceholder")}
                  aria-label={t("form.step2.descriptionAriaLabel")}
                  rows={4}
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy resize-none"
                />
              )}
            </Field>

            {/* Photos (optional) (AC #5) */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-brand-navy">
                {t("form.step2.photosLabel")}
              </label>
              <p className="text-xs text-text-muted">{t("form.step2.photosDescription")}</p>
              <label
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-4 py-3 text-sm text-text-muted hover:border-brand-navy/30 hover:text-brand-navy transition-colors"
                aria-label={t("form.step2.photosAriaLabel")}
              >
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  multiple
                  className="sr-only"
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    if (e.target.files) {
                      const files = Array.from(e.target.files).slice(0, 5);
                      updateField("photos", files);
                    }
                  }}
                />
                {t("form.step2.photosButton")}
                {formData.photos.length > 0 && (
                  <span className="ml-2 text-brand-navy font-medium">
                    ({formData.photos.length})
                  </span>
                )}
              </label>
            </div>

            {/* Bedrooms / Bathrooms — hidden for Lote/Terreno (AC #5, R-012) */}
            {showBedsBaths && (
              <div data-testid="beds-baths-fields" className="grid grid-cols-2 gap-4">
                <Field label={t("form.step2.bedroomsLabel")}>
                  {(id) => (
                    <select
                      id={id}
                      value={formData.bedrooms}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                        updateField("bedrooms", e.target.value)
                      }
                      aria-label={t("form.step2.bedroomsAriaLabel")}
                      className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy"
                    >
                      <option value="">—</option>
                      {[1, 2, 3, 4, 5, 6, 7, "8+"].map((n) => (
                        <option key={n} value={String(n)}>
                          {n}
                        </option>
                      ))}
                    </select>
                  )}
                </Field>
                <Field label={t("form.step2.bathroomsLabel")}>
                  {(id) => (
                    <select
                      id={id}
                      value={formData.bathrooms}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                        updateField("bathrooms", e.target.value)
                      }
                      aria-label={t("form.step2.bathroomsAriaLabel")}
                      className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy"
                    >
                      <option value="">—</option>
                      {[1, 1.5, 2, 2.5, 3, 4, "5+"].map((n) => (
                        <option key={n} value={String(n)}>
                          {n}
                        </option>
                      ))}
                    </select>
                  )}
                </Field>
              </div>
            )}

            {/* Step navigation */}
            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={handleBack}
                aria-label={t("form.backButtonAriaLabel")}
                className="rounded-lg border border-border px-6 py-3 text-sm font-semibold text-brand-navy transition-colors hover:bg-gray-50"
              >
                {t("form.backButton")}
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label={t("form.nextButtonAriaLabel")}
                className="rounded-lg bg-brand-navy px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-navy/90"
              >
                {t("form.nextButton")}
              </button>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* STEP 3 — Contact */}
        {/* ---------------------------------------------------------------- */}
        {step === 3 && (
          <div data-testid="form-step-3" className="space-y-6">
            <h2 className="text-xl font-bold text-brand-navy">{t("form.step3.heading")}</h2>

            {/* Name (required) (AC #7) */}
            <Field label={t("form.step3.nameLabel")} required error={step3Errors.name}>
              {(id) => (
                <input
                  id={id}
                  type="text"
                  value={formData.name}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    updateField("name", e.target.value)
                  }
                  placeholder={t("form.step3.namePlaceholder")}
                  aria-label={t("form.step3.nameAriaLabel")}
                  required
                  autoComplete="name"
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy"
                />
              )}
            </Field>

            {/* Phone / WhatsApp (required) (AC #7) */}
            <div className="space-y-1.5">
              <Field label={t("form.step3.phoneLabel")} required error={step3Errors.phone}>
                {(id) => (
                  <input
                    id={id}
                    type="tel"
                    value={formData.phone}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      updateField("phone", e.target.value)
                    }
                    placeholder={t("form.step3.phonePlaceholder")}
                    aria-label={t("form.step3.phoneAriaLabel")}
                    required
                    autoComplete="tel"
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy"
                  />
                )}
              </Field>
              <p className="text-xs text-text-muted">{t("form.step3.phoneDescription")}</p>
            </div>

            {/* Email (optional) (AC #7) */}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <label className="text-sm font-semibold text-brand-navy">
                  {t("form.step3.emailLabel")}
                </label>
                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-text-muted">
                  {t("form.step3.emailOptionalBadge")}
                </span>
              </div>
              <input
                type="email"
                value={formData.email}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  updateField("email", e.target.value)
                }
                placeholder={t("form.step3.emailPlaceholder")}
                aria-label={t("form.step3.emailAriaLabel")}
                autoComplete="email"
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy"
              />
              {step3Errors.email && (
                <span role="alert" className="mt-1 text-xs text-[var(--color-error,#dc2626)]">
                  {step3Errors.email}
                </span>
              )}
            </div>

            {/* Preferred Language (auto-detected, selectable) (AC #7) */}
            <Field label={t("form.step3.languageLabel")}>
              {(id) => (
                <select
                  id={id}
                  value={formData.preferredLanguage}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    updateField("preferredLanguage", e.target.value as "en" | "es")
                  }
                  aria-label={t("form.step3.languageAriaLabel")}
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy"
                >
                  <option value="en">{t("form.step3.languageEn")}</option>
                  <option value="es">{t("form.step3.languageEs")}</option>
                </select>
              )}
            </Field>

            {/* Step navigation */}
            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={handleBack}
                aria-label={t("form.backButtonAriaLabel")}
                className="rounded-lg border border-border px-6 py-3 text-sm font-semibold text-brand-navy transition-colors hover:bg-gray-50"
              >
                {t("form.backButton")}
              </button>
              <button
                type="submit"
                disabled={submitting}
                aria-label={t("form.submitButtonAriaLabel")}
                className="rounded-lg bg-brand-navy px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-navy/90 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? t("form.submittingButton") : t("form.submitButton")}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
