"use client";

/**
 * AgentProfileCTAs — Story 4.3 (AC #1)
 *
 * Client Component: builds WhatsApp URLs at runtime (locale-aware message, no property context).
 * Provides WhatsApp + Email CTAs for the agent profile page.
 */

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { buildWhatsAppUrl } from "@/lib/utils/whatsapp";
import { extractUtmParams } from "@/lib/utils/utm";
import { trackWhatsAppClick } from "@/components/lead/whatsapp-cta";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { AgentContactForm } from "@/components/agent/agent-contact-form";

interface AgentProfileCTAsProps {
  agentWhatsapp: string | null;
  agentEmail: string | null;
  agentName: string;
  locale: string;
  agentId: string; // for lead tracking
}

export function AgentProfileCTAs({
  agentWhatsapp,
  agentEmail,
  agentName,
  locale,
  agentId,
}: AgentProfileCTAsProps) {
  const t = useTranslations("AgentProfile");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsModalOpen(false);
    };
    if (isModalOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isModalOpen]);

  // Lock background scroll when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isModalOpen]);

  // General inquiry message (no property context on agent profile page).
  // Localized via the `generalInquiryEn` key, which has Spanish + English copies
  // in src/messages/{en,es}.json — the active locale namespace selects which.
  const agentProfileMessage = t("generalInquiryEn", { name: agentName });

  // Build WhatsApp URL
  const whatsappDigits = agentWhatsapp ? agentWhatsapp.replace(/\D/g, "") : "";
  const whatsappUrl = whatsappDigits ? buildWhatsAppUrl(whatsappDigits, agentProfileMessage) : null;

  function handleWhatsAppClick() {
    trackWhatsAppClick({
      agentId,
      propertyRef: "",
      locale,
      source: "agent_profile",
      utmParams: extractUtmParams(),
    });
  }

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row">
        {whatsappUrl ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleWhatsAppClick}
            data-testid="agent-profile-whatsapp-cta"
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-whatsapp px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <WhatsAppIcon className="h-5 w-5" />
            {t("whatsapp")}
          </a>
        ) : null}

        {agentEmail ? (
          <button
            onClick={() => setIsModalOpen(true)}
            data-testid="agent-profile-email-cta"
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-navy px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer"
          >
            {t("email")}
          </button>
        ) : null}
      </div>

      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
        >
          {/* Backdrop click close */}
          <div
            className="absolute inset-0"
            onClick={() => setIsModalOpen(false)}
            aria-hidden="true"
          ></div>

          {/* Modal Content */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-brand-navy">
                {t("contactAgent", { name: agentName })}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-full hover:bg-slate-50 flex-shrink-0 cursor-pointer"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 overflow-y-auto flex-1 bg-brand-light/30">
              <AgentContactForm
                agentId={agentId}
                agentEmail={agentEmail}
                agentName={agentName}
                variant="modal"
                onClose={() => setIsModalOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AgentProfileCTAs;
