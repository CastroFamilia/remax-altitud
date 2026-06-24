"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function BlogFilter({
  categories,
  locations,
}: {
  categories: string[];
  locations: string[];
}) {
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

  return (
    <div className="flex gap-4 mb-8">
      <select
        onChange={(e) => handleFilter("category", e.target.value)}
        value={searchParams.get("category") || ""}
        className="border rounded p-2"
      >
        <option value="">All Categories</option>
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <select
        onChange={(e) => handleFilter("location", e.target.value)}
        value={searchParams.get("location") || ""}
        className="border rounded p-2"
      >
        <option value="">All Locations</option>
        {locations.map((l) => (
          <option key={l} value={l}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );
}
