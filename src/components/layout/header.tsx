/**
 * Header — App header with frosted glass effect.
 *
 * Server Component for structure — interactive children
 * (DesktopNav, MobileNav, NavSearchButton) are Client Components.
 *
 * Sticky at top, z-index 30 (--z-sticky-nav).
 */

import { Logo } from "@/components/layout/logo";
import { DesktopNav } from "@/components/layout/desktop-nav";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ShortlistIcon } from "@/components/shortlist/shortlist-icon";
import { NavSearchButton } from "@/components/layout/nav-search-button";

export function Header() {
  return (
    <header
      className="sticky top-0 border-b border-white/10 transition-[background-color,box-shadow] duration-[var(--duration-fast)]"
      style={{
        background: "rgba(0, 14, 53, 0.97)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        zIndex: "var(--z-sticky-nav)" as unknown as number,
      }}
    >
      <div className="container flex h-14 items-center justify-between md:h-16">
        <Logo />
        <DesktopNav />
        <div className="flex items-center gap-2">
          <NavSearchButton />
          <ShortlistIcon />
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
