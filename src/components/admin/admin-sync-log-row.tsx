"use client";

import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Database,
  Languages,
  Image as ImageIcon,
} from "lucide-react";

interface SyncLogItem {
  id: string;
  startedAt: Date | string;
  completedAt: Date | string | null;
  status: string;
  propertiesCreated: number;
  propertiesUpdated: number;
  propertiesRemoved: number;
  agentsSynced: number;
  translationsQueued: number;
  imagesOptimized: number;
  errors: unknown;
  errorMessage: string | null;
}

interface AdminSyncLogRowProps {
  log: SyncLogItem;
  locale: string;
  translations: {
    startedAt: string;
    completedAt: string;
    duration: string;
    propertiesAdded: string;
    propertiesUpdated: string;
    propertiesRemoved: string;
    agentsSynced: string;
    translations: string;
    images: string;
    errorTitle: string;
    details: string;
    running: string;
    success: string;
    failure: string;
    partial: string;
  };
}

export function AdminSyncLogRow({ log, locale, translations }: AdminSyncLogRowProps) {
  const [isOpen, setIsOpen] = useState(false);

  const start = new Date(log.startedAt);
  const end = log.completedAt ? new Date(log.completedAt) : null;
  const durationMs = end ? end.getTime() - start.getTime() : null;

  const formatDuration = (ms: number | null): string => {
    if (ms === null || isNaN(ms)) return "--";
    if (ms < 0) return "0s";
    if (ms < 1000) return "0s";
    const seconds = Math.floor(ms / 1000);
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    const parts = [];
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    if (s > 0 || parts.length === 0) parts.push(`${s}s`);

    return parts.join(" ");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <span
            data-testid="sync-status-badge"
            className="flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-green-500/20 text-green-400"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            {translations.success}
          </span>
        );
      case "failure":
        return (
          <span
            data-testid="sync-status-badge"
            className="flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-red-500/20 text-red-400"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            {translations.failure}
          </span>
        );
      case "partial":
        return (
          <span
            data-testid="sync-status-badge"
            className="flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-400"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            {translations.partial}
          </span>
        );
      case "running":
      default:
        return (
          <span
            data-testid="sync-status-badge"
            className="flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 animate-pulse"
          >
            <Clock className="w-3.5 h-3.5 animate-spin" />
            {translations.running}
          </span>
        );
    }
  };

  const formattedDate = (date: Date) => {
    try {
      if (!date || isNaN(date.getTime())) return "N/A";
      return date.toLocaleString(locale, {
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch (e) {
      return "N/A";
    }
  };

  const isFailed = log.status === "failure";

  return (
    <div
      data-testid="sync-log-row"
      className={`border rounded-xl transition-all duration-200 overflow-hidden ${
        isFailed
          ? "border-red-500 bg-red-950/5 hover:border-red-400 shadow-lg shadow-red-950/5"
          : "border-slate-800 bg-slate-900/50 hover:border-slate-700"
      } mb-4`}
    >
      {/* Row Header Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex flex-col lg:flex-row lg:items-center justify-between p-5 gap-4 cursor-pointer text-left focus:outline-none"
      >
        <div className="flex flex-wrap items-center gap-3">
          {getStatusBadge(log.status)}
          <span className="text-sm font-semibold text-slate-300">{formattedDate(start)}</span>
          {end && <span className="hidden lg:inline text-slate-600">|</span>}
          {end && (
            <span className="text-xs text-slate-500">Duration: {formatDuration(durationMs)}</span>
          )}
        </div>

        {/* Metrics summary */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
            <span>
              {translations.propertiesAdded}:{" "}
              <strong className="text-slate-200">{log.propertiesCreated}</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            <span>
              {translations.propertiesUpdated}:{" "}
              <strong className="text-slate-200">{log.propertiesUpdated}</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
            <span>
              {translations.propertiesRemoved}:{" "}
              <strong className="text-slate-200">{log.propertiesRemoved}</strong>
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-slate-500">
            <span>•</span>
            <span>
              {translations.agentsSynced}:{" "}
              <strong className="text-slate-400">{log.agentsSynced}</strong>
            </span>
          </div>

          <div className="flex items-center gap-1 text-slate-400 ml-auto lg:ml-0">
            {isOpen ? (
              <ChevronUp className="w-5 h-5 text-slate-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-500" />
            )}
          </div>
        </div>
      </button>

      {/* Expanded Accordion Panel */}
      {isOpen && (
        <div className="border-t border-slate-800 bg-slate-950/80 p-5 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/60 rounded-lg p-4 border border-slate-800/40">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">
                {translations.startedAt}
              </span>
              <span className="text-sm font-semibold text-slate-300">{formattedDate(start)}</span>
            </div>

            <div className="bg-slate-900/60 rounded-lg p-4 border border-slate-800/40">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">
                {translations.completedAt}
              </span>
              <span className="text-sm font-semibold text-slate-300">
                {end ? formattedDate(end) : "Processing..."}
              </span>
            </div>

            <div className="bg-slate-900/60 rounded-lg p-4 border border-slate-800/40">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">
                {translations.duration}
              </span>
              <span className="text-sm font-semibold text-slate-300">
                {formatDuration(durationMs)}
              </span>
            </div>

            <div className="bg-slate-900/60 rounded-lg p-4 border border-slate-800/40">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">
                Run ID
              </span>
              <span className="text-xs font-mono font-semibold text-slate-400 break-all select-all">
                {log.id}
              </span>
            </div>
          </div>

          {/* Pipeline Details */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-slate-500" />
              {translations.details}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-slate-900/30 rounded-lg px-3 py-2 border border-slate-800/30 text-center">
                <span className="text-[10px] text-slate-500 block">
                  {translations.propertiesAdded}
                </span>
                <span className="text-lg font-bold text-slate-200">{log.propertiesCreated}</span>
              </div>
              <div className="bg-slate-900/30 rounded-lg px-3 py-2 border border-slate-800/30 text-center">
                <span className="text-[10px] text-slate-500 block">
                  {translations.propertiesUpdated}
                </span>
                <span className="text-lg font-bold text-slate-200">{log.propertiesUpdated}</span>
              </div>
              <div className="bg-slate-900/30 rounded-lg px-3 py-2 border border-slate-800/30 text-center">
                <span className="text-[10px] text-slate-500 block">
                  {translations.propertiesRemoved}
                </span>
                <span className="text-lg font-bold text-slate-200">{log.propertiesRemoved}</span>
              </div>
              <div className="bg-slate-900/30 rounded-lg px-3 py-2 border border-slate-800/30 text-center">
                <span className="text-[10px] text-slate-500 block">
                  {translations.agentsSynced}
                </span>
                <span className="text-lg font-bold text-slate-200">{log.agentsSynced}</span>
              </div>
              <div className="bg-slate-900/30 rounded-lg px-3 py-2 border border-slate-800/30 text-center">
                <span className="text-[10px] text-slate-500 block flex items-center justify-center gap-1">
                  <Languages className="w-3.5 h-3.5 text-slate-600" />
                  {translations.translations}
                </span>
                <span className="text-lg font-bold text-slate-200">{log.translationsQueued}</span>
              </div>
              <div className="bg-slate-900/30 rounded-lg px-3 py-2 border border-slate-800/30 text-center">
                <span className="text-[10px] text-slate-500 block flex items-center justify-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5 text-slate-600" />
                  {translations.images}
                </span>
                <span className="text-lg font-bold text-slate-200">{log.imagesOptimized}</span>
              </div>
            </div>
          </div>

          {/* Diagnostic logs & errors */}
          {(log.errorMessage || (Array.isArray(log.errors) && log.errors.length > 0)) && (
            <div
              data-testid="error-diagnostic-details"
              className="border border-red-500/20 bg-red-950/5 rounded-xl p-5 space-y-4"
            >
              <h4 className="text-sm font-bold text-red-400 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                {translations.errorTitle}
              </h4>

              {log.errorMessage && (
                <div className="text-sm font-semibold text-red-200 bg-red-950/20 border border-red-900/50 p-3 rounded-lg break-words select-all">
                  {log.errorMessage}
                </div>
              )}

              {Array.isArray(log.errors) && log.errors.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-red-400/70 tracking-wider">
                    Error Array Stack
                  </span>
                  <pre className="w-full bg-slate-950 text-red-300 font-mono text-xs p-4 rounded-lg overflow-x-auto border border-slate-800 max-h-60 scrollbar-thin select-all">
                    {JSON.stringify(
                      log.errors,
                      (_, v) => (typeof v === "bigint" ? v.toString() : v),
                      2,
                    )}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
