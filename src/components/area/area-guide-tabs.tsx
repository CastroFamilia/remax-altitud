"use client";

/**
 * AreaGuideTabs — Client Component (AC #3, #4, #5, #11, #13)
 *
 * Tab navigation for Properties/Agents/Similar Areas.
 * Implements WAI-ARIA Tabs pattern (AC #13):
 * - role="tablist", role="tab", role="tabpanel"
 * - aria-selected, aria-controls
 * - Arrow key navigation between tabs
 */

import { useState, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { PropertyCard } from "@/components/property/property-card";
import { SimilarAreasSlider } from "@/components/area/similar-areas-slider";
import type { PropertySearchItem } from "@/types/search";
import type { Area } from "@/lib/db/schema/areas";
import type { Agent } from "@/lib/db/schema/agents";

interface AreaGuideTabsProps {
  properties: PropertySearchItem[];
  agents: Agent[];
  similarAreas: Area[];
  locale: string;
}

const TAB_IDS = ["properties", "agents", "similar"] as const;
type TabId = (typeof TAB_IDS)[number];

export function AreaGuideTabs({ properties, agents, similarAreas, locale }: AreaGuideTabsProps) {
  const t = useTranslations("AreaGuide");
  const [activeTab, setActiveTab] = useState<TabId>("properties");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const currentIndex = TAB_IDS.indexOf(activeTab);
      let newIndex = currentIndex;

      switch (e.key) {
        case "ArrowRight":
          newIndex = (currentIndex + 1) % TAB_IDS.length;
          e.preventDefault();
          break;
        case "ArrowLeft":
          newIndex = (currentIndex - 1 + TAB_IDS.length) % TAB_IDS.length;
          e.preventDefault();
          break;
        case "Home":
          newIndex = 0;
          e.preventDefault();
          break;
        case "End":
          newIndex = TAB_IDS.length - 1;
          e.preventDefault();
          break;
        default:
          return;
      }

      setActiveTab(TAB_IDS[newIndex]);
      tabRefs.current[newIndex]?.focus();
    },
    [activeTab],
  );

  const tabLabels: Record<TabId, string> = {
    properties: t("tabs.properties"),
    agents: t("tabs.agents"),
    similar: t("tabs.similarAreas"),
  };

  return (
    <section data-testid="area-guide-tabs" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Tab list */}
      <div
        role="tablist"
        aria-label="Area guide sections"
        className="flex gap-1 border-b border-border"
        onKeyDown={handleKeyDown}
      >
        {TAB_IDS.map((tabId, index) => (
          <button
            key={tabId}
            ref={(el) => {
              tabRefs.current[index] = el;
            }}
            role="tab"
            id={`tab-${tabId}`}
            aria-selected={activeTab === tabId}
            aria-controls={`panel-${tabId}`}
            tabIndex={activeTab === tabId ? 0 : -1}
            onClick={() => setActiveTab(tabId)}
            className={`min-h-[44px] min-w-[44px] px-4 py-3 text-sm font-semibold transition-colors ${
              activeTab === tabId
                ? "border-b-2 border-[var(--color-primary,#000E35)] text-[var(--color-primary,#000E35)]"
                : "text-text-muted hover:text-foreground"
            }`}
          >
            {tabLabels[tabId]}
          </button>
        ))}
      </div>

      {/* Properties panel */}
      <div
        role="tabpanel"
        id="panel-properties"
        aria-labelledby="tab-properties"
        data-testid="area-guide-properties-tab"
        hidden={activeTab !== "properties"}
        className="pt-6"
      >
        {properties.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} locale={locale} />
            ))}
          </div>
        ) : (
          <p data-testid="area-no-properties" className="py-12 text-center text-text-muted">
            {t("noProperties")}
          </p>
        )}
      </div>

      {/* Agents panel */}
      <div
        role="tabpanel"
        id="panel-agents"
        aria-labelledby="tab-agents"
        data-testid="area-guide-agents-tab"
        hidden={activeTab !== "agents"}
        className="pt-6"
      >
        {agents.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent) => (
              <AgentCardSimple key={agent.id} agent={agent} locale={locale} />
            ))}
          </div>
        ) : (
          <p className="py-12 text-center text-text-muted">{t("noAgents")}</p>
        )}
      </div>

      {/* Similar Areas panel */}
      <div
        role="tabpanel"
        id="panel-similar"
        aria-labelledby="tab-similar"
        data-testid="area-guide-similar-tab"
        hidden={activeTab !== "similar"}
        className="pt-6"
      >
        {similarAreas.length > 0 ? (
          <SimilarAreasSlider areas={similarAreas} locale={locale} />
        ) : (
          <p className="py-12 text-center text-text-muted">{t("noSimilarAreas")}</p>
        )}
      </div>
    </section>
  );
}

/**
 * Simplified agent card for the area guide Agents tab.
 * Uses agent data directly without requiring propertyTitle/propertyRef
 * (unlike the listing detail AgentCard which is tightly coupled to a property).
 */
function AgentCardSimple({ agent, locale }: { agent: Agent; locale: string }) {
  const photoSrc =
    (agent.photoOptimizedUrl && agent.photoOptimizedUrl.length > 0
      ? agent.photoOptimizedUrl
      : null) ??
    (agent.photoUrl && agent.photoUrl.length > 0 ? agent.photoUrl : null) ??
    "/images/agent-placeholder.svg";

  const languages = Array.isArray(agent.languages) ? (agent.languages as string[]).join(", ") : "";

  return (
    <a
      href={`/${locale}/agents/${agent.slug}`}
      className="group flex items-start gap-4 rounded-xl border border-border bg-background p-5 shadow-sm transition-all hover:shadow-lg"
      data-testid="agent-card"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photoSrc}
        alt={`Photo of ${agent.name}`}
        width={64}
        height={64}
        className="h-16 w-16 rounded-full object-cover"
      />
      <div className="min-w-0 flex-1">
        <h3 className="font-bold text-brand-navy group-hover:underline">{agent.name}</h3>
        {languages && <p className="mt-1 text-sm text-text-muted">{languages}</p>}
        {agent.listingCount > 0 && (
          <p className="mt-1 text-xs text-text-muted">{agent.listingCount} listings</p>
        )}
      </div>
    </a>
  );
}
