"use client";

/**
 * VipInquiryForm — Lead capture form for the VIP Buyer page.
 *
 * Posts to /api/leads with source "contact_form" and intent "buy".
 * Includes honeypot protection, UTM tracking, and inline success/error states.
 * Styled for the dark navy booking section (white text on dark bg).
 */

import { useState, useRef, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CheckCircle2, Loader2, AlertCircle, MessageCircle } from "lucide-react";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FormErrors = Partial<Record<"name" | "email" | "phone" | "message", string>>;

function extractUtmParams() {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  return {
    source: params.get("utm_source") ?? undefined,
    medium: params.get("utm_medium") ?? undefined,
    campaign: params.get("utm_campaign") ?? undefined,
  };
}

export function VipInquiryForm() {
  const t = useTranslations("VipBuyerPage.form");
  const locale = useLocale();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [language, setLanguage] = useState<"en" | "es">(locale === "es" ? "es" : "en");
  const [budget, setBudget] = useState("");
  const [propertyType, setPropertyType] = useState("any");
  const [area, setArea] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState<"idle" | "success" | "error">("idle");

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  function validate(): FormErrors {
    const next: FormErrors = {};
    if (name.trim().length < 2) next.name = t("nameError");
    if (email.trim().length > 0 && !EMAIL_PATTERN.test(email.trim())) next.email = t("emailError");
    if (phone.replace(/\D/g, "").length < 7) next.phone = t("phoneError");
    if (message.trim().length < 10) next.message = t("messageError");
    return next;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (honeypot.trim().length > 0) return;

    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      if (nextErrors.name) nameRef.current?.focus();
      else if (nextErrors.phone) phoneRef.current?.focus();
      else if (nextErrors.email) emailRef.current?.focus();
      else if (nextErrors.message) messageRef.current?.focus();
      return;
    }

    setErrors({});
    setSubmitting(true);
    setSubmitState("idle");

    const utm = extractUtmParams();

    // Build notes from optional fields
    const noteParts: string[] = [];
    if (budget.trim()) noteParts.push(`Budget: ${budget.trim()}`);
    if (propertyType && propertyType !== "any") noteParts.push(`Property type: ${propertyType}`);
    if (area.trim()) noteParts.push(`Preferred area: ${area.trim()}`);
    noteParts.push(message.trim());

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim() || null,
          phone: phone.trim(),
          source: "vip_buyer_form" as const,
          intent: "buy" as const,
          propertyType: propertyType !== "any" ? propertyType : "",
          location: { text: area.trim(), lat: null, lng: null },
          priceExpectation: budget.trim() || null,
          notes: noteParts.join(" | "),
          preferredLanguage: language,
          utm_source: utm.source ?? null,
          utm_medium: utm.medium ?? null,
          utm_campaign: utm.campaign ?? null,
          referrer: typeof document !== "undefined" ? document.referrer || null : null,
        }),
      });

      if (response.ok || response.status === 409) {
        setSubmitState("success");
      } else {
        setSubmitState("error");
      }
    } catch {
      setSubmitState("error");
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Success State ───
  if (submitState === "success") {
    return (
      <div className="mx-auto max-w-xl animate-fade-in space-y-6 rounded-2xl border border-emerald-500/20 bg-emerald-950/30 p-8 text-center backdrop-blur-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-black text-white">{t("successHeading")}</h3>
          <p className="text-sm font-medium leading-relaxed text-white/80">{t("successMessage")}</p>
        </div>
      </div>
    );
  }

  const inputBase =
    "w-full h-11 rounded-lg border bg-white/5 px-4 text-sm text-white placeholder:text-white/40 backdrop-blur-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-gold/50";
  const inputNormal = `${inputBase} border-white/15 hover:border-white/25`;
  const inputError = `${inputBase} border-red-400/60`;

  const selectBase =
    "w-full h-11 rounded-lg border bg-white/5 px-3 text-sm text-white backdrop-blur-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-gold/50 appearance-none";

  return (
    <form noValidate onSubmit={handleSubmit} className="mx-auto w-full max-w-xl space-y-5">
      {/* Honeypot */}
      <input
        type="text"
        name="_hp_field"
        tabIndex={-1}
        autoComplete="nope"
        data-1p-ignore
        data-lpignore="true"
        data-bwignore="true"
        aria-label="Leave this field empty"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        style={{
          position: "absolute",
          left: "-9999px",
          width: 0,
          height: 0,
          overflow: "hidden",
          opacity: 0,
        }}
      />

      {/* Name (required) */}
      <div className="space-y-1.5">
        <label
          htmlFor="vip-name"
          className="text-xs font-bold uppercase tracking-wider text-white/70"
        >
          {t("nameLabel")} <span className="text-brand-gold">*</span>
        </label>
        <input
          ref={nameRef}
          id="vip-name"
          type="text"
          required
          autoComplete="name"
          placeholder={t("namePlaceholder")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={submitting}
          className={errors.name ? inputError : inputNormal}
        />
        {errors.name && <p className="text-xs font-semibold text-red-400">{errors.name}</p>}
      </div>

      {/* Phone (required) & Email (optional) — side by side on md+ */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label
            htmlFor="vip-phone"
            className="text-xs font-bold uppercase tracking-wider text-white/70"
          >
            {t("phoneLabel")} <span className="text-brand-gold">*</span>
          </label>
          <input
            ref={phoneRef}
            id="vip-phone"
            type="tel"
            required
            autoComplete="tel"
            placeholder={t("phonePlaceholder")}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={submitting}
            className={errors.phone ? inputError : inputNormal}
          />
          {errors.phone && <p className="text-xs font-semibold text-red-400">{errors.phone}</p>}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="vip-email"
            className="text-xs font-bold uppercase tracking-wider text-white/70"
          >
            {t("emailLabel")}
          </label>
          <input
            ref={emailRef}
            id="vip-email"
            type="email"
            autoComplete="email"
            placeholder={t("emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
            className={errors.email ? inputError : inputNormal}
          />
          {errors.email && <p className="text-xs font-semibold text-red-400">{errors.email}</p>}
        </div>
      </div>

      {/* Preferred Language */}
      <div className="space-y-1.5">
        <label
          htmlFor="vip-language"
          className="text-xs font-bold uppercase tracking-wider text-white/70"
        >
          {t("languageLabel")}
        </label>
        <select
          id="vip-language"
          value={language}
          onChange={(e) => setLanguage(e.target.value as "en" | "es")}
          disabled={submitting}
          className={`${selectBase} border-white/15 hover:border-white/25`}
        >
          <option value="en" className="bg-brand-navy text-white">
            {t("languageOptionEN")}
          </option>
          <option value="es" className="bg-brand-navy text-white">
            {t("languageOptionES")}
          </option>
        </select>
      </div>

      {/* Optional Details Row: Budget & Property Type */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label
            htmlFor="vip-budget"
            className="text-xs font-bold uppercase tracking-wider text-white/70"
          >
            {t("budgetLabel")}
          </label>
          <input
            id="vip-budget"
            type="text"
            placeholder={t("budgetPlaceholder")}
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            disabled={submitting}
            className={inputNormal}
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="vip-property-type"
            className="text-xs font-bold uppercase tracking-wider text-white/70"
          >
            {t("propertyTypeLabel")}
          </label>
          <select
            id="vip-property-type"
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
            disabled={submitting}
            className={`${selectBase} border-white/15 hover:border-white/25`}
          >
            <option value="any" className="bg-brand-navy text-white">
              {t("propertyTypeOptionAny")}
            </option>
            <option value="house" className="bg-brand-navy text-white">
              {t("propertyTypeOptionHouse")}
            </option>
            <option value="condo" className="bg-brand-navy text-white">
              {t("propertyTypeOptionCondo")}
            </option>
            <option value="lot" className="bg-brand-navy text-white">
              {t("propertyTypeOptionLot")}
            </option>
            <option value="farm" className="bg-brand-navy text-white">
              {t("propertyTypeOptionFarm")}
            </option>
            <option value="commercial" className="bg-brand-navy text-white">
              {t("propertyTypeOptionCommercial")}
            </option>
          </select>
        </div>
      </div>

      {/* Preferred Area (optional) */}
      <div className="space-y-1.5">
        <label
          htmlFor="vip-area"
          className="text-xs font-bold uppercase tracking-wider text-white/70"
        >
          {t("areaLabel")}
        </label>
        <input
          id="vip-area"
          type="text"
          placeholder={t("areaPlaceholder")}
          value={area}
          onChange={(e) => setArea(e.target.value)}
          disabled={submitting}
          className={inputNormal}
        />
      </div>

      {/* Message (required) */}
      <div className="space-y-1.5">
        <label
          htmlFor="vip-message"
          className="text-xs font-bold uppercase tracking-wider text-white/70"
        >
          {t("messageLabel")} <span className="text-brand-gold">*</span>
        </label>
        <textarea
          ref={messageRef}
          id="vip-message"
          required
          placeholder={t("messagePlaceholder")}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={submitting}
          rows={4}
          className={`${errors.message ? inputError : inputNormal} h-auto resize-none p-4`}
        />
        {errors.message && <p className="text-xs font-semibold text-red-400">{errors.message}</p>}
      </div>

      {/* Error Banner */}
      {submitState === "error" && (
        <div className="flex gap-2 rounded-lg border border-red-400/30 bg-red-900/20 p-3 text-sm text-red-300">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
          <div>
            <span className="font-bold">{t("errorHeading")}</span>
            <p className="mt-0.5 text-xs">{t("errorMessage")}</p>
          </div>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-gold font-bold text-brand-navy shadow-lg transition-all hover:bg-brand-gold-light hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>{t("submitting")}</span>
          </>
        ) : (
          <>
            <MessageCircle className="h-5 w-5" />
            <span>{t("submit")}</span>
          </>
        )}
      </button>
    </form>
  );
}
