"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Mail } from "lucide-react";
import { ContactForm } from "@/components/lead/contact-form";

export function FooterContactButton() {
  const t = useTranslations("Footer");
  const tContact = useTranslations("ContactPage");
  const [isOpen, setIsOpen] = useState(false);

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Lock background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        aria-label={t("socialEmail")}
        className="flex size-11 items-center justify-center rounded-full text-text-on-dark transition-colors duration-[var(--duration-fast)] hover:bg-brand-gold/20 hover:text-brand-gold cursor-pointer bg-transparent border-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
      >
        <Mail className="size-5" />
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
        >
          {/* Backdrop click close */}
          <div
            className="absolute inset-0"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          ></div>

          {/* Modal Content */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-brand-navy">{tContact("pageTitle")}</h2>
              <button
                onClick={() => setIsOpen(false)}
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
              <div className="text-left text-brand-navy">
                <ContactForm />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
