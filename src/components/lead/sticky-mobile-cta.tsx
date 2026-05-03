"use client";

/**
 * StickyMobileCTA — Story 4.2 (AC #6, #7)
 *
 * Persistent 56px fixed bottom bar with WhatsApp + Email CTAs for mobile.
 * Hidden on desktop (md:hidden).
 * Hides when the AgentCard scrolls into viewport (IntersectionObserver).
 */

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { buildWhatsAppMessage, buildWhatsAppUrl } from "@/lib/utils/whatsapp";
import { extractUtmParams } from "@/lib/utils/utm";
import { trackWhatsAppClick } from "@/components/lead/whatsapp-cta";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";

interface StickyMobileCTAProps {
  agentId: string;
  agentWhatsapp: string | null;
  agentEmail: string | null;
  agentName: string;
  propertyTitle: string;
  propertyRef: string;
  locale: string;
}

export function StickyMobileCTA({
  agentId,
  agentWhatsapp,
  agentEmail,
  agentName,
  propertyTitle,
  propertyRef,
  locale,
}: StickyMobileCTAProps) {
  const t = useTranslations("StickyMobileCTA");

  // Initially hidden (translate-y-full). Shows when AgentCard is scrolled off screen.
  const [isVisible, setIsVisible] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Find the AgentCard element by data-testid to observe it
    const agentCard = document.querySelector('[data-testid="agent-card"]');

    // Create an IntersectionObserver (or a no-op one if no agent card)
    // so we always have an observer to disconnect on unmount
    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        // Hide sticky bar when agent card is visible; show when scrolled away
        setIsVisible(!entry.isIntersecting);
      },
      { threshold: 0.1 },
    );

    if (agentCard) {
      observerRef.current.observe(agentCard);
    } else {
      // If no agent card found, show the sticky CTA after a short delay
      // to ensure initial render starts hidden (translate-y-full) per UX spec
      const timer = setTimeout(() => setIsVisible(true), 300);
      return () => {
        observerRef.current?.disconnect();
        clearTimeout(timer);
      };
    }

    return () => observerRef.current?.disconnect();
  }, []);

  // Build WhatsApp URL
  const whatsappMessage = agentWhatsapp
    ? buildWhatsAppMessage({ agentName, propertyTitle, propertyRef, locale })
    : null;
  const whatsappUrl =
    agentWhatsapp && whatsappMessage ? buildWhatsAppUrl(agentWhatsapp, whatsappMessage) : null;

  // Build mailto URL
  const emailUrl = agentEmail ? `mailto:${agentEmail}` : null;

  function handleWhatsAppClick() {
    trackWhatsAppClick({
      agentId,
      propertyRef,
      locale,
      source: "sticky_mobile_cta",
      utmParams: extractUtmParams(),
    });
  }

  return (
    <div
      role="region"
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 flex h-14 items-center justify-center gap-2 border-t border-brand-warm bg-brand-warm px-4 pb-[env(safe-area-inset-bottom)] transition-transform duration-200 ease-out md:hidden",
        isVisible ? "translate-y-0" : "translate-y-full",
      )}
      data-testid="sticky-mobile-cta"
      aria-label={t("stickyCtaLabel")}
      aria-hidden={isVisible ? undefined : true}
    >
      {whatsappUrl && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleWhatsAppClick}
          tabIndex={isVisible ? 0 : -1}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-whatsapp px-4 py-2 text-sm font-semibold text-white"
        >
          <WhatsAppIcon className="h-5 w-5" />
          {t("whatsapp")}
        </a>
      )}
      {emailUrl && (
        <a
          href={emailUrl}
          tabIndex={isVisible ? 0 : -1}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-navy px-4 py-2 text-sm font-semibold text-white"
        >
          {t("email")}
        </a>
      )}
    </div>
  );
}

export default StickyMobileCTA;
