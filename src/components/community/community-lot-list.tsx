"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import type { PropertySearchItem } from "@/types/search";
import { LotStatusIndicator } from "./lot-status-indicator";

interface CommunityLotListProps {
  properties: PropertySearchItem[];
  locale: string;
}

type SortKey = "status" | "priceAsc" | "priceDesc";

/**
 * CommunityLotList — Client Component (AC #4)
 *
 * Sortable list of properties with status indicators.
 * Visible on mobile (<768px) as alternative to Site Map tab.
 * Sort options: status, price ASC, price DESC.
 */
export function CommunityLotList({ properties, locale }: CommunityLotListProps) {
  const t = useTranslations("CommunityPage");
  const [sortBy, setSortBy] = useState<SortKey>("status");

  const sorted = useMemo(() => {
    const items = [...properties];
    switch (sortBy) {
      case "priceAsc":
        return items.sort((a, b) => (a.priceUsd ?? 0) - (b.priceUsd ?? 0));
      case "priceDesc":
        return items.sort((a, b) => (b.priceUsd ?? 0) - (a.priceUsd ?? 0));
      case "status":
      default: {
        const order: Record<string, number> = { active: 0, reserved: 1, sold: 2 };
        return items.sort(
          (a, b) =>
            (order[(a as Record<string, unknown>).status as string] ?? 3) -
            (order[(b as Record<string, unknown>).status as string] ?? 3),
        );
      }
    }
  }, [properties, sortBy]);

  return (
    <div>
      {/* Sort controls */}
      <div className="mb-4 flex items-center gap-2">
        <label htmlFor="lot-sort" className="text-sm font-medium text-text-muted">
          {t("sort.label")}
        </label>
        <select
          id="lot-sort"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortKey)}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm"
        >
          <option value="status">{t("sort.status")}</option>
          <option value="priceAsc">{t("sort.priceAsc")}</option>
          <option value="priceDesc">{t("sort.priceDesc")}</option>
        </select>
      </div>

      {/* Lot list */}
      <ul className="divide-y divide-gray-200">
        {sorted.map((property) => {
          const title = locale === "es" ? property.titleEs : property.titleEn;
          const price = property.priceUsd
            ? `$${property.priceUsd.toLocaleString()}`
            : "—";

          return (
            <li key={property.id} className="flex items-center justify-between py-3">
              <div className="min-w-0 flex-1">
                <a
                  href={`/${locale}/property/${property.slug}`}
                  className="text-sm font-medium text-brand-navy hover:underline"
                >
                  {title}
                </a>
                <p className="mt-0.5 text-sm text-text-muted">{price}</p>
              </div>
              <LotStatusIndicator
                status={(property as Record<string, unknown>).status as string ?? "active"}
                locale={locale}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
