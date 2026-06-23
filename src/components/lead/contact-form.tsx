"use client";

// Done (Epic 5 / Story 5-3): replaced mailto: with POST /api/leads.
// Form submission is intentionally isolated in a single client-side function
// so the full lead pipeline can swap the implementation without touching markup.

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";

const TOAST_DISMISS_MS = 5000;

function useToastAutoDismiss(
  toast: "success" | "error" | null,
  setToast: (kind: "success" | "error" | null) => void,
) {
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), TOAST_DISMISS_MS);
    return () => window.clearTimeout(id);
  }, [toast, setToast]);
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ContactErrors = Partial<Record<"name" | "email" | "phone" | "message" | "form", string>>;

type ToastKind = "success" | "error" | null;

interface SharedFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: (id: string, describedBy: string | undefined) => React.ReactNode;
}

function Field({ label, error, required, children }: SharedFieldProps) {
  const reactId = useId();
  const id = `field-${reactId}`;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-brand-navy">
        {label}
        {required ? (
          <span aria-hidden className="ml-0.5 text-accent">
            *
          </span>
        ) : null}
      </label>
      {children(id, errorId)}
      {error ? (
        <span id={errorId} role="alert" className="text-sm text-accent">
          {error}
        </span>
      ) : null}
    </div>
  );
}

function inputClassName(hasError: boolean): string {
  return [
    "h-11 rounded-md border bg-white px-3 text-brand-navy shadow-sm",
    "placeholder:text-text-muted",
    hasError ? "border-accent" : "border-brand-warm",
    "focus:outline-none",
  ].join(" ");
}

function textareaClassName(hasError: boolean): string {
  return [
    "min-h-[120px] rounded-md border bg-white p-3 text-brand-navy shadow-sm",
    "placeholder:text-text-muted",
    hasError ? "border-accent" : "border-brand-warm",
    "focus:outline-none",
  ].join(" ");
}

function selectClassName(hasError: boolean): string {
  return [
    "h-11 rounded-md border bg-white px-3 text-brand-navy shadow-sm",
    hasError ? "border-accent" : "border-brand-warm",
    "focus:outline-none",
  ].join(" ");
}

// -----------------------------
// ContactForm (public contact page)
// -----------------------------

