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

interface StickyMobileCTAProps {
  agentWhatsapp: string | null;
  agentEmail: string | null;
  agentName: string;
  propertyTitle: string;
  propertyRef: string;
  locale: string;
}

// Simple WhatsApp icon for the sticky bar
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

export function StickyMobileCTA({
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
      agentId: agentName, // sticky bar doesn't have agentId — use name as identifier
      propertyRef,
      locale,
      source: "sticky_mobile_cta",
      utmParams: extractUtmParams(),
    });
  }

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 flex h-14 items-center justify-center gap-2 border-t border-brand-warm bg-brand-warm px-4 pb-[env(safe-area-inset-bottom)] transition-transform duration-200 ease-out md:hidden",
        isVisible ? "translate-y-0" : "translate-y-full",
      )}
      data-testid="sticky-mobile-cta"
      aria-label={t("stickyCtaLabel")}
    >
      {whatsappUrl && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleWhatsAppClick}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-whatsapp px-4 py-2 text-sm font-semibold text-white"
        >
          <WhatsAppIcon className="h-5 w-5" />
          {t("whatsapp")}
        </a>
      )}
      {emailUrl && (
        <a
          href={emailUrl}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-navy px-4 py-2 text-sm font-semibold text-white"
        >
          {t("email")}
        </a>
      )}
    </div>
  );
}

export default StickyMobileCTA;
