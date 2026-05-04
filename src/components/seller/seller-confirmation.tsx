"use client";

/**
 * SellerConfirmation — Story 5.1 (AC #11)
 *
 * Success screen shown after form submission.
 * Displays an agent match card using the existing AgentCard component (Story 4.2).
 *
 * data-testid="seller-confirmation" on the root container (AC #11 contract).
 */

import { useTranslations } from "next-intl";
import { AgentCard } from "@/components/agent/agent-card";
import type { Agent } from "@/lib/db/schema/agents";

interface SellerConfirmationProps {
  agent: Agent;
  officeName: string;
  locale: string;
}

export function SellerConfirmation({ agent, officeName, locale }: SellerConfirmationProps) {
  const t = useTranslations("SellerPage");

  return (
    <div
      data-testid="seller-confirmation"
      className="mx-auto max-w-lg space-y-6 py-8 px-4 text-center"
    >
      {/* Success heading */}
      <div className="space-y-2">
        <div
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl"
          aria-hidden="true"
        >
          ✓
        </div>
        <h2 className="text-2xl font-bold text-brand-navy">{t("confirmation.heading")}</h2>
        <p className="text-text-muted">{t("confirmation.subheading")}</p>
      </div>

      {/* Agent match card */}
      <div className="text-left">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
          {t("confirmation.agentMatchHeading")}
        </h3>
        <AgentCard
          agent={agent}
          propertyTitle=""
          propertyRef=""
          locale={locale}
          officeName={officeName}
        />
      </div>

      {/* Browse while waiting */}
      <p className="text-sm text-text-muted">{t("confirmation.browseWhileWaiting")}</p>
    </div>
  );
}
