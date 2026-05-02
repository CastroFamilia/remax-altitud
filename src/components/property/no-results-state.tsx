"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { offices, buildWhatsAppUrl } from "@/lib/constants/offices";
import type { SearchFilters } from "@/types/search";

export interface NoResultsStateProps {
  filters: SearchFilters;
}

function buildSearchCriteriaSummary(filters: SearchFilters): string {
  const parts: string[] = [];
  if (filters.type) parts.push(`Type: ${filters.type}`);
  if (filters.priceMin !== undefined)
    parts.push(`Min price: $${filters.priceMin.toLocaleString("en-US")}`);
  if (filters.priceMax !== undefined)
    parts.push(`Max price: $${filters.priceMax.toLocaleString("en-US")}`);
  if (filters.bedrooms !== undefined) parts.push(`Bedrooms: ${filters.bedrooms}+`);
  if (filters.bathrooms !== undefined) parts.push(`Bathrooms: ${filters.bathrooms}+`);
  if (filters.areaSlug) parts.push(`Area: ${filters.areaSlug}`);
  if (filters.tags?.length) parts.push(`Tags: ${filters.tags.join(", ")}`);
  return parts.length ? parts.join(", ") : "any property";
}

export function NoResultsState({ filters }: NoResultsStateProps) {
  const t = useTranslations("EmptyStates.noResults");

  const criteria = buildSearchCriteriaSummary(filters);
  const whatsAppHref = buildWhatsAppUrl(offices[0], `Hi, I'm looking for: ${criteria}`);

  return (
    <section
      role="status"
      aria-live="polite"
      aria-label={t("title")}
      data-testid="no-results-state"
      className="flex flex-col items-center justify-center px-4 py-16 text-center"
    >
      <div className="mb-6">
        <Search className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
      </div>

      <h2 className="mb-3 text-2xl font-bold text-brand-navy md:text-3xl">{t("title")}</h2>

      <p className="mb-8 max-w-md text-muted-foreground">{t("description")}</p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/search"
          className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {t("adjustFilters")}
        </Link>
        <a
          href={whatsAppHref}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="no-results-whatsapp-cta"
          className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted"
        >
          {t("tellAgent")}
        </a>
      </div>
    </section>
  );
}
