"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { EmptyState } from "@/components/ui/empty-state";
import { offices, buildWhatsAppUrl } from "@/lib/constants/offices";

export function NoResultsState() {
  const t = useTranslations("EmptyStates.noResults");

  // Default to first office for WhatsApp CTA
  const whatsAppHref = buildWhatsAppUrl(offices[0], t("whatsappMessage"));

  return (
    <EmptyState
      icon={<Search className="h-12 w-12 text-muted-foreground" aria-hidden="true" />}
      title={t("title")}
      description={t("description")}
      primaryAction={{
        label: t("adjustFilters"),
        // TODO: change to /search when Epic 3 is implemented
        href: "/",
      }}
      secondaryAction={{
        label: t("tellAgent"),
        href: whatsAppHref,
      }}
    />
  );
}
