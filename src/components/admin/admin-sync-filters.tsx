"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, Filter, X } from "lucide-react";

interface AdminSyncFiltersProps {
  locale: string;
  translations: {
    filterTitle: string;
    startDate: string;
    endDate: string;
    status: string;
    allStatuses: string;
    filterButton: string;
    clearFilters: string;
    running: string;
    success: string;
    failure: string;
    partial: string;
  };
}

export function AdminSyncFilters({ locale, translations }: AdminSyncFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState(searchParams.get("status") || "all");
  const [startDate, setStartDate] = useState(searchParams.get("startDate") || "");
  const [endDate, setEndDate] = useState(searchParams.get("endDate") || "");

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (status && status !== "all") params.set("status", status);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    params.set("page", "1"); // reset to page 1 on filter

    router.push(`/${locale}/admin?${params.toString()}`);
  };

  const handleClear = () => {
    setStatus("all");
    setStartDate("");
    setEndDate("");
    router.push(`/${locale}/admin`);
  };

  return (
    <form
      onSubmit={handleApply}
      className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-8 space-y-4"
    >
      <div className="flex items-center gap-2 text-slate-200 font-semibold mb-2">
        <Filter className="w-5 h-5 text-red-500" />
        <span>{translations.filterTitle}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status Dropdown */}
        <div>
          <label
            htmlFor="filter-status"
            className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2"
          >
            {translations.status}
          </label>
          <select
            id="filter-status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
          >
            <option value="all">{translations.allStatuses}</option>
            <option value="running">{translations.running}</option>
            <option value="success">{translations.success}</option>
            <option value="failure">{translations.failure}</option>
            <option value="partial">{translations.partial}</option>
          </select>
        </div>

        {/* Start Date */}
        <div>
          <label
            htmlFor="filter-start-date"
            className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2"
          >
            {translations.startDate}
          </label>
          <div className="relative">
            <input
              id="filter-start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
            />
            <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-500 pointer-events-none" />
          </div>
        </div>

        {/* End Date */}
        <div>
          <label
            htmlFor="filter-end-date"
            className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2"
          >
            {translations.endDate}
          </label>
          <div className="relative">
            <input
              id="filter-end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
            />
            <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-500 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800/50">
        <button
          type="button"
          onClick={handleClear}
          className="flex items-center gap-1.5 px-4 py-2 text-sm text-slate-400 hover:text-white transition-all rounded-lg hover:bg-slate-800 cursor-pointer"
        >
          <X className="w-4 h-4" />
          <span>{translations.clearFilters}</span>
        </button>
        <button
          type="submit"
          className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-sm transition-all focus:ring-2 focus:ring-red-500 cursor-pointer"
        >
          {translations.filterButton}
        </button>
      </div>
    </form>
  );
}
