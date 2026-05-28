"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface AdminLeadsPaginationProps {
  locale: string;
  currentPage: number;
  hasMore: boolean;
}

export function AdminLeadsPagination({ locale, currentPage, hasMore }: AdminLeadsPaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/${locale}/admin/leads?${params.toString()}`);
  };

  return (
    <div className="flex items-center justify-center gap-4 mt-6 pb-12">
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="flex items-center justify-center p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <span className="text-sm font-semibold text-slate-400">
        Page <span className="text-slate-200">{currentPage}</span>
      </span>

      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={!hasMore}
        className="flex items-center justify-center p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
