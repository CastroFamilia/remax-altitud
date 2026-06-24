"use client";

import { useState, useId, type FormEvent, type ChangeEvent } from "react";
import { useTranslations } from "next-intl";
import { SellerConfirmation } from "@/components/seller/seller-confirmation";
import type { Agent } from "@/lib/db/schema/agents";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SellerFormData {
  propertyType: "Casa" | "Lote/Terreno" | "Finca" | "Condominio" | "Comercial" | "";
  locationText: string;
  description: string;
  name: string;
  phone: string;
  email: string;
}

type FormErrors = Partial<Record<keyof SellerFormData, string>>;

type PropertyType = SellerFormData["propertyType"];

const PROPERTY_TYPES: {
  value: Exclude<PropertyType, "">;
  labelKey: keyof ReturnType<typeof useTranslations>;
}[] = [
  { value: "Casa", labelKey: "form.step1.typeCasa" as never },
  { value: "Lote/Terreno", labelKey: "form.step1.typeLote" as never },
  { value: "Finca", labelKey: "form.step1.typeFinca" as never },
  { value: "Condominio", labelKey: "form.step1.typeCondominio" as never },
  { value: "Comercial", labelKey: "form.step1.typeCommercial" as never },
];

export interface LeadPayload {
  propertyType: string;
  location: { text: string; lat: null; lng: null };
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

export function buildLeadPayload(data: SellerFormData, locale: string): LeadPayload {
  return {
    propertyType: data.propertyType,
    location: { text: data.locationText, lat: null, lng: null },
    size: "",
    sizeUnit: "",
    priceExpectation: null,
    needsPricingHelp: false,
    description: data.description,
    bedrooms: null,
    bathrooms: null,
    name: data.name,
    phone: data.phone,
    email: data.email,
    preferredLanguage: locale === "es" ? "es" : "en",
    notes: "",
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
  optionalLabel?: string;
  children: (params: { id: string; describedBy?: string; invalid: boolean }) => React.ReactNode;
}

function Field({ label, error, required, optional, optionalLabel, children }: FieldProps) {
  const reactId = useId();
  const id = `sf-${reactId}`;
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
// Main SellerForm component
// ---------------------------------------------------------------------------

interface SellerFormProps {
  locale: string;
  fallbackAgent: Agent | null;
  officeName?: string;
}

export function SellerForm({
  locale,
  fallbackAgent: _fallbackAgent,
  officeName = "REMAX Altitud",
}: SellerFormProps) {
  const t = useTranslations("SellerPage");

  // ---- Stable IDs for fields not wrapped by Field helper ----
  const emailFieldReactId = useId();
  const emailFieldId = `sf-email-${emailFieldReactId}`;
  const emailErrorId = `${emailFieldId}-error`;
  const propertyTypeReactId = useId();
  const propertyTypeErrorId = `sf-propertyType-${propertyTypeReactId}-error`;

  // ---- Form state ----
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [formData, setFormData] = useState<SellerFormData>({
    propertyType: "",
    locationText: "",
    description: "",
    name: "",
    phone: "",
    email: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});

  function updateField<K extends keyof SellerFormData>(key: K, value: SellerFormData[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  const phoneHasEnoughDigits = (v: string) => v.replace(/\D/g, "").length >= 7;
  const PHONE_RE = /^\+?[\d\s\-()]+$/;

  function validateForm(): FormErrors {
    const newErrors: FormErrors = {};
    if (!formData.propertyType) {
      newErrors.propertyType = t("form.validation.propertyTypeRequired");
    }
    if (!formData.locationText.trim()) {
      newErrors.locationText = t("form.validation.locationRequired");
    }
    if (!formData.name.trim()) {
      newErrors.name = t("form.validation.nameRequired");
    }
    if (!formData.phone.trim()) {
      newErrors.phone = t("form.validation.phoneRequired");
    } else if (!PHONE_RE.test(formData.phone) || !phoneHasEnoughDigits(formData.phone)) {
      newErrors.phone = t("form.validation.phoneInvalid");
    }
    if (formData.email && !EMAIL_RE.test(formData.email)) {
      newErrors.email = t("form.validation.emailInvalid");
    }
    return newErrors;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    setSubmitError(null);

    const payload = buildLeadPayload(formData, locale);

    const { extractUtmParams } = await import("@/lib/utils/utm");
    const utmParams = extractUtmParams();

    const apiPayload = {
      ...payload,
      source: "seller_form" as const,
      intent: "sell" as const,
      utm_source: utmParams.source ?? null,
      utm_medium: utmParams.medium ?? null,
      utm_campaign: utmParams.campaign ?? null,
      referrer: typeof document !== "undefined" ? document.referrer || null : null,
    };

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiPayload),
      });

      const body = await response.json();

      if (response.status === 201) {
        setSubmitting(false);
        setSubmitted(true);
      } else if (response.status === 409) {
        setSubmitError(locale === "es" ? "Ya se envió esta solicitud." : "Already submitted.");
        setSubmitting(false);
      } else if (response.status === 400) {
        const issues =
          body.issues?.map((i: { message: string }) => i.message).join(", ") ?? "Validation error";
        setSubmitError(issues);
        setSubmitting(false);
      } else {
        setSubmitError(
          locale === "es"
            ? "Error al enviar. Intente de nuevo."
            : "Submission failed. Please try again.",
        );
        setSubmitting(false);
      }
    } catch {
      setSubmitError(
        locale === "es"
          ? "Error de conexión. Intente de nuevo."
          : "Connection error. Please try again.",
      );
      setSubmitting(false);
    }
  }

  if (submitted) {
    return <SellerConfirmation agent={null} officeName={officeName} locale={locale} />;
  }

  return (
    <div id="seller-form" data-testid="seller-form" className="mx-auto max-w-2xl px-4 py-10">
      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <h2 className="text-xl font-bold text-brand-navy">{t("form.step1.heading")}</h2>

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
            aria-describedby={errors.propertyType ? propertyTypeErrorId : undefined}
            aria-invalid={errors.propertyType ? true : undefined}
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
                        : "typeCommercial"
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
                    onChange={() => updateField("propertyType", value as Exclude<PropertyType, "">)}
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
          {errors.propertyType && (
            <span
              id={propertyTypeErrorId}
              role="alert"
              className="mt-1 text-xs text-[var(--color-error,#dc2626)]"
            >
              {errors.propertyType}
            </span>
          )}
        </fieldset>

        <Field label={t("form.step1.locationLabel")} required error={errors.locationText}>
          {({ id, describedBy, invalid }) => (
            <input
              id={id}
              type="text"
              value={formData.locationText}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                updateField("locationText", e.target.value)
              }
              placeholder={t("form.step1.locationPlaceholder")}
              aria-describedby={describedBy}
              aria-invalid={invalid || undefined}
              required
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy"
            />
          )}
        </Field>

        <Field label={t("form.step2.descriptionLabel")}>
          {({ id }) => (
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

        <Field label={t("form.step3.nameLabel")} required error={errors.name}>
          {({ id, describedBy, invalid }) => (
            <input
              id={id}
              type="text"
              value={formData.name}
              onChange={(e: ChangeEvent<HTMLInputElement>) => updateField("name", e.target.value)}
              placeholder={t("form.step3.namePlaceholder")}
              aria-label={t("form.step3.nameAriaLabel")}
              aria-describedby={describedBy}
              aria-invalid={invalid || undefined}
              required
              autoComplete="name"
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy"
            />
          )}
        </Field>

        <div className="space-y-1.5">
          <Field label={t("form.step3.phoneLabel")} required error={errors.phone}>
            {({ id, describedBy, invalid }) => (
              <input
                id={id}
                type="tel"
                value={formData.phone}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  updateField("phone", e.target.value)
                }
                placeholder={t("form.step3.phonePlaceholder")}
                aria-label={t("form.step3.phoneAriaLabel")}
                aria-describedby={describedBy}
                aria-invalid={invalid || undefined}
                required
                autoComplete="tel"
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy"
              />
            )}
          </Field>
          <p className="text-xs text-text-muted">{t("form.step3.phoneDescription")}</p>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <label htmlFor={emailFieldId} className="text-sm font-semibold text-brand-navy">
              {t("form.step3.emailLabel")}
            </label>
            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-text-muted">
              {t("form.step3.emailOptionalBadge")}
            </span>
          </div>
          <input
            id={emailFieldId}
            type="email"
            value={formData.email}
            onChange={(e: ChangeEvent<HTMLInputElement>) => updateField("email", e.target.value)}
            placeholder={t("form.step3.emailPlaceholder")}
            aria-label={t("form.step3.emailAriaLabel")}
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

        {submitError && (
          <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {submitError}
          </div>
        )}

        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            aria-label={t("form.submitButtonAriaLabel")}
            className="w-full rounded-lg bg-brand-navy px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-navy/90 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? t("form.submittingButton") : t("form.submitButton")}
          </button>
        </div>
      </form>
    </div>
  );
}
