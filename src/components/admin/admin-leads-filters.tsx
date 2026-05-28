"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, Filter, X } from "lucide-react";

interface AgentOption {
  id: string;
  name: string;
}

interface AdminLeadsFiltersProps {
  locale: string;
  agents: AgentOption[];
}

export function AdminLeadsFilters({ locale, agents }: AdminLeadsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState(searchParams.get("status") || "all");
  const [source, setSource] = useState(searchParams.get("source") || "all");
  const [intent, setIntent] = useState(searchParams.get("intent") || "all");
  const [agentId, setAgentId] = useState(searchParams.get("agentId") || "all");
  const [startDate, setStartDate] = useState(searchParams.get("startDate") || "");
  const [endDate, setEndDate] = useState(searchParams.get("endDate") || "");

  React.useEffect(() => {
    setStatus(searchParams.get("status") || "all");
    setSource(searchParams.get("source") || "all");
    setIntent(searchParams.get("intent") || "all");
    setAgentId(searchParams.get("agentId") || "all");
    setStartDate(searchParams.get("startDate") || "");
    setEndDate(searchParams.get("endDate") || "");
  }, [searchParams]);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (status && status !== "all") params.set("status", status);
    if (source && source !== "all") params.set("source", source);
    if (intent && intent !== "all") params.set("intent", intent);
    if (agentId && agentId !== "all") params.set("agentId", agentId);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    params.set("page", "1"); // reset to page 1 on filter

    router.push(`/${locale}/admin/leads?${params.toString()}`);
  };

  const handleClear = () => {
    setStatus("all");
    setSource("all");
    setIntent("all");
    setAgentId("all");
    setStartDate("");
    setEndDate("");
    router.push(`/${locale}/admin/leads`);
  };

  return (
    <form
      onSubmit={handleApply}
      className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-8 space-y-4"
    >
      <div className="flex items-center gap-2 text-slate-200 font-semibold mb-2">
        <Filter className="w-5 h-5 text-red-500" />
        <span>Filter Leads</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Status Dropdown */}
        <div>
          <label
            htmlFor="filter-status"
            className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2"
          >
            Status
          </label>
          <select
            id="filter-status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {/* Source Dropdown */}
        <div>
          <label
            htmlFor="filter-source"
            className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2"
          >
            Source
          </label>
          <select
            id="filter-source"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
          >
            <option value="all">All Sources</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="seller_form">Seller Form</option>
            <option value="contact_form">Contact Form</option>
            <option value="cma_form">CMA Form</option>
            <option value="whatsapp_click">WhatsApp Click</option>
          </select>
        </div>

        {/* Intent Dropdown */}
        <div>
          <label
            htmlFor="filter-intent"
            className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2"
          >
            Intent
          </label>
          <select
            id="filter-intent"
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
          >
            <option value="all">All Intents</option>
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
            <option value="invest">Invest</option>
            <option value="recruit">Recruit</option>
          </select>
        </div>

        {/* Agent Dropdown */}
        <div>
          <label
            htmlFor="filter-agent"
            className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2"
          >
            Assigned Agent
          </label>
          <select
            id="filter-agent"
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
          >
            <option value="all">All Agents</option>
            <option value="unassigned">Unassigned</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
        </div>

        {/* Start Date */}
        <div>
          <label
            htmlFor="filter-start-date"
            className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2"
          >
            Start Date
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
            End Date
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
          <span>Clear Filters</span>
        </button>
        <button
          type="submit"
          className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-sm transition-all focus:ring-2 focus:ring-red-500 cursor-pointer"
        >
          Apply Filters
        </button>
      </div>
    </form>
  );
}
