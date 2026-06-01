"use client";

/**
 * PropertyInquiryForm — Premium lead capture & direct contact card for listing pages.
 *
 * Integrates direct WhatsApp & Email contact options with an interactive
 * property inquiry form that submits to the lead capture API /api/leads.
 * Includes honeypot protection, UTM parameter tracking, click tracking,
 * and elegant localized success/error states.
 */

import { useState, useRef, type FormEvent } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Mail, AlertCircle, CheckCircle2, Loader2, Info } from "lucide-react";
import { buildWhatsAppMessage, buildWhatsAppUrl } from "@/lib/utils/whatsapp";
import { extractUtmParams } from "@/lib/utils/utm";
import { trackWhatsAppClick } from "@/components/lead/whatsapp-cta";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import type { Property } from "@/lib/db/schema/properties";
import type { Agent } from "@/lib/db/schema/agents";

interface PropertyInquiryFormProps {
  property: Property;
  agent: Agent | null;
  locale: string;
  officeName: string;
}

const KNOWN_LANGUAGES = new Set(["en", "es", "de", "fr", "it", "pt"]);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OFFICE_EMAIL = "info@remax-altitud.cr";
const OFFICE_WHATSAPP = "50627710000"; // Fallback office number

export function PropertyInquiryForm({
  property,
  agent,
  locale,
  officeName,
}: PropertyInquiryFormProps) {
  const t = useTranslations("PropertyInquiryForm");
  const tAgent = useTranslations("AgentCard");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState(() => {
    const title = (locale === "es" ? property.titleEs : property.titleEn) ?? "";
    const ref = property.apiId ?? property.id;
    return t("messageDefault", { title, ref });
  });
  const [honeypot, setHoneypot] = useState("");

  const [errors, setErrors] = useState<
    Partial<Record<"name" | "email" | "phone" | "message", string>>
  >({});
  const [submitting, setSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState<"idle" | "success" | "error">("idle");

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  // 1. WhatsApp Details
  const whatsappDigits = agent?.whatsapp ? agent.whatsapp.replace(/\D/g, "") : OFFICE_WHATSAPP;
  const agentName = agent?.name ?? "REMAX Altitud";
  const title = (locale === "es" ? property.titleEs : property.titleEn) ?? "";
  const ref = property.apiId ?? property.id;

  const whatsappMessage = buildWhatsAppMessage({
    agentName,
    propertyTitle: title,
    propertyRef: ref,
    locale,
  });
  const whatsappUrl = buildWhatsAppUrl(whatsappDigits, whatsappMessage);

  // 2. Email Details
  const emailSubject = tAgent("emailSubject", { title, ref });
  const emailBody = tAgent("emailBody", { title, ref });
  const emailAddress = agent?.email || OFFICE_EMAIL;
  const emailUrl = `mailto:${emailAddress}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

  // 3. Languages Spoken
  const languageCodes: string[] =
    agent && Array.isArray(agent.languages) ? (agent.languages as string[]) : [];
  const languages = languageCodes
    .map((lang) =>
      KNOWN_LANGUAGES.has(lang)
        ? tAgent(`language.${lang}` as Parameters<typeof tAgent>[0])
        : lang.toUpperCase(),
    )
    .join(", ");

  // 4. Agent Photo
  const photoSrc =
    (agent?.photoOptimizedUrl && agent.photoOptimizedUrl.length > 0
      ? agent.photoOptimizedUrl
      : null) ??
    (agent?.photoUrl && agent.photoUrl.length > 0 ? agent.photoUrl : null) ??
    "/images/agent-placeholder.svg";

  // 5. WhatsApp Click Handler
  function handleWhatsAppClick() {
    if (agent) {
      trackWhatsAppClick({
        agentId: agent.id,
        propertyRef: ref,
        locale,
        source: "property_inquiry_sidebar",
        utmParams: extractUtmParams(),
      });
    }
  }

  // 6. Form Validation
  function validate() {
    const nextErrors: typeof errors = {};
    if (name.trim().length < 2) {
      nextErrors.name = t("nameError");
    }
    if (email.trim().length > 0 && !EMAIL_PATTERN.test(email.trim())) {
      nextErrors.email = t("emailError");
    }
    if (phone.replace(/\D/g, "").length < 7) {
      nextErrors.phone = t("phoneError");
    }
    if (message.trim().length < 10) {
      nextErrors.message = t("messageError");
    }
    return nextErrors;
  }

  // 7. Form Submission
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (honeypot.trim().length > 0) return; // Silently discard bot submission

    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      // Focus first invalid field
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

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim() || null,
          phone: phone.trim(),
          source: "contact_form",
          intent: "buy",
          propertyType: property.propertyType,
          shortlistPropertyIds: [property.id],
          notes: message.trim(),
          utm_source: utm.source ?? null,
          utm_medium: utm.medium ?? null,
          utm_campaign: utm.campaign ?? null,
          referrer: typeof document !== "undefined" ? document.referrer || null : null,
          preferredLanguage: locale,
          location: {
            text: property.areaSlug || "",
            lat: property.latitude,
            lng: property.longitude,
          },
          assignedAgentId: agent?.id || null,
        }),
      });

      if (response.ok || response.status === 409) {
        // Status 409 is "Already submitted" which we treat as success to avoid confusing client
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

  if (submitState === "success") {
    return (
      <div
        className="rounded-2xl border border-success-200 bg-emerald-50/20 p-8 shadow-md text-center space-y-6 animate-fade-in"
        data-testid="inquiry-success-container"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="h-10 w-10 animate-bounce" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-black text-slate-900">{t("successHeading")}</h3>
          <p className="text-slate-600 text-sm font-medium leading-relaxed">
            {agent ? t("successMessage", { agentName: agent.name }) : t("successOfficeMessage")}
          </p>
        </div>

        {/* Post-submit quick connect links */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <p className="text-xs font-bold text-slate-450 uppercase tracking-wider">{t("or")}</p>
          <div className="flex flex-col gap-2">
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleWhatsAppClick}
                className="flex items-center justify-center gap-2 rounded-xl bg-brand-whatsapp px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:opacity-90 transition-opacity"
              >
                <WhatsAppIcon className="h-5 w-5" />
                <span>
                  {t("whatsappCTA")} {agentName}
                </span>
              </a>
            )}
            <a
              href={emailUrl}
              className="flex items-center justify-center gap-2 rounded-xl bg-brand-navy px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:opacity-90 transition-opacity"
            >
              <Mail className="h-4 w-4" />
              <span>
                {t("emailCTA")} {agentName}
              </span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl border border-brand-warm bg-background p-6 shadow-md space-y-6 relative overflow-hidden"
      data-testid="agent-card"
    >
      {/* Decorative accent gradient */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-gold to-brand-navy" />

      {/* Agent details or Office Fallback */}
      <div className="flex items-start gap-4 pb-4 border-b border-brand-warm">
        <div className="relative shrink-0">
          <Image
            src={photoSrc}
            alt={tAgent("agentPhotoAlt", { name: agentName })}
            width={64}
            height={64}
            sizes="64px"
            className="rounded-full object-cover border border-brand-warm shadow-sm"
          />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[10px] uppercase font-extrabold tracking-wider text-brand-gold">
            {tAgent("contactAgent")}
          </span>
          <h3 className="text-base font-black text-brand-navy truncate leading-tight mt-0.5">
            {agentName}
          </h3>
          {languages && (
            <p className="text-xs text-text-muted mt-0.5 font-medium truncate">{languages}</p>
          )}
          <p className="text-[11px] text-text-muted font-bold mt-0.5 truncate uppercase">
            {officeName || "REMAX Altitud"}
          </p>
        </div>
      </div>

      {/* Direct Contact CTAs */}
      <div className="flex gap-2">
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleWhatsAppClick}
            data-testid="sidebar-whatsapp-cta"
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-brand-whatsapp py-2.5 text-xs font-bold text-white transition-opacity hover:opacity-90"
          >
            <WhatsAppIcon className="h-4 w-4" />
            <span>{t("whatsappCTA")}</span>
          </a>
        )}
        <a
          href={emailUrl}
          data-testid="sidebar-email-cta"
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-brand-navy py-2.5 text-xs font-bold text-white transition-opacity hover:opacity-90"
        >
          <Mail className="h-3.5 w-3.5" />
          <span>{t("emailCTA")}</span>
        </a>
      </div>

      {/* Form Section */}
      <form onSubmit={handleSubmit} noValidate className="space-y-4 pt-2">
        <h4 className="text-sm font-extrabold text-brand-navy tracking-tight">{t("title")}</h4>

        {/* Honeypot anti-spam input */}
        <input
          type="text"
          name="comp"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          className="sr-only"
        />

        {/* Name */}
        <div className="space-y-1">
          <label htmlFor="inquiry-name" className="text-xs font-bold text-brand-navy">
            {t("nameLabel")} <span className="text-red-500">*</span>
          </label>
          <input
            ref={nameRef}
            id="inquiry-name"
            type="text"
            required
            placeholder={t("namePlaceholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={submitting}
            className={`w-full h-10 rounded-lg border bg-white px-3 text-xs text-brand-navy placeholder:text-text-muted transition-colors focus:outline-none ${
              errors.name ? "border-red-500" : "border-brand-warm"
            }`}
          />
          {errors.name && <p className="text-[10px] text-red-500 font-semibold">{errors.name}</p>}
        </div>

        {/* Phone */}
        <div className="space-y-1">
          <label htmlFor="inquiry-phone" className="text-xs font-bold text-brand-navy">
            {t("phoneLabel")} <span className="text-red-500">*</span>
          </label>
          <input
            ref={phoneRef}
            id="inquiry-phone"
            type="tel"
            required
            placeholder={t("phonePlaceholder")}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={submitting}
            className={`w-full h-10 rounded-lg border bg-white px-3 text-xs text-brand-navy placeholder:text-text-muted transition-colors focus:outline-none ${
              errors.phone ? "border-red-500" : "border-brand-warm"
            }`}
          />
          {errors.phone && <p className="text-[10px] text-red-500 font-semibold">{errors.phone}</p>}
        </div>

        {/* Email */}
        <div className="space-y-1">
          <label htmlFor="inquiry-email" className="text-xs font-bold text-brand-navy">
            {t("emailLabel")}
          </label>
          <input
            ref={emailRef}
            id="inquiry-email"
            type="email"
            placeholder={t("emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
            className={`w-full h-10 rounded-lg border bg-white px-3 text-xs text-brand-navy placeholder:text-text-muted transition-colors focus:outline-none ${
              errors.email ? "border-red-500" : "border-brand-warm"
            }`}
          />
          {errors.email && <p className="text-[10px] text-red-500 font-semibold">{errors.email}</p>}
        </div>

        {/* Message */}
        <div className="space-y-1">
          <label htmlFor="inquiry-message" className="text-xs font-bold text-brand-navy">
            {t("messageLabel")} <span className="text-red-500">*</span>
          </label>
          <textarea
            ref={messageRef}
            id="inquiry-message"
            required
            placeholder={t("messagePlaceholder")}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={submitting}
            rows={3}
            className={`w-full rounded-lg border bg-white p-3 text-xs text-brand-navy placeholder:text-text-muted transition-colors focus:outline-none resize-none ${
              errors.message ? "border-red-500" : "border-brand-warm"
            }`}
          />
          {errors.message && (
            <p className="text-[10px] text-red-500 font-semibold">{errors.message}</p>
          )}
        </div>

        {/* Transparency note */}
        <p className="text-[10px] leading-tight text-text-muted flex gap-1 bg-slate-50 p-2 rounded-lg font-medium">
          <Info className="h-3 w-3 shrink-0 text-brand-gold mt-0.5" />
          <span>{t("transparencyNote")}</span>
        </p>

        {submitState === "error" && (
          <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50/50 p-3 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            <div>
              <span className="font-bold">{t("errorHeading")}</span>
              <p className="mt-0.5">{t("errorMessage")}</p>
            </div>
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full h-11 bg-brand-gold hover:bg-brand-gold/90 text-brand-navy font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{t("submitting")}</span>
            </>
          ) : (
            <span>{t("submit")}</span>
          )}
        </button>
      </form>
    </div>
  );
}
