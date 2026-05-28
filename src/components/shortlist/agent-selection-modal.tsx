import React from "react";
import { useTranslations } from "next-intl";

interface Agent {
  id: string;
  name: string;
  photoUrl?: string;
  photoOptimizedUrl?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  languages: string;
  listingCount: number;
}

interface AgentSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  agents: Agent[];
  activeCoordinatorId: string | null;
  onSelectAgent: (agent: Agent) => void;
  locale: string;
}

export default function AgentSelectionModal({
  isOpen,
  onClose,
  agents,
  activeCoordinatorId,
  onSelectAgent,
  locale,
}: AgentSelectionModalProps) {
  const t = useTranslations("ShortlistRouting");

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const hasLangMatch = (agentLanguages: string, currentLocale: string) => {
    const normalizedLocale = currentLocale.toLowerCase();
    const normalizedLanguages = agentLanguages.toLowerCase();
    if (normalizedLocale === "en" && normalizedLanguages.includes("english")) return true;
    if (normalizedLocale === "es" && normalizedLanguages.includes("spanish")) return true;
    return normalizedLanguages.includes(normalizedLocale);
  };

  // Sort unique agents present in shortlist:
  // 1. Language match first (agent speaks current locale/language)
  // 2. Highest listingCount second
  // 3. Alphabetical order of name third
  const sortedAgents = [...agents].sort((a, b) => {
    const aMatches = hasLangMatch(a.languages, locale) ? 1 : 0;
    const bMatches = hasLangMatch(b.languages, locale) ? 1 : 0;
    if (aMatches !== bMatches) {
      return bMatches - aMatches;
    }
    if (b.listingCount !== a.listingCount) {
      return b.listingCount - a.listingCount;
    }
    return a.name.localeCompare(b.name);
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      {/* Backdrop click close */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true"></div>

      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">{t("modalTitle")}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-50"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Education Interstitial Banner */}
          <div className="bg-blue-50 border border-blue-100 text-blue-800 rounded-xl p-4 text-sm leading-relaxed">
            {t("educationInterstitial")}
          </div>

          {/* Agent Options List */}
          <div className="space-y-3">
            {sortedAgents.map((agent) => {
              const isActive = agent.id === activeCoordinatorId;
              const photoSrc =
                agent.photoOptimizedUrl || agent.photoUrl || "/images/agent-placeholder.jpg";

              return (
                <button
                  key={agent.id}
                  onClick={() => {
                    onSelectAgent(agent);
                    onClose();
                  }}
                  className={`w-full text-left p-4 rounded-xl border transition-all flex items-center gap-4 ${
                    isActive
                      ? "border-blue-500 bg-blue-50/50 shadow-sm ring-1 ring-blue-500/20"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {/* Photo */}
                  <div className="relative w-16 h-16 rounded-full overflow-hidden border border-slate-100 bg-slate-50 flex-shrink-0">
                    <img
                      src={photoSrc}
                      alt={agent.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/images/agent-placeholder.jpg";
                      }}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-900 block truncate">
                        {agent.name}
                      </span>
                      {isActive && (
                        <span className="bg-blue-100 text-blue-800 text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap">
                          Active
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-500 mt-1 truncate">
                      <span className="font-medium text-slate-600">{t("languages")}</span>{" "}
                      {agent.languages}
                    </div>

                    <div className="text-xs text-slate-400 mt-0.5">
                      {agent.listingCount} {t("listings")}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
