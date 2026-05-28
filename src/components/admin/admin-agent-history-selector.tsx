"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Agent {
  id: string;
  name: string;
}

interface AdminAgentHistorySelectorProps {
  locale: string;
  agents: Agent[];
  selectedAgentId: string;
}

export function AdminAgentHistorySelector({
  locale,
  agents,
  selectedAgentId,
}: AdminAgentHistorySelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (val && val !== "none") {
      params.set("agentId", val);
    } else {
      params.delete("agentId");
    }
    router.push(`/${locale}/admin/agents/history?${params.toString()}`);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-8">
      <label
        htmlFor="agent-select"
        className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2"
      >
        Select Agent
      </label>
      <select
        id="agent-select"
        data-testid="agent-select"
        value={selectedAgentId}
        onChange={handleChange}
        className="w-full sm:max-w-xs bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
      >
        <option value="none">-- Choose an Agent --</option>
        {agents.map((agent) => (
          <option key={agent.id} value={agent.id}>
            {agent.name}
          </option>
        ))}
      </select>
    </div>
  );
}
