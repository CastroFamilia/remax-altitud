"use client";

import { useState, useId, type FormEvent, type ChangeEvent } from "react";
import { useTranslations } from "next-intl";
import { SellerConfirmation } from "@/components/seller/seller-confirmation";
import type { Agent } from "@/lib/db/schema/agents";

export interface SellerFormData {
  propertyType: "Casa" | "Lote/Terreno" | "Finca" | "Condominio" | "Comercial" | "";
  locationText: string;
  description: string;
  name: string;
  phone: string;
  email: string;
}

type FormErrors = Partial<Record<keyof SellerFormData, string>>;

const PROPERTY_TYPES: {
  value: Exclude<SellerFormData["propertyType"], "">;
  labelKey: string;
}[] = [
  { value: "Casa", labelKey: "typeCasa" },
  { value: "Lote/Terreno", labelKey: "typeLote" },
  { value: "Finca", labelKey: "typeFinca" },
  { value: "Condominio", labelKey: "typeCondominio" },
  { value: "Comercial", labelKey: "typeCommercial" },
];

interface SellerFormV2Props {
  locale: string;
  fallbackAgent: Agent | null;
  officeName?: string;
}

export function SellerFormV2({
  locale,
  fallbackAgent,
  officeName = "REMAX Altitud",
}: SellerFormV2Props) {
  const t = useTranslations("SellerPageV2.form");
  const tValidation = useTranslations("SellerPage.form.validation");

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [matchedAgent, setMatchedAgent] = useState<Partial<Agent> | null>(null);
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
      newErrors.propertyType = tValidation("propertyTypeRequired");
    }
    if (!formData.locationText.trim()) {
      newErrors.locationText = tValidation("locationRequired");
    }
    if (!formData.name.trim()) {
      newErrors.name = tValidation("nameRequired");
    }
    if (!formData.phone.trim()) {
      newErrors.phone = tValidation("phoneRequired");
    } else if (!PHONE_RE.test(formData.phone) || !phoneHasEnoughDigits(formData.phone)) {
      newErrors.phone = tValidation("phoneInvalid");
    }
    if (formData.email && !EMAIL_RE.test(formData.email)) {
      newErrors.email = tValidation("emailInvalid");
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

    const { extractUtmParams } = await import("@/lib/utils/utm");
    const utmParams = extractUtmParams();

    const apiPayload = {
      propertyType: formData.propertyType,
      location: { text: formData.locationText, lat: null, lng: null },
      size: "",
      sizeUnit: "",
      priceExpectation: null,
      needsPricingHelp: true,
      description: formData.description,
      bedrooms: null,
      bathrooms: null,
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      preferredLanguage: locale === "es" ? "es" : "en",
      notes: "Captación vía Landing V2 (Diagnóstico Gratuito)",
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
        if (body.agent) {
          setMatchedAgent(body.agent);
        }
        setSubmitting(false);
        setSubmitted(true);
      } else if (response.status === 409) {
        setSubmitError(locale === "es" ? "Ya se envió esta solicitud." : "Already submitted.");
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
    const agentToShow = (matchedAgent as Agent | null) ?? fallbackAgent;
    if (agentToShow) {
      return <SellerConfirmation agent={agentToShow} officeName={officeName} locale={locale} />;
    }
  }

  return (
    <div id="diagnostico-form" className="mx-auto max-w-2xl px-4 py-16 scroll-mt-10">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-xl">
        <div className="text-center mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-gold">
            Cero Costo · Cero Compromiso
          </span>
          <h2 className="mt-2 text-2xl font-bold text-brand-navy sm:text-3xl">
            {t("heading")}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {t("subheading")}
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {/* Tipo de propiedad */}
          <div>
            <label className="block text-sm font-semibold text-brand-navy mb-2">
              {t("propertyTypeLabel")} <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {PROPERTY_TYPES.map(({ value, labelKey }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => updateField("propertyType", value)}
                  className={`flex items-center justify-center rounded-xl border px-3 py-2.5 text-xs sm:text-sm font-medium transition-all ${
                    formData.propertyType === value
                      ? "border-brand-navy bg-brand-navy text-white shadow-sm"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:border-brand-navy/30"
                  }`}
                >
                  {t(labelKey as never)}
                </button>
              ))}
            </div>
            {errors.propertyType && (
              <p className="mt-1 text-xs text-red-600">{errors.propertyType}</p>
            )}
          </div>

          {/* Ubicación */}
          <div>
            <label className="block text-sm font-semibold text-brand-navy mb-1.5">
              {t("locationLabel")} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.locationText}
              onChange={(e) => updateField("locationText", e.target.value)}
              placeholder={t("locationPlaceholder")}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-navy"
            />
            {errors.locationText && (
              <p className="mt-1 text-xs text-red-600">{errors.locationText}</p>
            )}
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-sm font-semibold text-brand-navy mb-1.5">
              {t("nameLabel")} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder={t("namePlaceholder")}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-navy"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Teléfono / WhatsApp */}
          <div>
            <label className="block text-sm font-semibold text-brand-navy mb-1.5">
              {t("phoneLabel")} <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              placeholder={t("phonePlaceholder")}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-navy"
            />
            <p className="mt-1 text-xs text-slate-500">{t("phoneHint")}</p>
            {errors.phone && (
              <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-brand-navy mb-1.5">
              {t("emailLabel")}
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => updateField("email", e.target.value)}
              placeholder={t("emailPlaceholder")}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-navy"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Detalles opcionales */}
          <div>
            <label className="block text-sm font-semibold text-brand-navy mb-1.5">
              {t("descriptionLabel")}
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder={t("descriptionPlaceholder")}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-navy resize-none"
            />
          </div>

          {submitError && (
            <div className="rounded-xl bg-red-50 p-4 text-xs sm:text-sm text-red-700">
              {submitError}
            </div>
          )}

          {/* Botón Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-brand-navy py-4 text-sm sm:text-base font-bold text-white shadow-lg transition-all hover:bg-brand-navy/90 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
          >
            {submitting ? t("submittingButton") : t("submitButton")}
          </button>
        </form>

        {/* Salida Directa a WhatsApp */}
        <div className="mt-8 border-t border-slate-100 pt-6 text-center">
          <p className="text-xs text-slate-500 mb-2">
            {t("directWhatsApp")}
          </p>
          <a
            href="https://wa.me/50660788887?text=Hola,%20quisiera%20consultar%20sobre%20vender%20mi%20propiedad%20con%20REMAX%20Altitud."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719" />
            </svg>
            {t("directWhatsAppButton")} →
          </a>
        </div>
      </div>
    </div>
  );
}
