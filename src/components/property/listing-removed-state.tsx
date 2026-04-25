"use client";

import { Home } from "lucide-react";
import { useTranslations } from "next-intl";
import { EmptyState } from "@/components/ui/empty-state";
import { offices, buildWhatsAppUrl } from "@/lib/constants/offices";

export function ListingRemovedState() {
  const t = useTranslations("EmptyStates.listingRemoved");

  const whatsAppHref = buildWhatsAppUrl(offices[0], t("whatsappMessage"));

  return (
    <EmptyState
      icon={<Home className="h-12 w-12 text-muted-foreground" aria-hidden="true" />}
      title={t("title")}
      description={t("description")}
      primaryAction={{
        label: t("browseSimilar"),
        // TODO: change to /search when Epic 3 is implemented
        href: "/",
      }}
      secondaryAction={{
        label: t("contactAgent"),
        href: whatsAppHref,
      }}
    />
  );
}
