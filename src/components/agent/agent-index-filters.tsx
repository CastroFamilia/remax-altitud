"use client";

/**
 * AgentIndexFilters — Story 4.3 (AC #3, #4, FR38)
 *
 * Client Component: manages filter state for the agents index page.
 * Filters agents by office and language in-memory (small list, no API needed).
 */

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AgentIndexCard } from "@/components/agent/agent-index-card";
import type { Agent } from "@/lib/db/schema/agents";

// Same set used in AgentProfileHero / AgentIndexCard — keeps labels in sync.
const KNOWN_LANGUAGES = new Set(["en", "es", "de", "fr", "it", "pt"]);

interface AgentIndexFiltersProps {
  agents: Agent[];
  locale: string;
  officeMap: Record<string, string>; // officeId → officeName, pre-resolved server-side
}

export function AgentIndexFilters({ agents, locale, officeMap }: AgentIndexFiltersProps) {
  const t = useTranslations("AgentProfile");

  const [selectedOffice, setSelectedOffice] = useState<string>("all");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all");

  // Derive unique office options from the agents list (ordered by appearance)
  const officeOptions = Array.from(
    new Map(
      agents
        .filter((a) => a.officeId && officeMap[a.officeId])
        .map((a) => [a.officeId, officeMap[a.officeId]]),
    ).entries(),
  );

  // Derive unique language options from the agents list
  const allLanguages = Array.from(
    new Set(agents.flatMap((a) => (Array.isArray(a.languages) ? (a.languages as string[]) : []))),
  ).sort();

  // Filter logic
  const filteredAgents = agents.filter((agent) => {
    const officeMatch = selectedOffice === "all" || agent.officeId === selectedOffice;
    const langMatch =
      selectedLanguage === "all" ||
      (Array.isArray(agent.languages) && (agent.languages as string[]).includes(selectedLanguage));
    return officeMatch && langMatch;
  });

  function handleClearFilters() {
    setSelectedOffice("all");
    setSelectedLanguage("all");
  }

  return (
    <div>
      {/* Filter controls */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="agent-office-filter" className="text-sm font-medium text-text-muted">
            {t("filterByOffice")}
          </label>
          <select
            id="agent-office-filter"
            data-testid="agent-office-filter"
            value={selectedOffice}
            onChange={(e) => setSelectedOffice(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-navy"
          >
            <option value="all">{t("allOffices")}</option>
            {officeOptions.map(([officeId, officeName]) => (
              <option key={officeId} value={officeId}>
                {officeName}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="agent-language-filter" className="text-sm font-medium text-text-muted">
            {t("filterByLanguage")}
          </label>
          <select
            id="agent-language-filter"
            data-testid="agent-language-filter"
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-navy"
          >
            <option value="all">{t("allLanguages")}</option>
            {allLanguages.map((lang) => (
              <option key={lang} value={lang}>
                {KNOWN_LANGUAGES.has(lang)
                  ? t(`language.${lang}` as Parameters<typeof t>[0])
                  : lang.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredAgents.length === 0 ? (
        <div data-testid="agent-no-match" className="py-8 text-center">
          <p className="text-base text-text-muted">{t("noAgentsMatch")}</p>
          <button
            onClick={handleClearFilters}
            className="mt-4 rounded-lg bg-brand-navy px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            {t("clearFilters")}
          </button>
        </div>
      ) : (
        <ul
          data-testid="agent-index-list"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {[...filteredAgents]
            .sort((a, b) => {
              const aOwner =
                a.name.toLowerCase().includes("cesar") ||
                a.name.toLowerCase().includes("césar") ||
                a.name.toLowerCase().includes("alejandra");
              const bOwner =
                b.name.toLowerCase().includes("cesar") ||
                b.name.toLowerCase().includes("césar") ||
                b.name.toLowerCase().includes("alejandra");
              if (aOwner && !bOwner) return -1;
              if (!aOwner && bOwner) return 1;
              return 0;
            })
            .map((agent) => (
              <li key={agent.id}>
                <AgentIndexCard
                  agent={agent}
                  officeName={officeMap[agent.officeId] ?? "REMAX Altitud"}
                  locale={locale}
                />
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}

export default AgentIndexFilters;
