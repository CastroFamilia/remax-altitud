"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <button
      onClick={handlePrint}
      className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-navy shadow-sm border border-brand-warm hover:bg-brand-navy hover:text-white transition-colors"
      aria-label="Print Property Details"
    >
      <Printer className="h-4 w-4" />
      <span className="hidden sm:inline">Print</span>
    </button>
  );
}
