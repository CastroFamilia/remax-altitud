/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useShortlist } from "@/hooks/use-shortlist";
import {
  getShortlistPropertiesWithAgents,
  getActiveAgentsList,
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
  const [chosenAgentId, setChosenAgentId] = useState<string | null>(null);
  const [showCoordinatorBanner, setShowCoordinatorBanner] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fetchedShortlistRef = useRef<string[]>([]);

  const [allAgents, setAllAgents] = useState<any[]>([]);
  const [showContactForm, setShowContactForm] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [formAgentId, setFormAgentId] = useState("office");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submittedLeadAgent, setSubmittedLeadAgent] = useState<any | null>(null);

  useEffect(() => {
    getActiveAgentsList()
      .then((data) => {
        setAllAgents(data);
      })
      .catch((err) => {
        console.error("Error fetching active agents list:", err);
      });
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("Altitud:chosenCoordinator");
    if (saved) {
      setChosenAgentId(saved);
    }
  }, []);

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

  // Compute unique agents present in fetched shortlist
  const uniqueAgents = Array.from(
    new Map(
      properties
        .map((p) => p.agent)
        .filter((a): a is NonNullable<typeof a> => !!a)
        .map((a) => [a.id, a]),
    ).values(),
  );

  // Compute Auto-Selected Coordinator Agent dynamically
  const getAutoSelectedAgent = () => {
    const counts: Record<string, number> = {};
    const agentMap: Record<string, any> = {};

    for (const p of properties) {
      if (p.agent) {
        counts[p.agent.id] = (counts[p.agent.id] || 0) + 1;
        agentMap[p.agent.id] = p.agent;
      }
    }

    const agentIds = Object.keys(counts);
    if (agentIds.length === 0) return null;

    agentIds.sort((idA, idB) => {
      if (counts[idB] !== counts[idA]) {
        return counts[idB] - counts[idA];
      }
      const agentA = agentMap[idA];
      const agentB = agentMap[idB];
      if (agentB.listingCount !== agentA.listingCount) {
        return agentB.listingCount - agentA.listingCount;
      }
      return agentA.name.localeCompare(agentB.name);
    });

    const bestId = agentIds[0];
    const bestAgent = agentMap[bestId];

    // Tie detection: highest property count matches another agent
    const maxCount = counts[bestId];
    const tiedAgentIds = agentIds.filter((id) => counts[id] === maxCount);
    const hasTie = tiedAgentIds.length > 1;

    return { bestAgent, hasTie };
  };

  const autoSelectResult = getAutoSelectedAgent();
  const autoSelectedAgent = autoSelectResult?.bestAgent || null;
  const hasTie = autoSelectResult?.hasTie || false;

  const chosenAgent = uniqueAgents.find((a) => a.id === chosenAgentId) || null;
  const activeCoordinator = chosenAgent ?? autoSelectedAgent;

  useEffect(() => {
    if (activeCoordinator && formAgentId === "office") {
      setFormAgentId(activeCoordinator.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCoordinator]);

  const handleSelectAgent = (agent: any) => {
    setChosenAgentId(agent.id);
    localStorage.setItem("Altitud:chosenCoordinator", agent.id);
    setShowCoordinatorBanner(true);
  };

  const handleRemove = (id: string) => {
    remove(id);
    setProperties((prev) => prev.filter((p) => p.id !== id));
  };

  const handleContactAgent = async (agent: any, channel: "whatsapp" | "email") => {
    const intro = tRouting("whatsappMessageIntro", { agentName: agent.name });
    const outro = tRouting("whatsappMessageOutro");
    const propertyLines = properties
      .map((p) => {
        const title = locale === "es" ? p.titleEs || p.titleEn : p.titleEn;
        return `- ${title} (Ref: ${p.apiId})`;
      })
      .join("\n");

    const fullMessage = `${intro}\n${propertyLines}\n${outro}`;

    // Lead Capture POST request
    try {
      await fetch("/api/leads", {
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
          assignedAgentId: agent.id,
          shortlistPropertyIds: shortlist,
        }),
      });
    } catch (err) {
      console.error("Lead capture failed:", err);
    }

    if (channel === "whatsapp") {
      const cleanWhatsApp = (agent.whatsapp || "").replace(/\D/g, "");
      const whatsappUrl = `https://wa.me/${cleanWhatsApp}?text=${encodeURIComponent(fullMessage)}`;
      window.open(whatsappUrl, "_blank");
    } else {
      const propertyLinesWithLinks = properties
        .map((p) => {
          const title = locale === "es" ? p.titleEs || p.titleEn : p.titleEn;
          const link = `${window.location.origin}/${locale}/property/${p.slug}`;
          return `- ${title} (Ref: ${p.apiId}) - ${link}`;
        })
        .join("\n");

      const subject = tRouting("emailSubject");
      const body = tRouting("emailBody", { agentName: agent.name, list: propertyLinesWithLinks });
      const mailtoUrl = `mailto:${agent.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
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

      const recipientAgentId = formAgentId === "office" ? null : formAgentId;

      const apiPayload = {
        name: formName,
        phone: formPhone,
        email: formEmail,
        intent: "buy" as const,
        source: "contact_form" as const,
        assignedAgentId: recipientAgentId,
        shortlistPropertyIds: shortlist,
        notes: `${formMessage.trim() ? formMessage.trim() + " | " : ""}Shortlist Link: ${shareUrl}`,
      };

      const leadResponse = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiPayload),
      });

      if (leadResponse.status === 201 || leadResponse.status === 409) {
        const chosen = allAgents.find((a) => a.id === formAgentId) || null;
        setSubmittedLeadAgent(chosen);
        setFormSubmitted(true);
      } else {
        alert(t("shareError"));
      }
    } catch (err) {
      console.error("Form submission failed:", err);
      alert(t("shareError"));
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleAskAgent = async () => {
    if (uniqueAgents.length === 0) {
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

    if (uniqueAgents.length === 1) {
      await handleContactAgent(uniqueAgents[0], "whatsapp");
    } else if (hasTie && !chosenAgent) {
      setIsModalOpen(true);
    } else {
      setShowCoordinatorBanner(true);
    }
  };

  const handleShareShortlist = () => {
    // Legacy fallback text block
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

          {/* Coordinator Agent Interstitial Suggestion Banner */}
          {showCoordinatorBanner && activeCoordinator && !showContactForm && !formSubmitted && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mt-4">
              <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                {/* Profile Photo */}
                <div className="w-20 h-20 rounded-full overflow-hidden border border-slate-200 bg-white flex-shrink-0">
                  <img
                    src={
                      activeCoordinator.photoOptimizedUrl ||
                      activeCoordinator.photoUrl ||
                      "/images/agent-placeholder.jpg"
                    }
                    alt={activeCoordinator.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info & Auto-Suggest Text */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-slate-900">{activeCoordinator.name}</h3>
                  <p className="text-sm text-slate-500 mt-0.5">
                    <span className="font-semibold text-slate-600">{tRouting("languages")}</span>{" "}
                    {activeCoordinator.languages}
                  </p>
                  <p className="text-sm text-slate-700 mt-3 font-medium bg-blue-50/50 border border-blue-100/50 text-blue-900 p-3 rounded-lg leading-relaxed">
                    {tRouting("autoSuggestText", {
                      name: activeCoordinator.name,
                      count: properties.length,
                    })}
                  </p>
                </div>
              </div>

              {/* Contact Actions */}
              <div className="flex flex-col sm:flex-row gap-4 mt-6">
                <button
                  onClick={() => handleContactAgent(activeCoordinator, "whatsapp")}
                  className="flex-1 inline-flex h-11 items-center justify-center rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 shadow-md transition-colors"
                >
                  {tRouting("contactAgent", { name: activeCoordinator.name })}
                </button>
                <button
                  onClick={() => handleContactAgent(activeCoordinator, "email")}
                  className="flex-1 inline-flex h-11 items-center justify-center rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold px-6 transition-colors"
                >
                  {tRouting("contactEmail")}
                </button>
              </div>

              <div className="text-center mt-4 flex flex-col gap-2">
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
                  className="text-xs text-brand-navy hover:underline font-semibold"
                >
                  {locale === "es"
                    ? "O usar nuestro Formulario de Contacto"
                    : "Or use our Contact Form instead"}
                </button>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold underline"
                >
                  {tRouting("chooseDifferent")}
                </button>
              </div>
            </div>
          )}

          {/* Shortlist Contact Form */}
          {showContactForm && !formSubmitted && (
            <div
              id="shortlist-contact-form"
              className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 md:p-8 mt-4 shadow-sm"
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

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="form-agent" className="text-sm font-semibold text-brand-navy">
                    {t("agentLabel")}
                  </label>
                  <select
                    id="form-agent"
                    value={formAgentId}
                    onChange={(e) => setFormAgentId(e.target.value)}
                    className="w-full h-11 rounded-md border border-slate-300 bg-white px-3 text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-navy"
                  >
                    <option value="office">{t("sendToOffice")}</option>
                    {uniqueAgents.length > 0 && (
                      <optgroup label={t("shortlistAgentsGroup")}>
                        {uniqueAgents.map((agent) => (
                          <option key={agent.id} value={agent.id}>
                            {agent.name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {allAgents.filter((allA) => !uniqueAgents.some((uA) => uA.id === allA.id))
                      .length > 0 && (
                      <optgroup label={t("otherAgentsGroup")}>
                        {allAgents
                          .filter((allA) => !uniqueAgents.some((uA) => uA.id === allA.id))
                          .map((agent) => (
                            <option key={agent.id} value={agent.id}>
                              {agent.name}
                            </option>
                          ))}
                      </optgroup>
                    )}
                  </select>
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
            <div className="bg-slate-50 border border-emerald-200 rounded-2xl p-6 md:p-8 mt-4 shadow-sm text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200">
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

              {/* Recipient Details & Immediate WhatsApp / Email Fallbacks */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 max-w-md mx-auto text-left shadow-xs mb-8">
                <div className="flex gap-4 items-center">
                  <div className="w-14 h-14 rounded-full overflow-hidden border border-slate-200 bg-slate-100 flex-shrink-0">
                    <img
                      src={
                        submittedLeadAgent?.photoOptimizedUrl ||
                        submittedLeadAgent?.photoUrl ||
                        "/images/agent-placeholder.jpg"
                      }
                      alt={submittedLeadAgent?.name || "RE/MAX Altitud"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      {submittedLeadAgent?.name || "RE/MAX Altitud"}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {submittedLeadAgent
                        ? `${tRouting("languages")} ${submittedLeadAgent.languages}`
                        : "Oficina Central"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mt-5">
                  <button
                    onClick={() =>
                      handleContactAgent(
                        submittedLeadAgent || {
                          id: "office",
                          name: "RE/MAX Altitud",
                          whatsapp: "50688888888",
                          email: "info@remax-altitud.cr",
                        },
                        "whatsapp",
                      )
                    }
                    className="flex-1 inline-flex h-10 items-center justify-center rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 shadow-sm transition-colors"
                  >
                    {submittedLeadAgent ? tRouting("contactWhatsApp") : "WhatsApp"}
                  </button>
                  <button
                    onClick={() =>
                      handleContactAgent(
                        submittedLeadAgent || {
                          id: "office",
                          name: "RE/MAX Altitud",
                          whatsapp: "50688888888",
                          email: "info@remax-altitud.cr",
                        },
                        "email",
                      )
                    }
                    className="flex-1 inline-flex h-10 items-center justify-center rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-sm px-4 transition-colors"
                  >
                    {tRouting("contactEmail")}
                  </button>
                </div>
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
          agents={uniqueAgents}
          activeCoordinatorId={activeCoordinator?.id || null}
          onSelectAgent={handleSelectAgent}
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
