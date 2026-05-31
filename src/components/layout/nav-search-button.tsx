"use client";

/**
 * NavSearchButton — Search button for the navigation header.
 *
 * Desktop: Shows a search icon + Cmd/Ctrl+K shortcut hint.
 * Mobile: Shows a compact search icon.
 *
 * Opens the SearchCommandPalette overlay when clicked or when
 * the keyboard shortcut Cmd/Ctrl+K is pressed.
 */

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchCommandPalette } from "@/components/search/search-command-palette";

export function NavSearchButton() {
  const [open, setOpen] = useState(false);

  // Global keyboard shortcut: Cmd/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      {/* Desktop search button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg",
          "bg-white/5 border border-white/15 text-white/60",
          "hover:bg-white/10 hover:text-white hover:border-white/25",
          "transition-all duration-200 cursor-pointer",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-gold",
        )}
        aria-label="Search properties (⌘K)"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="text-xs font-medium">
          <kbd className="bg-white/10 border border-white/15 rounded px-1 py-0.5 text-[10px] font-mono text-white/40">
            ⌘K
          </kbd>
        </span>
      </button>

      {/* Mobile search button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "md:hidden flex items-center justify-center h-9 w-9 rounded-lg",
          "text-white/70 hover:bg-white/10 hover:text-white",
          "transition-all duration-200 cursor-pointer",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-gold",
        )}
        aria-label="Search properties"
      >
        <Search className="h-4.5 w-4.5" />
      </button>

      {/* Command Palette Overlay */}
      <SearchCommandPalette open={open} onClose={() => setOpen(false)} />
    </>
  );
}
