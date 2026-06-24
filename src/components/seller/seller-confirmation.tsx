"use client";

/**
 * SellerConfirmation — Story 5.1 (AC #11) + Story 5.2 (AC #4)
 *
 * Success screen shown after form submission.
 * Displays an agent match card using the existing AgentCard component (Story 4.2).
 *
 * Supports two variants via `source` prop:
 *   - "seller" (default) — uses SellerPage i18n namespace, data-testid="seller-confirmation"
 *   - "cma" — uses CmaForm i18n namespace, data-testid="cma-confirmation"
 */

import { useTranslations } from "next-intl";
import Image from "next/image";
import { AgentCard } from "@/components/agent/agent-card";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import type { Agent } from "@/lib/db/schema/agents";

interface SellerConfirmationProps {
  agent?: Agent | null;
  officeName: string;
  locale: string;
  /** Confirmation variant — determines i18n namespace and testid. Defaults to "seller". */
  source?: "seller" | "cma";
}

export function SellerConfirmation({
  agent,
  officeName,
  locale,
  source = "seller",
}: SellerConfirmationProps) {
  const t = useTranslations(source === "cma" ? "CmaForm" : "SellerPage");
  const testId = source === "cma" ? "cma-confirmation" : "seller-confirmation";

  const subheading = agent ? t("confirmation.subheading") : t("confirmation.officeSubheading");

  return (
    <div data-testid={testId} className="mx-auto max-w-lg space-y-6 py-8 px-4 text-center">
      {/* Success heading */}
      <div className="space-y-2">
        <div
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl"
          aria-hidden="true"
        >
          ✓
        </div>
        <h2 className="text-2xl font-bold text-brand-navy">{t("confirmation.heading")}</h2>
        <p className="text-text-muted">{subheading}</p>
      </div>

      {/* Office info card or Agent match card */}
      <div className="text-left">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
          {agent ? t("confirmation.agentMatchHeading") : t("confirmation.officeContactHeading")}
        </h3>
        {agent ? (
          <AgentCard
            agent={agent}
            propertyTitle=""
            propertyRef=""
            locale={locale}
            officeName={officeName}
          />
        ) : (
          <div className="rounded-xl border border-border bg-white p-6 shadow-sm flex flex-col md:flex-row gap-4 items-center">
            <div className="shrink-0 relative w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100 overflow-hidden">
              <Image
                src="/images/brand/logo-remax-altitud.png"
                alt="RE/MAX Altitud Logo"
                fill
                className="object-contain p-2"
              />
            </div>
            <div className="flex-1 space-y-1 text-center md:text-left">
              <h4 className="text-base font-bold text-brand-navy">RE/MAX Altitud</h4>
              <p className="text-xs text-text-muted flex items-center justify-center md:justify-start gap-1">
                <span>📍</span> Pérez Zeledón, San José, Costa Rica
              </p>
              <p className="text-xs text-text-muted flex items-center justify-center md:justify-start gap-1">
                <span>📞</span>{" "}
                <a href="tel:+50627717011" className="hover:underline">
                  +506 2771-7011
                </a>
              </p>
              <p className="text-xs text-text-muted flex items-center justify-center md:justify-start gap-1">
                <span>✉️</span>{" "}
                <a href="mailto:hola@remax-altitud.cr" className="hover:underline">
                  hola@remax-altitud.cr
                </a>
              </p>
            </div>
            <div className="flex flex-col sm:flex-row md:flex-col gap-2 w-full md:w-auto">
              <a
                href="https://wa.me/50627717011"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-lg bg-brand-whatsapp px-4 py-2 text-xs font-semibold text-white hover:opacity-90 transition-opacity shadow-sm"
              >
                <WhatsAppIcon className="h-4 w-4" />
                WhatsApp
              </a>
              <a
                href="mailto:hola@remax-altitud.cr"
                className="flex items-center justify-center gap-2 rounded-lg bg-brand-navy px-4 py-2 text-xs font-semibold text-white hover:opacity-90 transition-opacity shadow-sm"
              >
                Email
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Browse while waiting */}
      <p className="text-sm text-text-muted">{t("confirmation.browseWhileWaiting")}</p>
    </div>
  );
}
