/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useShortlist } from "@/hooks/use-shortlist";
import {
  getShortlistPropertiesWithAgents,
} from "@/app/actions/shortlist-actions";
import { PropertyCard } from "@/components/property/property-card";
import { PropertyCardSkeleton } from "@/components/property/property-card-skeleton";
import { MapView } from "@/components/map/map-view-loader";
import { ModalShimmer } from "@/components/shortlist/modal-shimmer";

const AgentSelectionModal = dynamic(() => import("@/components/shortlist/agent-selection-modal"), {
  ssr: false,
  loading: () => <ModalShimmer />,
});

export function ShortlistPageClient() {
  const t = useTranslations("Shortlist");
  const tRouting = useTranslations("ShortlistRouting");
  const locale = useLocale();
  const { shortlist, remove, isLoaded } = useShortlist();

  const [properties, setProperties] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fetchedShortlistRef = useRef<string[]>([]);

  const [showContactForm, setShowContactForm] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    if (!isLoaded) return;

    const prev = fetchedShortlistRef.current;

    // Check if shortlist is identical to prev
    const isSame =
      shortlist.length === prev.length &&
      [...shortlist].sort().every((id, idx) => id === [...prev].sort()[idx]);

    if (isSame) return;

    // Check if this was a simple removal (shortlist is a subset of prev)
    const isSubset = shortlist.every((id) => prev.includes(id));

    if (isSubset && prev.length > 0) {
      fetchedShortlistRef.current = shortlist;
      setProperties((prevProps) => prevProps.filter((p) => shortlist.includes(p.id)));
      return;
    }

    fetchedShortlistRef.current = shortlist;

    if (shortlist.length === 0) {
      setProperties([]);
      return;
    }

    getShortlistPropertiesWithAgents(shortlist)
      .then((data) => {
        setProperties(data);
      })
      .catch((err) => {
        console.error("Error fetching shortlist properties with agents:", err);
      });
  }, [shortlist, isLoaded]);

  // Compute properties grouped by listing agent (null represents the office)
  const agentGroups = (() => {
    const groupsMap = new Map<string | "office", { agent: any | null; properties: any[] }>();

    for (const p of properties) {
      const key = p.agent?.id || "office";
      if (!groupsMap.has(key)) {
        groupsMap.set(key, {
          agent: p.agent || null,
          properties: [],
        });
      }
      groupsMap.get(key)!.properties.push(p);
    }

    return Array.from(groupsMap.values());
  })();

  const handleRemove = (id: string) => {
    remove(id);
    setProperties((prev) => prev.filter((p) => p.id !== id));
  };

  const handleContactAgent = async (agent: any | null, agentProperties: any[], channel: "whatsapp" | "email") => {
    const isOffice = !agent;
    const agentName = isOffice ? "RE/MAX Altitud" : agent.name;
    const agentEmail = isOffice ? "info@remax-altitud.cr" : agent.email;
    const agentWhatsapp = isOffice ? "50688888888" : agent.whatsapp;

    const intro = isOffice
      ? t("whatsAppMessageHeader")
      : tRouting("whatsappMessageIntro", { agentName });
    const outro = isOffice ? "" : tRouting("whatsappMessageOutro");
    const propertyLines = agentProperties
      .map((p) => {
        const title = locale === "es" ? p.titleEs || p.titleEn : p.titleEn;
        return isOffice ? `- ${title} (${p.id})` : `- ${title} (Ref: ${p.apiId})`;
      })
      .join("\n");

    const fullMessage = isOffice ? `${intro}\n${propertyLines}` : `${intro}\n${propertyLines}\n${outro}`;

    // Lead Capture POST request
    fetch("/api/leads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Shortlist Lead",
        phone: "+50600000000",
        email: "",
        intent: "buy",
        source: channel === "whatsapp" ? "whatsapp_click" : "contact_form",
        assignedAgentId: isOffice ? null : agent.id,
        shortlistPropertyIds: agentProperties.map((p) => p.id),
        location: { text: "", lat: null, lng: null },
      }),
    }).catch((err) => {
      console.error("Lead capture failed in background:", err);
    });

    if (channel === "whatsapp") {
      const cleanWhatsApp = (agentWhatsapp || "").replace(/\D/g, "");
      const whatsappUrl = `https://wa.me/${cleanWhatsApp}?text=${encodeURIComponent(fullMessage)}`;
      window.open(whatsappUrl, "_blank");
    } else {
      const propertyLinesWithLinks = agentProperties
        .map((p) => {
          const title = locale === "es" ? p.titleEs || p.titleEn : p.titleEn;
          const link = `${window.location.origin}/${locale}/property/${p.slug}`;
          return `- ${title} (Ref: ${p.apiId}) - ${link}`;
        })
        .join("\n");

      const subject = tRouting("emailSubject");
      const body = tRouting("emailBody", { agentName, list: propertyLinesWithLinks });
      const mailtoUrl = `mailto:${agentEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(mailtoUrl, "_blank");
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    const PHONE_RE = /^\+?[\d\s\-()]+$/;
    const phoneHasEnoughDigits = (v: string) => v.replace(/\D/g, "").length >= 7;

    if (!formName.trim()) {
      errors.name = t("nameError");
    }
    if (!formEmail.trim()) {
      errors.email = t("emailError");
    } else if (!EMAIL_RE.test(formEmail)) {
      errors.email = t("emailError");
    }
    if (!formPhone.trim()) {
      errors.phone = t("phoneError");
    } else if (!PHONE_RE.test(formPhone) || !phoneHasEnoughDigits(formPhone)) {
      errors.phone = t("phoneError");
    }
    return errors;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setFormSubmitting(true);

    try {
      let shareUrl = "";
      try {
        const response = await fetch("/api/shortlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ propertyIds: shortlist, locale }),
        });
        if (response.ok) {
          const data = await response.json();
          shareUrl = data.shareUrl;
        }
      } catch (err) {
        console.error("Failed to generate shortlist share url on form submit:", err);
      }

      if (!shareUrl) {
        const header = t("shareMessageHeader");
        shareUrl = `${header}\n${properties
          .map((p) => `${window.location.origin}/${locale}/property/${p.slug}`)
          .join("\n")}`;
      }

      // Parallel submission of split inquiries for each agent group
      const leadPromises = agentGroups.map(async (group) => {
        const recipientAgentId = group.agent?.id || null;
        const groupPropertyIds = group.properties.map((p) => p.id);

        const apiPayload = {
          name: formName,
          phone: formPhone,
          email: formEmail,
          intent: "buy" as const,
          source: "contact_form" as const,
          assignedAgentId: recipientAgentId,
          shortlistPropertyIds: groupPropertyIds,
          notes: `${formMessage.trim() ? formMessage.trim() + " | " : ""}Shortlist Link: ${shareUrl}`,
          location: { text: "", lat: null, lng: null },
        };

        const leadResponse = await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(apiPayload),
        });

        if (!leadResponse.ok && leadResponse.status !== 409) {
          throw new Error(`Lead submission failed for agent ${recipientAgentId}`);
        }
      });

      await Promise.all(leadPromises);
      setFormSubmitted(true);
    } catch (err) {
      console.error("Form submission failed:", err);
      alert(t("formSubmitError"));
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleAskAgent = async () => {
    if (agentGroups.length === 0) {
      // Fallback office WhatsApp message
      const header = t("whatsAppMessageHeader");
      const message = `${header}\n${properties
        .map((p) => {
          const title = locale === "es" ? p.titleEs || p.titleEn : p.titleEn;
          return `- ${title} (${p.id})`;
        })
        .join("\n")}`;
      const whatsappUrl = `https://wa.me/50688888888?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, "_blank");
      return;
    }

    if (agentGroups.length === 1) {
      await handleContactAgent(agentGroups[0].agent, agentGroups[0].properties, "whatsapp");
    } else {
      setIsModalOpen(true);
    }
  };

  const handleShareShortlist = () => {
    const header = t("shareMessageHeader");
    const fallbackText = `${header}\n${properties
      .map((p) => `${window.location.origin}/${locale}/property/${p.slug}`)
      .join("\n")}`;

    try {
      if (typeof fetch === "undefined" || process.env.NODE_ENV === "test" || process.env.VITEST) {
        throw new Error("Test environment fallback");
      }

      fetch("/api/shortlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          propertyIds: shortlist,
          locale,
        }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to generate share link");
          }
          return response.json();
        })
        .then((data) => {
          if (!data.shareUrl) {
            throw new Error("Invalid response");
          }

          if (typeof navigator !== "undefined" && navigator.clipboard) {
            navigator.clipboard
              .writeText(data.shareUrl)
              .then(() => {
                setCopied(true);
                setToastMessage(t("shareCopied"));
              })
              .catch((err) => {
                console.error("Failed to copy share link:", err);
                navigator.clipboard
                  .writeText(fallbackText)
                  .then(() => {
                    setCopied(true);
                    setToastMessage(t("shareError"));
                  })
                  .catch((fallbackErr) => {
                    console.error("Fallback clipboard write also failed:", fallbackErr);
                    setToastMessage(t("shareError"));
                  });
              });
          }
        })
        .catch((err) => {
          console.error("Failed to generate share link, falling back to legacy links:", err);
          if (typeof navigator !== "undefined" && navigator.clipboard) {
            navigator.clipboard
              .writeText(fallbackText)
              .then(() => {
                setCopied(true);
                setToastMessage(t("shareError"));
              })
              .catch((fallbackErr) => {
                console.error("Fallback clipboard write failed during API error:", fallbackErr);
                setToastMessage(t("shareError"));
              });
          }
        });
    } catch (err) {
      console.error("Error in outer share click handler:", err);
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        navigator.clipboard
          .writeText(fallbackText)
          .then(() => {
            setCopied(true);
          })
          .catch((fallbackErr) => {
            console.error("Fallback clipboard write failed in outer catch:", fallbackErr);
            alert(fallbackText);
          });
      } else {
        alert(fallbackText);
      }
    }
  };

  // Loading / hydration mismatch prevention
  if (!isLoaded) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-brand-navy">{t("title")}</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PropertyCardSkeleton />
          <PropertyCardSkeleton />
          <PropertyCardSkeleton />
        </div>
      </div>
    );
  }

  // Empty state
  if (properties.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-lg">
        <h1 className="text-3xl font-bold mb-4 text-brand-navy">{t("title")}</h1>
        <p className="text-muted-foreground mb-8">{t("emptyState")}</p>
        <Link
          href={`/${locale}/search`}
          className="inline-flex h-11 items-center justify-center rounded-md bg-brand-navy hover:bg-brand-navy/90 text-white font-semibold px-8 shadow-md transition-colors"
        >
          {t("browseCta")}
        </Link>
      </div>
    );
  }

  // Filter out any properties that have null coordinates to prevent Mapbox/Supercluster runtime crashes.
  const mapProperties = properties.filter(
    (p): p is typeof p & { latitude: number; longitude: number } =>
      p.latitude !== null && p.longitude !== null,
  );

  // Comparison grid + interactive map
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 border-b pb-4 border-slate-100">
        <h1 className="text-3xl font-bold text-brand-navy">{t("title")}</h1>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/${locale}/search`}
            className="inline-flex h-11 items-center justify-center rounded-md bg-white border border-brand-navy/30 text-brand-navy hover:bg-brand-navy/5 font-semibold px-5 transition-colors shadow-xs"
          >
            {t("addMoreProperties")}
          </Link>
          <button
            onClick={handleShareShortlist}
            className="inline-flex h-11 items-center justify-center rounded-md bg-brand-navy hover:bg-brand-navy/90 text-white font-semibold px-5 shadow-md transition-colors relative min-w-[150px]"
          >
            {copied ? (locale === "es" ? "¡Copiado!" : "Copied!") : t("shareShortlistCta")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Property list and Actions */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {properties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                locale={locale}
                onRemove={handleRemove}
              />
            ))}
          </div>

          {/* Shortlist Contact Form */}
          {showContactForm && !formSubmitted && (
            <div
              id="shortlist-contact-form"
              className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 md:p-8 mt-4 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300"
            >
              <h2 className="text-xl font-bold text-brand-navy mb-1">{t("contactFormHeading")}</h2>
              <p className="text-sm text-muted-foreground mb-6">{t("contactFormSubheading")}</p>

              {formErrors.form && (
                <div className="mb-4 text-sm font-semibold text-red-600 bg-red-50 border border-red-100 p-3 rounded-lg">
                  {formErrors.form}
                </div>
              )}

              <form onSubmit={handleFormSubmit} noValidate className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="form-name" className="text-sm font-semibold text-brand-navy">
                    {t("nameLabel")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="form-name"
                    type="text"
                    required
                    placeholder={t("namePlaceholder")}
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className={`h-11 rounded-md border bg-white px-3 text-brand-navy shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-navy ${
                      formErrors.name ? "border-red-500 focus:ring-red-500" : "border-slate-300"
                    }`}
                  />
                  {formErrors.name && (
                    <span role="alert" className="text-xs text-red-600 mt-0.5">
                      {formErrors.name}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="form-email" className="text-sm font-semibold text-brand-navy">
                      {t("emailLabel")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="form-email"
                      type="email"
                      required
                      placeholder={t("emailPlaceholder")}
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      className={`h-11 rounded-md border bg-white px-3 text-brand-navy shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-navy ${
                        formErrors.email ? "border-red-500 focus:ring-red-500" : "border-slate-300"
                      }`}
                    />
                    {formErrors.email && (
                      <span role="alert" className="text-xs text-red-600 mt-0.5">
                        {formErrors.email}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="form-phone" className="text-sm font-semibold text-brand-navy">
                      {t("phoneLabel")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="form-phone"
                      type="tel"
                      required
                      placeholder={t("phonePlaceholder")}
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      className={`h-11 rounded-md border bg-white px-3 text-brand-navy shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-navy ${
                        formErrors.phone ? "border-red-500 focus:ring-red-500" : "border-slate-300"
                      }`}
                    />
                    {formErrors.phone && (
                      <span role="alert" className="text-xs text-red-600 mt-0.5">
                        {formErrors.phone}
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-slate-100/60 border border-slate-200/50 p-4 rounded-xl text-xs text-slate-600 flex items-start gap-2.5 leading-relaxed">
                  <span className="text-base leading-none">ℹ️</span>
                  <div>
                    <span className="font-semibold text-slate-800">
                      {locale === "es" ? "Enrutamiento inteligente directo: " : "Direct agent routing: "}
                    </span>
                    {t("contactFormSubheading")}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="form-message" className="text-sm font-semibold text-brand-navy">
                    {t("messageLabel")}
                  </label>
                  <textarea
                    id="form-message"
                    rows={4}
                    placeholder={t("messagePlaceholder")}
                    value={formMessage}
                    onChange={(e) => setFormMessage(e.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white p-3 text-brand-navy shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-navy resize-none"
                  />
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="flex-1 inline-flex h-11 items-center justify-center rounded-md bg-brand-navy hover:bg-brand-navy/90 text-white font-semibold px-6 shadow-md transition-colors disabled:opacity-60"
                  >
                    {formSubmitting ? t("submittingForm") : t("submitForm")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowContactForm(false)}
                    className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold px-6 transition-colors"
                  >
                    {locale === "es" ? "Cancelar" : "Cancel"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Shortlist Success Screen */}
          {formSubmitted && (
            <div className="bg-slate-50 border border-emerald-200 rounded-2xl p-6 md:p-8 mt-4 shadow-sm text-center animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200 shadow-xs">
                <svg
                  className="w-8 h-8 text-emerald-600"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                  ></path>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">{t("successHeading")}</h2>
              <p className="text-sm text-slate-600 max-w-md mx-auto mb-8">{t("successText")}</p>

              {/* Grid of notified agents & direct contact fallbacks */}
              <div className="space-y-4 max-w-lg mx-auto text-left mb-8">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center mb-2">
                  {locale === "es" ? "Agentes Notificados" : "Listing Agents Notified"}
                </p>
                {agentGroups.map((group) => {
                  const { agent, properties: groupProps } = group;
                  const isOffice = !agent;
                  const key = isOffice ? "office" : agent.id;
                  const photoSrc = isOffice
                    ? "/images/agent-placeholder.jpg"
                    : agent.photoOptimizedUrl || agent.photoUrl || "/images/agent-placeholder.jpg";
                  const agentName = isOffice ? "RE/MAX Altitud" : agent.name;
                  const languages = isOffice ? "" : agent.languages;

                  return (
                    <div
                      key={key}
                      className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs"
                    >
                      <div className="flex gap-4 items-center">
                        <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-200 bg-slate-100 flex-shrink-0">
                          <img
                            src={photoSrc}
                            alt={agentName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-slate-900 text-sm leading-snug">
                            {agentName}
                          </h3>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {isOffice
                              ? (locale === "es" ? "Oficina Central" : "Central Office")
                              : `${tRouting("languages")} ${languages}`}
                          </p>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                            {locale === "es"
                              ? `Asignado para ${groupProps.length} ${groupProps.length === 1 ? "propiedad" : "propiedades"}`
                              : `Assigned for ${groupProps.length} ${groupProps.length === 1 ? "property" : "properties"}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 mt-4">
                        <button
                          onClick={() => handleContactAgent(agent, groupProps, "whatsapp")}
                          className="flex-1 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 shadow-sm transition-colors"
                        >
                          WhatsApp
                        </button>
                        <button
                          onClick={() => handleContactAgent(agent, groupProps, "email")}
                          className="flex-1 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs px-4 transition-colors"
                        >
                          {tRouting("contactEmail")}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => {
                  setFormSubmitted(false);
                  setFormName("");
                  setFormEmail("");
                  setFormPhone("");
                  setFormMessage("");
                  setShowContactForm(false);
                }}
                className="inline-flex h-10 items-center justify-center rounded-md bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm px-6 shadow-sm transition-colors"
              >
                {t("backToShortlist")}
              </button>
            </div>
          )}

          {/* Action buttons (Ask Agent + optional Contact Form toggle) */}
          {!showContactForm && !formSubmitted && (
            <div className="flex flex-col sm:flex-row gap-4 mt-6 border-t pt-6 border-border">
              <button
                onClick={handleAskAgent}
                className="flex-1 inline-flex h-11 items-center justify-center rounded-md bg-brand-navy hover:bg-brand-navy/90 text-white font-semibold px-6 shadow-md transition-colors"
              >
                {t("askAgentCta")}
              </button>
              <button
                onClick={() => {
                  setShowContactForm(true);
                  setTimeout(() => {
                    const formEl = document.getElementById("shortlist-contact-form");
                    if (formEl && typeof formEl.scrollIntoView === "function") {
                      formEl.scrollIntoView({ behavior: "smooth", block: "start" });
                    }
                  }, 100);
                }}
                className="flex-1 inline-flex h-11 items-center justify-center rounded-md bg-white border border-brand-navy text-brand-navy hover:bg-brand-navy/5 font-semibold px-6 transition-colors"
              >
                {locale === "es" ? "Contactar por Formulario" : "Contact via Form"}
              </button>
            </div>
          )}
        </div>

        {/* Right Side: Mini-map showing saved property locations */}
        <div className="lg:col-span-5 h-[350px] lg:h-[600px] sticky top-24 rounded-xl overflow-hidden shadow-md border border-border">
          <MapView properties={mapProperties} locale={locale} />
        </div>
      </div>

      {isModalOpen && (
        <AgentSelectionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          agentGroups={agentGroups}
          onContactAgent={handleContactAgent}
          onOpenContactForm={() => {
            setShowContactForm(true);
            setTimeout(() => {
              const formEl = document.getElementById("shortlist-contact-form");
              if (formEl && typeof formEl.scrollIntoView === "function") {
                formEl.scrollIntoView({ behavior: "smooth", block: "start" });
              }
            }, 100);
          }}
          locale={locale}
        />
      )}

      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 right-4 z-50 rounded bg-slate-900 px-4 py-2 text-sm text-white shadow-lg"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}
