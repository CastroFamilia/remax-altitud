"use client";

/**
 * CmaForm — Story 5.2 (AC #1–#7)
 *
 * Single-page CMA request form for seller lead capture.
 * Simpler than the 3-step SellerForm — all fields on one page.
 * Lazy-loaded via next/dynamic in cma-form-loader.tsx.
 *
 * Reuses:
 *   - LocationPicker from Story 5.1 (shared component)
 *   - SellerConfirmation with source="cma" variant
 *   - useLocaleUnits for size unit toggle
 *   - Same validation patterns as seller-form.tsx
 *
 * data-testid contract (CANNOT rename):
 *   cma-form             — root wrapper
 *   cma-form-fields      — fields container
 *   cma-submit-button    — submit button
 *   cma-confirmation     — rendered by SellerConfirmation (source="cma")
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

export interface CmaFormData {
  name: string;
  phone: string;
  email: string;
  propertyType: "Casa" | "Lote/Terreno" | "Finca" | "Condominio" | "Comercial" | "";
  location: LocationValue;
  approximateSize: string;
  sizeUnit: "sqm" | "sqft" | "acres";
  comment: string;
}

type FormErrors = Partial<Record<"name" | "phone" | "email", string>>;

// ---------------------------------------------------------------------------
// buildCmaLeadPayload — exported for test 5.2-COMP-003
// ---------------------------------------------------------------------------

export interface CmaLeadPayload {
  source: "cma_form";
  intent: "sell";
  name: string;
  phone: string;
  email: string;
  propertyType: string;
  location: LocationValue;
  approximateSize: string;
  sizeUnit: string;
  comment: string;
}

export function buildCmaLeadPayload(data: CmaFormData): CmaLeadPayload {
  return {
    source: "cma_form",
    intent: "sell",
    name: data.name,
    phone: data.phone,
    email: data.email,
    propertyType: data.propertyType,
    location: data.location,
    approximateSize: data.approximateSize,
    sizeUnit: data.sizeUnit,
    comment: data.comment,
  };
}

// ---------------------------------------------------------------------------
// Field helper (same pattern as seller-form.tsx)
// ---------------------------------------------------------------------------

interface FieldProps {
  label: string;
  error?: string;
  required?: boolean;
  optional?: boolean;
  optionalLabel?: string;
  children: (params: { id: string; describedBy?: string; invalid: boolean }) => React.ReactNode;
}

function Field({ label, error, required, optional, optionalLabel, children }: FieldProps) {
  const reactId = useId();
  const id = `cma-${reactId}`;
  const errorId = error ? `${id}-error` : undefined;
  const invalid = Boolean(error);
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-brand-navy">
        {label}
        {required && (
          <span aria-hidden className="ml-0.5 text-red-500">
            *
          </span>
        )}
        {optional && optionalLabel && (
          <span className="ml-1 text-xs font-normal text-text-muted">{optionalLabel}</span>
        )}
      </label>
      {children({ id, describedBy: errorId, invalid })}
      {error && (
        <span id={errorId} role="alert" className="text-xs text-[var(--color-error,#dc2626)]">
          {error}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Property type options
// ---------------------------------------------------------------------------

const PROPERTY_TYPES = [
  { value: "Casa", key: "typeCasa" },
  { value: "Lote/Terreno", key: "typeLote" },
  { value: "Finca", key: "typeFinca" },
  { value: "Condominio", key: "typeCondominio" },
  { value: "Comercial", key: "typeCommercial" },
] as const;

// ---------------------------------------------------------------------------
// Main CmaForm component
// ---------------------------------------------------------------------------

interface CmaFormProps {
  locale: string;
  fallbackAgent: Agent | null;
  officeName?: string;
}

export function CmaForm({
  locale,
  fallbackAgent,
  officeName = "RE/MAX Altitud",
}: CmaFormProps) {
  const t = useTranslations("CmaForm");
  const { unitSystem, toggleUnits } = useLocaleUnits(locale);

  // ---- Stable IDs for fields not wrapped by Field helper ----
  const emailFieldReactId = useId();
  const emailFieldId = `cma-email-${emailFieldReactId}`;
  const emailErrorId = `${emailFieldId}-error`;

  // ---- Form state ----
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<CmaFormData>({
    name: "",
    phone: "",
    email: "",
    propertyType: "",
    location: { text: "", lat: null, lng: null },
    approximateSize: "",
    sizeUnit: unitSystem === "metric" ? "sqm" : "sqft",
    comment: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // ---- Field update helper ----
  function updateField<K extends keyof CmaFormData>(key: K, value: CmaFormData[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  // ---- Validation (same patterns as seller-form.tsx) ----
  const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  const phoneHasEnoughDigits = (v: string) => v.replace(/\D/g, "").length >= 7;
  const PHONE_RE = /^\+?[\d\s\-()]+$/;

  function validate(): FormErrors {
    const errs: FormErrors = {};
    if (!formData.name.trim()) {
      errs.name = t("form.validation.nameRequired");
    }
    if (!formData.phone.trim()) {
      errs.phone = t("form.validation.phoneRequired");
    } else if (!PHONE_RE.test(formData.phone) || !phoneHasEnoughDigits(formData.phone)) {
      errs.phone = t("form.validation.phoneInvalid");
    }
    if (formData.email && !EMAIL_RE.test(formData.email)) {
      errs.email = t("form.validation.emailInvalid");
    }
    return errs;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitting(true);

    // 5.2 stub — Story 5.3 replaces with real API call.
    const payload = buildCmaLeadPayload(formData);
    if (process.env.NODE_ENV !== "production") {
      console.log("[5.2 stub] CMA form payload:", payload);
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
    setSubmitting(false);
    setSubmitted(true);
  }

  // Unit label
  const sizeUnitLabel = unitSystem === "metric" ? "m²" : "ft²";

  // ---- Post-submit: show confirmation screen ----
  if (submitted && fallbackAgent) {
    return <SellerConfirmation agent={fallbackAgent} officeName={officeName} locale={locale} source="cma" />;
  }

  return (
    <div data-testid="cma-form" className="mx-auto max-w-2xl">
      <h3 className="mb-6 text-xl font-bold text-brand-navy">{t("form.heading")}</h3>

      <form onSubmit={handleSubmit} noValidate>
        <div data-testid="cma-form-fields" className="space-y-5">
          {/* Name (required) */}
          <Field label={t("form.nameLabel")} required error={errors.name}>
            {({ id, describedBy, invalid }) => (
              <input
                id={id}
                type="text"
                value={formData.name}
                onChange={(e: ChangeEvent<HTMLInputElement>) => updateField("name", e.target.value)}
                placeholder={t("form.namePlaceholder")}
                aria-label={t("form.nameAriaLabel")}
                aria-describedby={describedBy}
                aria-invalid={invalid || undefined}
                required
                autoComplete="name"
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy"
              />
            )}
          </Field>

          {/* Phone / WhatsApp (required) */}
          <div className="space-y-1.5">
            <Field label={t("form.phoneLabel")} required error={errors.phone}>
              {({ id, describedBy, invalid }) => (
                <input
                  id={id}
                  type="tel"
                  value={formData.phone}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    updateField("phone", e.target.value)
                  }
                  placeholder={t("form.phonePlaceholder")}
                  aria-label={t("form.phoneAriaLabel")}
                  aria-describedby={describedBy}
                  aria-invalid={invalid || undefined}
                  required
                  autoComplete="tel"
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy"
                />
              )}
            </Field>
            <p className="text-xs text-text-muted">{t("form.phoneDescription")}</p>
          </div>

          {/* Email (optional) */}
          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <label htmlFor={emailFieldId} className="text-sm font-semibold text-brand-navy">
                {t("form.emailLabel")}
              </label>
              <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-text-muted">
                {t("form.emailOptionalBadge")}
              </span>
            </div>
            <input
              id={emailFieldId}
              type="email"
              value={formData.email}
              onChange={(e: ChangeEvent<HTMLInputElement>) => updateField("email", e.target.value)}
              placeholder={t("form.emailPlaceholder")}
              aria-label={t("form.emailAriaLabel")}
              aria-describedby={errors.email ? emailErrorId : undefined}
              aria-invalid={errors.email ? true : undefined}
              autoComplete="email"
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy"
            />
            {errors.email && (
              <span
                id={emailErrorId}
                role="alert"
                className="mt-1 text-xs text-[var(--color-error,#dc2626)]"
              >
                {errors.email}
              </span>
            )}
          </div>

          {/* Property Type (optional dropdown) */}
          <Field label={t("form.propertyTypeLabel")}>
            {({ id }) => (
              <select
                id={id}
                value={formData.propertyType}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  updateField(
                    "propertyType",
                    e.target.value as CmaFormData["propertyType"],
                  )
                }
                aria-label={t("form.propertyTypeAriaLabel")}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy"
              >
                <option value="">{t("form.propertyTypePlaceholder")}</option>
                {PROPERTY_TYPES.map(({ value, key }) => (
                  <option key={value} value={value}>
                    {t(`form.${key}` as Parameters<typeof t>[0])}
                  </option>
                ))}
              </select>
            )}
          </Field>

          {/* Location (reusing LocationPicker from Story 5.1) */}
          <div>
            <span className="mb-2 block text-sm font-semibold text-brand-navy">
              {t("form.locationLabel")}
            </span>
            <LocationPicker
              value={formData.location}
              onChange={(val) => updateField("location", val)}
              locale={locale}
              placeholder={t("form.locationPlaceholder")}
            />
          </div>

          {/* Approximate Size + unit toggle */}
          <Field label={t("form.sizeLabel")}>
            {({ id }) => (
              <div className="flex gap-2">
                <input
                  id={id}
                  type="number"
                  value={formData.approximateSize}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    updateField("approximateSize", e.target.value)
                  }
                  placeholder={t("form.sizePlaceholder")}
                  aria-label={t("form.sizeAriaLabel")}
                  min="0"
                  className="flex-1 rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy"
                />
                <button
                  type="button"
                  data-testid="cma-size-unit-toggle"
                  onClick={toggleUnits}
                  aria-label={t("form.sizeUnitAriaLabel")}
                  className="rounded-lg border border-border px-4 py-3 text-sm font-semibold text-brand-navy hover:bg-gray-50"
                >
                  {sizeUnitLabel}
                </button>
              </div>
            )}
          </Field>

          {/* Comment / Message (optional) */}
          <Field label={t("form.commentLabel")}>
            {({ id }) => (
              <textarea
                id={id}
                value={formData.comment}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                  updateField("comment", e.target.value)
                }
                placeholder={t("form.commentPlaceholder")}
                aria-label={t("form.commentAriaLabel")}
                rows={3}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy resize-none"
              />
            )}
          </Field>
        </div>

        {/* Submit button */}
        <div className="mt-8">
          <button
            type="submit"
            data-testid="cma-submit-button"
            disabled={submitting}
            aria-label={t("form.submitButtonAriaLabel")}
            className="w-full rounded-lg bg-brand-navy px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-brand-navy/90 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? t("form.submittingButton") : t("form.submitButton")}
          </button>
        </div>
      </form>
    </div>
  );
}