export function ContactForm() {
  const t = useTranslations("ContactPage.form");
  const locale = useLocale();

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [office, setOffice] = useState("any");
  const [language, setLanguage] = useState<"en" | "es" | "other">(locale === "es" ? "es" : "en");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");

  const [errors, setErrors] = useState<ContactErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastKind>(null);
  useToastAutoDismiss(toast, setToast);

  function validate(): ContactErrors {
    const next: ContactErrors = {};
    if (name.trim().length < 2) next.name = t("nameError");
    if (!EMAIL_PATTERN.test(email.trim())) next.email = t("emailError");
    if (message.trim().length < 10) next.message = t("messageError");
    return next;
  }

  function resetForm() {
    setName("");
    setEmail("");
    setPhone("");
    setOffice("any");
    setLanguage(locale === "es" ? "es" : "en");
    setMessage("");
  }

  function focusFirstInvalid(nextErrors: ContactErrors) {
    if (nextErrors.name) {
      nameRef.current?.focus();
      return;
    }
    if (nextErrors.email) {
      emailRef.current?.focus();
      return;
    }
    if (nextErrors.message) {
      messageRef.current?.focus();
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (honeypot.trim().length > 0) return;

    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      focusFirstInvalid(nextErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    setToast(null);

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || "0000000",
          source: "contact_form" as const,
          intent: "buy" as const,
          preferredLanguage: language,
          notes: [`Office: ${office}`, message.trim()].filter(Boolean).join(" | "),
          referrer: typeof document !== "undefined" ? document.referrer || null : null,
        }),
      });

      if (response.ok || response.status === 409) {
        setToast("success");
        resetForm();
      } else {
        setToast("error");
      }
    } catch {
      setToast("error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="mx-auto w-full max-w-2xl">
      {toast === "success" ? (
        <div
          role="status"
          aria-live="polite"
          className="mb-4 rounded-md border border-success/30 bg-success/10 p-3 text-sm text-success"
        >
          {t("successToast")}
        </div>
      ) : null}
      {toast === "error" ? (
        <div
          role="alert"
          aria-live="assertive"
          className="mb-4 rounded-md border border-accent/30 bg-accent/10 p-3 text-sm text-accent"
        >
          {t("errorToast")}
        </div>
      ) : null}

      {/* Honeypot — sr-only + tabIndex=-1 keep humans from reaching it.
          Do not add aria-hidden here: aria-hidden on a focusable form
          control trips axe's aria-hidden-focus rule. aria-label gives
          the input a programmatic name so axe's label rule passes. */}
      <input
        type="text"
        name="_hp_field"
        tabIndex={-1}
        autoComplete="off"
        data-1p-ignore
        data-lpignore="true"
        aria-label="Leave this field empty"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        className="sr-only"
      />

      <div className="flex flex-col gap-4">
        <Field label={t("nameLabel")} error={errors.name} required>
          {(id, describedBy) => (
            <input
              ref={nameRef}
              id={id}
              name="name"
              type="text"
              autoComplete="name"
              required
              aria-required="true"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={describedBy}
              placeholder={t("namePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClassName(Boolean(errors.name))}
            />
          )}
        </Field>

        <Field label={t("emailLabel")} error={errors.email} required>
          {(id, describedBy) => (
            <input
              ref={emailRef}
              id={id}
              name="email"
              type="email"
              autoComplete="email"
              required
              aria-required="true"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={describedBy}
              placeholder={t("emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClassName(Boolean(errors.email))}
            />
          )}
        </Field>

        <Field label={t("phoneLabel")}>
          {(id) => (
            <input
              id={id}
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder={t("phonePlaceholder")}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClassName(false)}
            />
          )}
        </Field>

        <Field label={t("officeLabel")}>
          {(id) => (
            <select
              id={id}
              name="office"
              value={office}
              onChange={(e) => setOffice(e.target.value)}
              className={selectClassName(false)}
            >
              <option value="any">{t("officeOptionAny")}</option>
              <option value="pz">{t("officeOptionPZ")}</option>
              <option value="dom">{t("officeOptionDOM")}</option>
            </select>
          )}
        </Field>

        <Field label={t("languageLabel")}>
          {(id) => (
            <select
              id={id}
              name="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value as "en" | "es" | "other")}
              className={selectClassName(false)}
            >
              <option value="en">{t("languageOptionEN")}</option>
              <option value="es">{t("languageOptionES")}</option>
              <option value="other">{t("languageOptionOther")}</option>
            </select>
          )}
        </Field>

        <Field label={t("messageLabel")} error={errors.message} required>
          {(id, describedBy) => (
            <textarea
              ref={messageRef}
              id={id}
              name="message"
              required
              aria-required="true"
              aria-invalid={Boolean(errors.message)}
              aria-describedby={describedBy}
              placeholder={t("messagePlaceholder")}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className={textareaClassName(Boolean(errors.message))}
            />
          )}
        </Field>

        <button
          type="submit"
          disabled={submitting}
          aria-busy={submitting}
          className="inline-flex h-11 items-center justify-center rounded-md bg-brand-gold px-6 font-semibold text-brand-navy shadow-[var(--shadow-cta)] transition-colors duration-[var(--duration-fast)] hover:bg-brand-gold/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? t("submitting") : t("submit")}
        </button>
      </div>
    </form>
  );
}

// -----------------------------
// RecruitmentForm (Join Our Team page)
// -----------------------------

type RecruitErrors = Partial<Record<"name" | "email" | "phone" | "form", string>>;

export function RecruitmentForm() {
  const t = useTranslations("JoinPage.form");

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [languages, setLanguages] = useState("");
  const [area, setArea] = useState("either");
  const [hasCar, setHasCar] = useState("yes");
  const [time, setTime] = useState("");
  const [financial, setFinancial] = useState("");
  const [salesExperience, setSalesExperience] = useState("");
  const [commissionOnly, setCommissionOnly] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");

  const [errors, setErrors] = useState<RecruitErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastKind>(null);
  useToastAutoDismiss(toast, setToast);

  function validate(): RecruitErrors {
    const next: RecruitErrors = {};
    if (name.trim().length < 2) next.name = t("nameError");
    if (!EMAIL_PATTERN.test(email.trim())) next.email = t("emailError");
    if (phone.replace(/\D/g, "").length < 7) next.phone = t("phoneError");
    return next;
  }

  function focusFirstInvalid(nextErrors: RecruitErrors) {
    if (nextErrors.name) {
      nameRef.current?.focus();
      return;
    }
    if (nextErrors.email) {
      emailRef.current?.focus();
      return;
    }
    if (nextErrors.phone) {
      phoneRef.current?.focus();
    }
  }

  function resetForm() {
    setName("");
    setEmail("");
    setPhone("");
    setLanguages("");
    setArea("either");
    setHasCar("yes");
    setTime("");
    setFinancial("");
    setSalesExperience("");
    setCommissionOnly("");
    setMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (honeypot.trim().length > 0) return;

    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      focusFirstInvalid(nextErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    setToast(null);

    const noteParts = [
      languages ? `Languages: ${languages}` : null,
      `Area: ${area}`,
      `Has vehicle: ${hasCar === "yes" ? "Yes" : "No"}`,
      time ? `Time availability: ${time}` : null,
      financial ? `Financial: ${financial}` : null,
      salesExperience ? `Experience: ${salesExperience}` : null,
      commissionOnly ? `Commission outlook: ${commissionOnly}` : null,
      message ? `Message: ${message}` : null,
    ]
      .filter(Boolean)
      .join(" | ");

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          source: "contact_form" as const,
          intent: "recruit" as const,
          notes: noteParts,
          referrer: typeof document !== "undefined" ? document.referrer || null : null,
        }),
      });

      if (response.ok || response.status === 409) {
        setToast("success");
        resetForm();
      } else {
        setToast("error");
      }
    } catch {
      setToast("error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="mx-auto w-full max-w-2xl">
      {toast === "success" ? (
        <div
          role="status"
          aria-live="polite"
          className="mb-4 rounded-md border border-success/30 bg-success/10 p-3 text-sm text-success"
        >
          {t("successToast")}
        </div>
      ) : null}
      {toast === "error" ? (
        <div
          role="alert"
          aria-live="assertive"
          className="mb-4 rounded-md border border-accent/30 bg-accent/10 p-3 text-sm text-accent"
        >
          {t("errorToast")}
        </div>
      ) : null}

      {/* Honeypot — see ContactForm for rationale (no aria-hidden). */}
      <input
        type="text"
        name="_hp_field"
        tabIndex={-1}
        autoComplete="off"
        data-1p-ignore
        data-lpignore="true"
        aria-label="Leave this field empty"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        className="sr-only"
      />

      <div className="flex flex-col gap-4">
        <Field label={t("nameLabel")} error={errors.name} required>
          {(id, describedBy) => (
            <input
              ref={nameRef}
              id={id}
              name="name"
              type="text"
              autoComplete="name"
              required
              aria-required="true"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={describedBy}
              placeholder={t("namePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClassName(Boolean(errors.name))}
            />
          )}
        </Field>

        <Field label={t("emailLabel")} error={errors.email} required>
          {(id, describedBy) => (
            <input
              ref={emailRef}
              id={id}
              name="email"
              type="email"
              autoComplete="email"
              required
              aria-required="true"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={describedBy}
              placeholder={t("emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClassName(Boolean(errors.email))}
            />
          )}
        </Field>

        <Field label={t("phoneLabel")} error={errors.phone} required>
          {(id, describedBy) => (
            <input
              ref={phoneRef}
              id={id}
              name="phone"
              type="tel"
              autoComplete="tel"
              required
              aria-required="true"
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={describedBy}
              placeholder={t("phonePlaceholder")}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClassName(Boolean(errors.phone))}
            />
          )}
        </Field>

        <Field label={t("languagesLabel")}>
          {(id) => (
            <textarea
              id={id}
              name="languages"
              placeholder={t("languagesPlaceholder")}
              value={languages}
              onChange={(e) => setLanguages(e.target.value)}
              className={textareaClassName(false)}
            />
          )}
        </Field>

        <Field label={t("areaLabel")}>
          {(id) => (
            <select
              id={id}
              name="area"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className={selectClassName(false)}
            >
              <option value="pz">{t("areaOptionPZ")}</option>
              <option value="dom">{t("areaOptionDOM")}</option>
              <option value="either">{t("areaOptionEither")}</option>
            </select>
          )}
        </Field>

        <Field label={t("carLabel")}>
          {(id) => (
            <select
              id={id}
              name="car"
              value={hasCar}
              onChange={(e) => setHasCar(e.target.value)}
              className={selectClassName(false)}
            >
              <option value="yes">{t("carOptionYes")}</option>
              <option value="no">{t("carOptionNo")}</option>
            </select>
          )}
        </Field>

        <Field label={t("timeLabel")}>
          {(id) => (
            <input
              id={id}
              name="time"
              type="text"
              placeholder={t("timePlaceholder")}
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className={inputClassName(false)}
            />
          )}
        </Field>

        <Field label={t("financialLabel")}>
          {(id) => (
            <textarea
              id={id}
              name="financial"
              placeholder={t("financialPlaceholder")}
              value={financial}
              onChange={(e) => setFinancial(e.target.value)}
              className={textareaClassName(false)}
            />
          )}
        </Field>

        <Field label={t("experienceLabel")}>
          {(id) => (
            <textarea
              id={id}
              name="experience"
              placeholder={t("experiencePlaceholder")}
              value={salesExperience}
              onChange={(e) => setSalesExperience(e.target.value)}
              className={textareaClassName(false)}
            />
          )}
        </Field>

        <Field label={t("commissionLabel")}>
          {(id) => (
            <textarea
              id={id}
              name="commission"
              placeholder={t("commissionPlaceholder")}
              value={commissionOnly}
              onChange={(e) => setCommissionOnly(e.target.value)}
              className={textareaClassName(false)}
            />
          )}
        </Field>

        <Field label={t("messageLabel")}>
          {(id) => (
            <textarea
              id={id}
              name="message"
              placeholder={t("messagePlaceholder")}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className={textareaClassName(false)}
            />
          )}
        </Field>

        <button
          type="submit"
          disabled={submitting}
          aria-busy={submitting}
          className="inline-flex h-11 items-center justify-center rounded-md bg-brand-gold px-6 font-semibold text-brand-navy shadow-[var(--shadow-cta)] transition-colors duration-[var(--duration-fast)] hover:bg-brand-gold/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? t("submitting") : t("submit")}
        </button>
      </div>
    </form>
  );
}
