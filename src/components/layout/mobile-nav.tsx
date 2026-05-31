"use client";

/**
 * MobileNav — Full-screen slide-out navigation (from right).
 *
 * Uses shadcn Sheet (Radix Dialog) for focus trap, scroll lock,
 * ESC dismiss, and overlay dismiss.
 *
 * Controlled component — closes on route change via useEffect.
 *
 * Client Component — requires usePathname() and useState.
 */

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { mainNavItems, mobileOnlyItems, type NavItem } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { CurrencyToggle } from "@/components/layout/currency-toggle";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const t = useTranslations("Navigation");
  const tMobile = useTranslations("MobileNav");

  // Close sheet on route change (Next.js client-side navigation)
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Build flat mobile nav: main items flattened + mobile-only + language
  const mobileItems = buildMobileItems(mainNavItems);

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        className="size-11 text-white hover:bg-white/10 hover:text-white"
        onClick={() => setOpen(true)}
        aria-label={tMobile("openMenu")}
      >
        <Menu className="size-6" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="w-full max-w-sm overflow-y-auto bg-background"
          showCloseButton={true}
          aria-label={tMobile("title")}
        >
          <SheetHeader>
            <SheetTitle className="text-brand-navy">{tMobile("title")}</SheetTitle>
          </SheetHeader>

          <nav className="flex flex-1 flex-col px-4" aria-label={tMobile("mobileNav")}>
            <ul className="flex flex-col gap-1">
              {mobileItems.map((item) => (
                <MobileNavItem key={item.href} item={item} pathname={pathname} t={t} />
              ))}
            </ul>

            <hr className="my-3 border-brand-warm" />

            {/* Seller CTA — visually distinct */}
            <Link
              href="/sell"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-3 text-base font-semibold text-brand-burgundy transition-colors",
                "hover:bg-brand-burgundy/5",
                pathname === "/sell" && "border-l-2 border-brand-navy bg-brand-burgundy/5",
              )}
              {...(pathname === "/sell" ? { "aria-current": "page" as const } : {})}
            >
              <span aria-hidden="true">🏠</span>
              {t("sellYourProperty")}
            </Link>

            <hr className="my-3 border-brand-warm" />

            {/* Mobile-only items */}
            <ul className="flex flex-col gap-1">
              {mobileOnlyItems.map((item) => (
                <MobileNavItem key={item.href} item={item} pathname={pathname} t={t} />
              ))}
            </ul>
          </nav>

          <SheetFooter className="border-t border-brand-warm px-4 pt-4 flex flex-row items-center justify-between">
            <LanguageToggle variant="light" />
            <CurrencyToggle variant="light" />
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

/** Flatten nav items for mobile (no nested dropdowns per UX-DR15) */
function buildMobileItems(items: NavItem[]): NavItem[] {
  const result: NavItem[] = [];
  for (const item of items) {
    if (item.isCta) continue; // CTA is rendered separately
    if (item.children) {
      // Add the children directly (flat)
      for (const child of item.children) {
        if (child.isGroup && child.children) {
          // Add group header + its children inline
          result.push({
            labelKey: child.labelKey,
            href: child.href,
            icon: "🏘",
          });
          // Sub-items shown as compact inline text in the group item
        } else {
          result.push({
            ...child,
            icon: child.icon || item.icon,
          });
        }
      }
    } else {
      result.push(item);
    }
  }
  return result;
}

function MobileNavItem({
  item,
  pathname,
  t,
}: {
  item: NavItem;
  pathname: string;
  t: (key: string) => string;
}) {
  const isActive = item.activePrefix
    ? pathname.startsWith(item.activePrefix)
    : pathname === item.href;

  return (
    <li>
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-base text-brand-navy transition-colors",
          "hover:bg-muted",
          isActive && "border-l-2 border-brand-navy font-semibold",
        )}
        {...(isActive ? { "aria-current": "page" as const } : {})}
      >
        {item.icon && (
          <span className="text-lg" aria-hidden="true">
            {item.icon}
          </span>
        )}
        {t(item.labelKey)}
      </Link>
    </li>
  );
}
