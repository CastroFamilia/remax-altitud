"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Users,
  UserCheck,
  Download,
  AlertTriangle,
  CheckCircle2,
  X,
  Loader2,
  HelpCircle,
} from "lucide-react";
import {
  fetchAgentLeadsCountAction,
  bulkReassignLeadsAction,
  exportAgentLeadsCSVAction,
} from "@/app/actions/admin-lead-actions";

export interface Agent {
  id: string;
  name: string;
}

interface AdminBulkReassignModalProps {
  locale: string;
  agents: Agent[];
}

export function AdminBulkReassignModal({ locale, agents }: AdminBulkReassignModalProps) {
  const t = useTranslations("Admin");

  // Modal states
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"reassign" | "export">("reassign");

  // Reassignment states
  const [sourceAgentId, setSourceAgentId] = useState("");
  const [operationType, setOperationType] = useState<"single" | "distribute">("single");
  const [singleTargetAgentId, setSingleTargetAgentId] = useState("");
  const [selectedTargetAgentIds, setSelectedTargetAgentIds] = useState<string[]>([]);

  // Validation / Count state
  const [leadsCount, setLeadsCount] = useState<number | null>(null);
  const [loadingCount, setLoadingCount] = useState(false);
  const [validationError, setValidationError] = useState("");

  // Submitting / Result states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Export states
  const [exportAgentId, setExportAgentId] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  // Fetch count when source agent changes
  useEffect(() => {
    let active = true;
    if (!sourceAgentId) {
      setLeadsCount(null);
      setValidationError("");
      return;
    }

    const loadLeadsCount = async () => {
      setLoadingCount(true);
      setValidationError("");
      setLeadsCount(null);
      try {
        const count = await fetchAgentLeadsCountAction(sourceAgentId);
        if (!active) return;
        setLeadsCount(count);
        if (count === 0) {
          const sourceAgent = agents.find((a) => a.id === sourceAgentId);
          const sourceName = sourceAgent ? sourceAgent.name : "Unknown Agent";
          setValidationError(t("bulkNoLeadsError", { agentName: sourceName }));
        }
      } catch (err) {
        console.error("Failed to fetch lead count", err);
        if (!active) return;
        setValidationError(t("bulkErrorVerifyCountFailed"));
      } finally {
        if (active) {
          setLoadingCount(false);
        }
      }
    };

    loadLeadsCount();
    return () => {
      active = false;
    };
  }, [sourceAgentId, agents, t]);

  // Clean form states when modal is toggled
  const handleToggleModal = () => {
    setIsOpen(!isOpen);
    resetForm();
  };

  const resetForm = () => {
    setSourceAgentId("");
    setOperationType("single");
    setSingleTargetAgentId("");
    setSelectedTargetAgentIds([]);
    setLeadsCount(null);
    setValidationError("");
    setShowConfirm(false);
    setSuccessMessage("");
    setErrorMessage("");
    setExportAgentId("");
  };

  // Toggle checkbox select for distribution
  const handleToggleTargetAgent = (id: string) => {
    setSelectedTargetAgentIds((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id],
    );
  };

  // Step 1: Pre-confirm validations
  const handleProceedToConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!sourceAgentId) {
      setErrorMessage(t("bulkErrorSelectSource"));
      return;
    }

    if (leadsCount === 0 || leadsCount === null) {
      setErrorMessage(t("bulkErrorNoActiveLeads"));
      return;
    }

    if (operationType === "single") {
      if (!singleTargetAgentId) {
        setErrorMessage(t("bulkErrorSelectTarget"));
        return;
      }
      if (singleTargetAgentId === sourceAgentId) {
        setErrorMessage(t("bulkErrorSameAgent"));
        return;
      }
    } else {
      if (selectedTargetAgentIds.length === 0) {
        setErrorMessage(t("bulkErrorSelectTargetDistribute"));
        return;
      }
      if (selectedTargetAgentIds.includes(sourceAgentId)) {
        setErrorMessage(t("bulkErrorDistributeIncludeSource"));
        return;
      }
    }

    setShowConfirm(true);
  };

  // Step 2: Execute Reassignment
  const handleExecuteReassignment = async () => {
    setIsSubmitting(true);
    setErrorMessage("");

    const targets = operationType === "single" ? [singleTargetAgentId] : selectedTargetAgentIds;

    try {
      const res = await bulkReassignLeadsAction(sourceAgentId, targets, locale);
      if (res.success) {
        const successRes = res as { success: true; count: number };
        setSuccessMessage(t("bulkSuccessCount", { count: successRes.count }));
        setTimeout(() => {
          handleToggleModal();
        }, 3000);
      } else {
        const errorRes = res as { success: false; error: string };
        setErrorMessage(errorRes.error || t("bulkErrorUnexpectedReassignment"));
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(t("bulkErrorUnexpectedReassignment"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Execute Contact Export
  const handleExportContacts = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exportAgentId) {
      setErrorMessage(t("bulkErrorSelectExportAgent"));
      return;
    }

    setIsExporting(true);
    setErrorMessage("");
    setSuccessMessage("");

    let url = "";
    try {
      const csvContent = await exportAgentLeadsCSVAction(exportAgentId);
      const agent = agents.find((a) => a.id === exportAgentId);
      const agentName = agent ? agent.name : "Agent";
      const sanitizedName = agentName.toLowerCase().replace(/[^a-z0-9]/g, "-");
      const filename = `leads-export-${sanitizedName}-${new Date().toISOString().split("T")[0]}.csv`;

      // Trigger file download on client side with UTF-8 BOM to prevent accent corruption in Excel
      const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
      url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSuccessMessage(t("bulkExportSuccess"));
      setTimeout(() => {
        setSuccessMessage("");
      }, 4000);
    } catch (err) {
      console.error(err);
      setErrorMessage(t("bulkErrorExportFailed"));
    } finally {
      setIsExporting(false);
      if (url) {
        URL.revokeObjectURL(url);
      }
    }
  };

  // Helper to format confirmation message
  const getConfirmationPromptText = () => {
    const sourceAgent = agents.find((a) => a.id === sourceAgentId);
    const sourceName = sourceAgent ? sourceAgent.name : "Selected Agent";
    const count = leadsCount || 0;

    if (operationType === "single") {
      const targetAgent = agents.find((a) => a.id === singleTargetAgentId);
      const targetName = targetAgent ? targetAgent.name : "Selected Agent";
      return t("bulkConfirmPrompt", {
        count,
        source: sourceName,
        target: targetName,
      });
    } else {
      const targetNames = selectedTargetAgentIds
        .map((id) => agents.find((a) => a.id === id)?.name || "Unknown")
        .join(", ");
      return t("bulkConfirmPromptMulti", {
        count,
        source: sourceName,
        target: targetNames,
      });
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        data-testid="bulk-reassign-btn"
        onClick={handleToggleModal}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-all cursor-pointer shadow-lg shadow-red-900/20"
      >
        <Users className="w-4 h-4" />
        <span>Bulk Lead Operations</span>
      </button>

      {/* Backdrop & Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            data-testid="bulk-reassign-modal"
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-950/60 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
                <Users className="w-5.5 h-5.5 text-red-500" />
                <span>{t("bulkModalTitle")}</span>
              </h2>
              <button
                onClick={handleToggleModal}
                className="text-slate-400 hover:text-white transition-colors rounded-lg p-1 hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-slate-800 bg-slate-950/20">
              <button
                onClick={() => {
                  setActiveTab("reassign");
                  setErrorMessage("");
                  setSuccessMessage("");
                }}
                className={`flex-1 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                  activeTab === "reassign"
                    ? "border-red-600 text-red-400 bg-slate-800/10"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                {t("bulkReassignBtn")}
              </button>
              <button
                onClick={() => {
                  setActiveTab("export");
                  setErrorMessage("");
                  setSuccessMessage("");
                }}
                className={`flex-1 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                  activeTab === "export"
                    ? "border-red-600 text-red-400 bg-slate-800/10"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                {t("exportContactsBtn")}
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {/* Error & Success Toasts */}
              {errorMessage && (
                <div className="mb-5 flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-red-500 mb-0.5">{t("bulkErrorHeader")}</h4>
                    <p>{errorMessage}</p>
                  </div>
                </div>
              )}

              {successMessage && (
                <div className="mb-5 flex items-start gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-semibold">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-green-500 mt-0.5" />
                  <div>
                    <p>{successMessage}</p>
                  </div>
                </div>
              )}

              {/* TAB 1: REASSIGN */}
              {activeTab === "reassign" && (
                <div>
                  {!showConfirm ? (
                    <form onSubmit={handleProceedToConfirm} className="space-y-5">
                      {/* Source Agent selection */}
                      <div>
                        <label
                          htmlFor="source-agent"
                          className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2"
                        >
                          {t("bulkSourceAgentLabel")}
                        </label>
                        <select
                          id="source-agent"
                          data-testid="source-agent-select"
                          value={sourceAgentId}
                          onChange={(e) => setSourceAgentId(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                          required
                        >
                          <option value="">{t("selectAgentPlaceholder")}</option>
                          {agents.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name}
                            </option>
                          ))}
                        </select>

                        {/* Leads count live state */}
                        {loadingCount && (
                          <div className="flex items-center gap-2 mt-2 text-xs text-slate-400 font-semibold">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500" />
                            <span>{t("bulkLoadingCount")}</span>
                          </div>
                        )}

                        {leadsCount !== null && !loadingCount && leadsCount > 0 && (
                          <div
                            data-testid="leads-count-display"
                            className="mt-2 text-xs text-green-400 font-bold bg-green-500/5 border border-green-500/10 px-3 py-1.5 rounded-lg inline-block"
                          >
                            {t("bulkLeadsCountBadge", { count: leadsCount })}
                          </div>
                        )}

                        {validationError && (
                          <div
                            data-testid="no-leads-validation-msg"
                            className="mt-2 text-xs text-red-400 font-bold bg-red-500/5 border border-red-500/10 px-3 py-1.5 rounded-lg inline-block"
                          >
                            ⚠️ {validationError}
                          </div>
                        )}
                      </div>

                      {/* Operations selection */}
                      {leadsCount !== null && leadsCount > 0 && (
                        <>
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                              {t("bulkOperationTypeLabel")}
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                              <label
                                className={`flex items-center justify-center p-3.5 rounded-xl border font-bold text-sm cursor-pointer transition-all ${
                                  operationType === "single"
                                    ? "bg-red-500/5 border-red-500/40 text-red-400"
                                    : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="operationType"
                                  data-testid="reassign-mode-single"
                                  checked={operationType === "single"}
                                  onChange={() => setOperationType("single")}
                                  className="sr-only"
                                />
                                <span>{t("bulkOpSingle")}</span>
                              </label>

                              <label
                                className={`flex items-center justify-center p-3.5 rounded-xl border font-bold text-sm cursor-pointer transition-all ${
                                  operationType === "distribute"
                                    ? "bg-red-500/5 border-red-500/40 text-red-400"
                                    : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="operationType"
                                  data-testid="reassign-mode-distribute"
                                  checked={operationType === "distribute"}
                                  onChange={() => setOperationType("distribute")}
                                  className="sr-only"
                                />
                                <span>{t("bulkOpDistribute")}</span>
                              </label>
                            </div>
                          </div>

                          {/* Target options */}
                          {operationType === "single" ? (
                            <div>
                              <label
                                htmlFor="target-agent"
                                className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2"
                              >
                                {t("bulkTargetAgentLabel")}
                              </label>
                              <select
                                id="target-agent"
                                data-testid="target-agent-select"
                                value={singleTargetAgentId}
                                onChange={(e) => setSingleTargetAgentId(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                                required
                              >
                                <option value="">{t("selectAgentPlaceholder")}</option>
                                {agents
                                  .filter((a) => a.id !== sourceAgentId)
                                  .map((a) => (
                                    <option key={a.id} value={a.id}>
                                      {a.name}
                                    </option>
                                  ))}
                              </select>
                            </div>
                          ) : (
                            <div>
                              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                                {t("bulkSelectTargetAgents")}
                              </label>
                              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[160px] overflow-y-auto">
                                {agents
                                  .filter((a) => a.id !== sourceAgentId)
                                  .map((agent) => {
                                    const isChecked = selectedTargetAgentIds.includes(agent.id);
                                    return (
                                      <label
                                        key={agent.id}
                                        className={`flex items-center gap-3 px-3 py-2 rounded-lg border font-semibold text-xs transition-all cursor-pointer ${
                                          isChecked
                                            ? "bg-slate-800/60 border-slate-700 text-slate-200"
                                            : "border-transparent text-slate-400 hover:text-slate-300"
                                        }`}
                                      >
                                        <input
                                          type="checkbox"
                                          data-testid={`target-agent-checkbox-${agent.id}`}
                                          checked={isChecked}
                                          onChange={() => handleToggleTargetAgent(agent.id)}
                                          className="rounded border-slate-700 bg-slate-950 text-red-600 focus:ring-0 focus:ring-offset-0"
                                        />
                                        <span>{agent.name}</span>
                                      </label>
                                    );
                                  })}
                              </div>
                            </div>
                          )}

                          {/* Footer action */}
                          <div className="flex justify-end gap-3.5 pt-4 border-t border-slate-800/50">
                            <button
                              type="button"
                              onClick={resetForm}
                              className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white transition-colors cursor-pointer font-semibold"
                            >
                              {t("resetBtn")}
                            </button>
                            <button
                              type="submit"
                              data-testid="execute-reassign-btn"
                              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-sm transition-all shadow-md shadow-red-950/20 cursor-pointer"
                            >
                              {t("continueBtn")}
                            </button>
                          </div>
                        </>
                      )}
                    </form>
                  ) : (
                    /* Step 2: Explicit Confirmation Prompt */
                    <div className="space-y-6">
                      <div
                        data-testid="confirmation-dialog"
                        className="p-4 rounded-xl bg-red-500/5 border border-red-500/25 flex items-start gap-4"
                      >
                        <AlertTriangle className="w-10 h-10 text-red-500 shrink-0 mt-0.5" />
                        <div>
                          <h3 className="font-bold text-white text-base mb-1.5">
                            {t("bulkConfirmTitle")}
                          </h3>
                          <p className="text-slate-300 text-sm leading-relaxed font-semibold">
                            {getConfirmationPromptText()}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-4 pt-2">
                        <button
                          data-testid="cancel-reassign-dialog-btn"
                          disabled={isSubmitting}
                          onClick={() => setShowConfirm(false)}
                          className="flex-1 py-2.5 rounded-lg border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-sm font-bold transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {t("bulkCancel")}
                        </button>
                        <button
                          data-testid="confirm-reassign-dialog-btn"
                          disabled={isSubmitting}
                          onClick={handleExecuteReassignment}
                          className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-950/30"
                        >
                          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin text-white" />}
                          <span>{isSubmitting ? t("processingState") : t("bulkConfirm")}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: EXPORT */}
              {activeTab === "export" && (
                <form onSubmit={handleExportContacts} className="space-y-5">
                  <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 flex items-start gap-3.5 text-blue-400 text-xs font-semibold leading-relaxed">
                    <HelpCircle className="w-5.5 h-5.5 text-blue-400 shrink-0 mt-0.5" />
                    <p>{t("bulkExportDescription")}</p>
                  </div>

                  <div>
                    <label
                      htmlFor="export-agent"
                      className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2"
                    >
                      {t("bulkSelectAgentExport")}
                    </label>
                    <select
                      id="export-agent"
                      value={exportAgentId}
                      onChange={(e) => setExportAgentId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                      required
                    >
                      <option value="">{t("selectAgentPlaceholder")}</option>
                      {agents.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Footer action */}
                  <div className="flex justify-end gap-3.5 pt-4 border-t border-slate-800/50">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white transition-colors cursor-pointer font-semibold"
                    >
                      {t("resetBtn")}
                    </button>
                    <button
                      type="submit"
                      data-testid="export-contacts-btn"
                      disabled={isExporting}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-blue-950/20"
                    >
                      {isExporting ? (
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      <span>{isExporting ? t("exportingState") : t("exportContactsBtn")}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
