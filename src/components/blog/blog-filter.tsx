"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Filter, Tag } from "lucide-react";

export function BlogFilter({ categories }: { categories: string[]; locations?: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`?${params.toString()}`);
  };

  const selectedCategory = searchParams.get("category") || "";

  return (
    <div className="flex flex-wrap items-center gap-3 mb-10 pb-6 border-b border-brand-warm">
      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 mr-2">
        <Filter className="w-3.5 h-3.5" />
        <span>Category:</span>
      </div>

      {/* Category Dropdown */}
      <div className="relative">
        <select
          onChange={(e) => handleFilter("category", e.target.value)}
          value={selectedCategory}
          className="appearance-none bg-white border border-slate-200 text-brand-navy text-sm font-medium rounded-xl pl-8 pr-8 py-2 hover:border-brand-navy/30 focus:outline-none focus:ring-2 focus:ring-brand-navy/20 cursor-pointer shadow-sm"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>

      {selectedCategory && (
        <button
          onClick={() => router.push("?")}
          className="text-xs font-semibold text-brand-burgundy hover:text-brand-red underline underline-offset-2 ml-2"
        >
          Clear filter
        </button>
      )}
    </div>
  );
}
