/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { useTranslations } from "next-intl";

interface Agent {
  id: string;
  name: string;
  photoUrl?: string;
  photoOptimizedUrl?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  languages: string;
  listingCount: number;
}

interface AgentGroup {
  agent: Agent | null; // null represents the office
  properties: any[];
}

interface AgentSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentGroups: AgentGroup[];
  onContactAgent: (agent: Agent | null, properties: any[], channel: "whatsapp" | "email") => void;
  onOpenContactForm?: () => void;
  locale: string;
}

export default function AgentSelectionModal({
  isOpen,
  onClose,
  agentGroups,
  onContactAgent,
  onOpenContactForm,
  locale,
}: AgentSelectionModalProps) {
  const t = useTranslations("ShortlistRouting");
  const [contactedKeys, setContactedKeys] = useState<string[]>([]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const hasLangMatch = (agentLanguages: string, currentLocale: string) => {
    const normalizedLocale = currentLocale.toLowerCase();
    const normalizedLanguages = agentLanguages.toLowerCase();
    if (normalizedLocale === "en" && normalizedLanguages.includes("english")) return true;
    if (normalizedLocale === "es" && normalizedLanguages.includes("spanish")) return true;
    return normalizedLanguages.includes(normalizedLocale);
  };

  // Sort groups:
  // 1. Office group is always at the end.
  // 2. Agents grouped by language match to user's detected locale.
  // 3. Highest property count within the group second.
  // 4. Alphabetical by agent name third.
  const sortedGroups = [...agentGroups].sort((a, b) => {
    if (!a.agent) return 1; // office to end
    if (!b.agent) return -1; // office to end

    const aMatches = hasLangMatch(a.agent.languages, locale) ? 1 : 0;
    const bMatches = hasLangMatch(b.agent.languages, locale) ? 1 : 0;
    if (aMatches !== bMatches) {
      return bMatches - aMatches;
    }

    if (b.properties.length !== a.properties.length) {
      return b.properties.length - a.properties.length;
    }

    return a.agent.name.localeCompare(b.agent.name);
  });

  const handleTriggerContact = (
    agent: Agent | null,
    properties: any[],
    channel: "whatsapp" | "email",
  ) => {
    const key = agent ? agent.id : "office";
    if (!contactedKeys.includes(key)) {
      setContactedKeys((prev) => [...prev, key]);
    }
    onContactAgent(agent, properties, channel);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      {/* Backdrop click close */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true"></div>

      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{t("modalTitle")}</h2>
            <p className="text-xs text-slate-500 mt-1">
              {locale === "es"
                ? "Contacta directamente a cada agente para coordinar tus visitas."
                : "Contact each listing agent directly to coordinate your visits."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-full hover:bg-slate-50 flex-shrink-0"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/30">
          {/* Direct Agent Routing Interstitial */}
          <div className="bg-blue-50/80 border border-blue-100/50 text-blue-900 rounded-xl p-4 text-sm leading-relaxed shadow-xs flex gap-3 items-start">
            <span className="text-lg leading-none">🏠</span>
            <div>
              <p className="font-semibold text-blue-950 mb-0.5">
                {locale === "es" ? "Enrutamiento Directo a Agentes" : "Direct Agent Routing"}
              </p>
              <p className="text-blue-900/90 text-xs">{t("educationInterstitial")}</p>
            </div>
          </div>

          {/* Groups list */}
          <div className="space-y-4">
            {sortedGroups.map((group) => {
              const { agent, properties: groupProps } = group;
              const isOffice = !agent;
              const key = isOffice ? "office" : agent.id;
              const isContacted = contactedKeys.includes(key);

              const photoSrc = isOffice
                ? "/images/agent-placeholder.jpg"
                : agent.photoOptimizedUrl || agent.photoUrl || "/images/agent-placeholder.jpg";
              const agentName = isOffice ? "RE/MAX Altitud" : agent.name;
              const languages = isOffice ? "" : agent.languages;

              return (
                <div
                  key={key}
                  className={`p-5 rounded-2xl border bg-white transition-all shadow-xs flex flex-col gap-4 ${
                    isContacted
                      ? "border-emerald-300 ring-1 ring-emerald-500/10"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {/* Agent Header Details */}
                  <div className="flex gap-4 items-center">
                    <div className="w-14 h-14 rounded-full overflow-hidden border border-slate-100 bg-slate-50 flex-shrink-0 relative">
                      <img
                        src={photoSrc}
                        alt={agentName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "/images/agent-placeholder.jpg";
                        }}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <h3 className="font-bold text-slate-900 truncate text-base leading-snug">
                          {agentName}
                        </h3>
                        {isContacted ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-xs animate-in fade-in slide-in-from-bottom-1 duration-200">
                            <span>✓</span>
                            <span>{locale === "es" ? "Enviado" : "Sent"}</span>
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">
                            {isOffice
                              ? locale === "es"
                                ? "Oficina Central"
                                : "Central Office"
                              : locale === "es"
                                ? "Agente a cargo"
                                : "Listing Agent"}
                          </span>
                        )}
                      </div>

                      {!isOffice && languages && (
                        <div className="text-xs text-slate-500 mt-1 truncate">
                          <span className="font-medium text-slate-600">{t("languages")}</span>{" "}
                          {languages}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Properties list within this group */}
                  <div className="border-t border-slate-100 pt-3">
                    <h4 className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-2">
                      {locale === "es"
                        ? `Propiedades de este agente (${groupProps.length})`
                        : `Properties represented (${groupProps.length})`}
                    </h4>
                    <div className="space-y-2">
                      {groupProps.map((p) => {
                        const propTitle = locale === "es" ? p.titleEs || p.titleEn : p.titleEn;
                        const mainImg = p.images?.[0] || "/images/property-placeholder.jpg";
                        return (
                          <div
                            key={p.id}
                            className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 border border-slate-100/50 hover:bg-slate-100/50 transition-colors"
                          >
                            <div className="w-12 h-9 rounded-md overflow-hidden bg-slate-200 flex-shrink-0">
                              <img
                                src={mainImg}
                                alt={propTitle}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = "/images/property-placeholder.jpg";
                                }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold text-slate-800 truncate">
                                {propTitle}
                              </div>
                              <div className="text-[10px] text-slate-500 mt-0.5 flex gap-2">
                                <span>Ref: {p.apiId}</span>
                                <span>•</span>
                                <span className="font-medium text-brand-navy">
                                  ${p.priceUsd ? p.priceUsd.toLocaleString() : "N/A"}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions for this agent group */}
                  <div className="flex flex-col sm:flex-row gap-2 border-t border-slate-100 pt-3 mt-1">
                    <button
                      onClick={() => handleTriggerContact(agent, groupProps, "whatsapp")}
                      className="flex-1 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 shadow-sm transition-colors"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.022-.014-.492-.243-.58-.276-.089-.033-.153-.05-.218.048-.065.097-.25.243-.306.307-.056.064-.112.072-.218.019-.107-.053-.45-.165-.857-.528-.316-.28-.53-.628-.592-.733-.062-.105-.007-.162.046-.215.048-.047.107-.123.16-.186.054-.064.07-.108.106-.18.036-.072.018-.135-.009-.186-.027-.053-.218-.52-.3-.718-.08-.195-.163-.169-.224-.169-.057 0-.123-.008-.19-.008-.066 0-.173.024-.263.123-.09.099-.344.336-.344.821 0 .485.353.953.402 1.02.049.068.694 1.06 1.681 1.487.235.101.418.162.56.207.236.075.45.064.62.039.189-.028.58-.237.662-.466.082-.229.082-.426.058-.467-.024-.041-.088-.065-.195-.119zm-5.43 7.37c-1.802 0-3.567-.483-5.112-1.397l-.367-.218-3.79 1 .993-3.69-.239-.38C2.593 15.545 2 13.829 2 12.052c0-5.523 4.512-10 10.05-10 5.539 0 10.052 4.478 10.052 10 0 5.525-4.513 10-10.06 10zm0-22c-6.627 0-12 5.373-12 12 0 2.115.55 4.178 1.597 6.002L0 24l6.335-1.662C8.127 23.36 10.016 24 12 24c6.627 0 12-5.373 12-12s-5.373-12-12-12z" />
                      </svg>
                      {t("contactWhatsApp")}
                    </button>
                    <button
                      onClick={() => handleTriggerContact(agent, groupProps, "email")}
                      className="flex-1 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-semibold text-xs px-4 transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      {t("contactEmail")}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-50/50">
          {onOpenContactForm && (
            <button
              onClick={() => {
                onOpenContactForm();
                onClose();
              }}
              className="text-xs text-brand-navy hover:underline font-bold"
            >
              {locale === "es"
                ? "← O usa nuestro Formulario de Contacto Unificado"
                : "← Or use our Unified Contact Form instead"}
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full sm:w-auto inline-flex h-9 items-center justify-center rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-6 shadow-sm transition-colors"
          >
            {locale === "es" ? "Terminar" : "Done"}
          </button>
        </div>
      </div>
    </div>
  );
}
