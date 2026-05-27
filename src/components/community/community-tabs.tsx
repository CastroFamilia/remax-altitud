"use client";

import { useState, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import type { Community } from "@/lib/db/schema/communities";
import type { PropertySearchItem } from "@/types/search";
import { PropertyCard } from "@/components/property/property-card";
import { CommunityLotList } from "./community-lot-list";

interface CommunityTabsProps {
  properties: PropertySearchItem[];
  community: Community;
  locale: string;
}

const TAB_KEYS = ["properties", "sitemap"] as const;
type TabKey = (typeof TAB_KEYS)[number];

/**
 * CommunityTabs — Client Component (AC #4, #5, #16)
 *
 * WAI-ARIA Tabs pattern with Properties and Site Map tabs.
 * On mobile (<768px), Site Map tab is hidden; replaced by sortable lot list.
 * Follows AreaGuideTabs WAI-ARIA pattern exactly.
 */
export function CommunityTabs({ properties, community, locale }: CommunityTabsProps) {
  const t = useTranslations("CommunityPage");
  const [activeTab, setActiveTab] = useState<TabKey>("properties");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const tabLabels: Record<TabKey, string> = {
    properties: t("tabs.properties"),
    sitemap: t("tabs.siteMap"),
  };

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const currentIndex = TAB_KEYS.indexOf(activeTab);
      let nextIndex = currentIndex;

      switch (e.key) {
        case "ArrowRight":
          nextIndex = (currentIndex + 1) % TAB_KEYS.length;
          break;
        case "ArrowLeft":
          nextIndex = (currentIndex - 1 + TAB_KEYS.length) % TAB_KEYS.length;
          break;
        case "Home":
          nextIndex = 0;
          break;
        case "End":
          nextIndex = TAB_KEYS.length - 1;
          break;
        default:
          return;
      }

      e.preventDefault();
      setActiveTab(TAB_KEYS[nextIndex]);
      tabRefs.current[nextIndex]?.focus();
    },
    [activeTab],
  );

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Tab list */}
      <div
        role="tablist"
        aria-label={t("tabs.properties")}
        className="mb-6 flex gap-1 border-b border-gray-200"
      >
        {TAB_KEYS.map((key, index) => (
          <button
            key={key}
            ref={(el) => {
              tabRefs.current[index] = el;
            }}
            role="tab"
            id={`tab-${key}`}
            aria-selected={activeTab === key}
            aria-controls={`panel-${key}`}
            tabIndex={activeTab === key ? 0 : -1}
            onClick={() => setActiveTab(key)}
            onKeyDown={handleKeyDown}
            data-testid={`community-${key === "sitemap" ? "sitemap" : "properties"}-tab`}
            className={`px-4 py-3 text-sm font-semibold transition-colors ${
              key === "sitemap" ? "hidden md:block" : ""
            } ${
              activeTab === key
                ? "border-b-2 border-[var(--color-gold,#C2A661)] text-brand-navy"
                : "text-text-muted hover:text-brand-navy"
            }`}
          >
            {tabLabels[key]}
          </button>
        ))}
      </div>

      {/* Properties tab panel */}
      <div
        role="tabpanel"
        id="panel-properties"
        aria-labelledby="tab-properties"
        hidden={activeTab !== "properties"}
      >
        {properties.length > 0 ? (
          <>
            {/* Desktop: property grid */}
            <div className="hidden md:grid md:grid-cols-2 md:gap-6 lg:grid-cols-3">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} locale={locale} />
              ))}
            </div>
            {/* Mobile: sortable lot list */}
            <div className="md:hidden">
              <CommunityLotList properties={properties} locale={locale} />
            </div>
          </>
        ) : (
          <p className="py-12 text-center text-text-muted">{t("noProperties")}</p>
        )}
      </div>

      {/* Site Map tab panel (desktop only) */}
      <div
        role="tabpanel"
        id="panel-sitemap"
        aria-labelledby="tab-sitemap"
        hidden={activeTab !== "sitemap"}
        className="hidden md:block"
      >
        {community.siteMapImageUrl ? (
          <div className="relative aspect-[16/9] overflow-hidden rounded-lg">
            <Image
              src={community.siteMapImageUrl}
              alt={`${community.name} site map`}
              fill
              className="object-contain"
              sizes="(max-width: 1280px) 100vw, 1280px"
            />
          </div>
        ) : (
          <p className="py-12 text-center text-text-muted">{t("noSiteMap")}</p>
        )}
      </div>
    </section>
  );
}
