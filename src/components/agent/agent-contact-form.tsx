"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";

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

interface AgentContactFormProps {
  agentId: string;
  agentEmail: string | null;
  agentName: string;
  onClose?: () => void;
  variant?: "inline" | "modal";
}

export function AgentContactForm({
  agentId,
  agentEmail: _agentEmail,
  agentName,
  onClose,
  variant = "inline",
}: AgentContactFormProps) {
  // Using the ContactPage.form translations as a base
  const t = useTranslations("ContactPage.form");
  const tProfile = useTranslations("AgentProfile");

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
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
    setToast(null);

    if (honeypot.trim().length > 0) return;

    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      focusFirstInvalid(nextErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || "0000000",
          source: "agent_contact" as const,
          intent: "buy" as const,
          assignedAgentId: agentId,
          notes: message.trim(),
          referrer: typeof document !== "undefined" ? document.referrer || null : null,
        }),
      });

      if (response.ok || response.status === 409) {
        setToast("success");
        resetForm();
        if (onClose) {
          setTimeout(() => onClose(), 2000);
        }
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
    <form
      noValidate
      onSubmit={handleSubmit}
      className={
        variant === "modal"
          ? "w-full space-y-5"
          : "mx-auto mt-8 w-full max-w-2xl rounded-xl border border-brand-warm bg-brand-light p-6 shadow-sm sm:p-8"
      }
    >
      {variant !== "modal" && (
        <h2 className="mb-6 text-xl font-bold text-brand-navy">
          {tProfile("contactAgent", { name: agentName }) || `Contact ${agentName}`}
        </h2>
      )}

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
          className="mt-2 inline-flex h-11 items-center justify-center rounded-md bg-brand-gold px-6 font-semibold text-brand-navy shadow-[var(--shadow-cta)] transition-colors duration-[var(--duration-fast)] hover:bg-brand-gold/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? t("submitting") : t("submit")}
        </button>
      </div>
    </form>
  );
}
