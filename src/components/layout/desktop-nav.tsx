"use client";

/**
 * DesktopNav — Desktop navigation with hover-triggered dropdowns.
 *
 * Uses shadcn NavigationMenu (Radix) for ARIA-compliant hover dropdowns.
 * Hidden on mobile via `hidden md:flex`.
 *
 * Client Component — requires usePathname() for active route detection.
 */

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { mainNavItems, type NavItem } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/layout/language-toggle";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";

export function DesktopNav() {
  const pathname = usePathname();
  const t = useTranslations("Navigation");

  return (
    <nav className="hidden items-center gap-1 md:flex" aria-label={t("mainNav")}>
      <NavigationMenu delayDuration={150} skipDelayDuration={300}>
        <NavigationMenuList>
          {mainNavItems.map((item) => (
            <NavigationMenuItem key={item.href}>
              {item.children ? (
                <DropdownNavItem item={item} pathname={pathname} t={t} />
              ) : item.isCta ? (
                <CtaNavItem item={item} pathname={pathname} t={t} />
              ) : (
                <SimpleNavItem item={item} pathname={pathname} t={t} />
              )}
            </NavigationMenuItem>
          ))}
        </NavigationMenuList>
      </NavigationMenu>
      <div className="ml-2 border-l border-white/20 pl-3">
        <LanguageToggle />
      </div>
    </nav>
  );
}

type Translator = ReturnType<typeof useTranslations<"Navigation">>;

/** Regular nav link (no dropdown, no CTA) */
function SimpleNavItem({ item, pathname, t }: { item: NavItem; pathname: string; t: Translator }) {
  const isActive = item.activePrefix
    ? pathname.startsWith(item.activePrefix)
    : pathname === item.href;

  return (
    <Link
      href={item.href}
      className={cn(
        "inline-flex h-9 items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium text-white/90 transition-colors",
        "hover:bg-white/10 hover:text-white",
        isActive && "border-b-2 border-brand-gold text-white",
      )}
      {...(isActive ? { "aria-current": "page" as const } : {})}
    >
      {t(item.labelKey)}
    </Link>
  );
}

/** CTA nav item ("Sell Your Property") — outline accent button */
function CtaNavItem({ item, pathname, t }: { item: NavItem; pathname: string; t: Translator }) {
  const isActive = pathname === item.href;

  return (
    <Button
      variant="outline"
      asChild
      className={cn(
        "ml-1 border-brand-gold text-brand-gold hover:bg-brand-gold/10 hover:text-white",
        isActive && "bg-brand-gold/15 text-white",
      )}
    >
      <Link href={item.href} {...(isActive ? { "aria-current": "page" as const } : {})}>
        {t(item.labelKey)}
      </Link>
    </Button>
  );
}

/** Dropdown nav item (Properties, Areas) */
function DropdownNavItem({
  item,
  pathname,
  t,
}: {
  item: NavItem;
  pathname: string;
  t: Translator;
}) {
  const isActive = item.activePrefix
    ? pathname.startsWith(item.activePrefix)
    : pathname === item.href;

  // Separate regular children from group children (Communities)
  const regularChildren = item.children?.filter((child) => !child.isGroup) ?? [];
  const groupChildren = item.children?.filter((child) => child.isGroup) ?? [];

  return (
    <>
      <NavigationMenuTrigger
        className={cn(
          "text-white/90 hover:bg-white/10 hover:text-white",
          isActive && "border-b-2 border-brand-gold text-white",
        )}
        {...(isActive ? { "aria-current": "page" as const } : {})}
      >
        {t(item.labelKey)}
      </NavigationMenuTrigger>
      <NavigationMenuContent className="z-50">
        <ul className="grid w-[240px] gap-1 p-2">
          {regularChildren.map((child) => (
            <li key={child.href}>
              <NavigationMenuLink asChild>
                <Link
                  href={child.href}
                  className={cn(
                    "block select-none rounded-md px-3 py-2 text-sm text-brand-navy no-underline transition-colors",
                    "hover:bg-muted",
                    pathname === child.href && "bg-muted font-semibold",
                  )}
                >
                  {t(child.labelKey)}
                </Link>
              </NavigationMenuLink>
            </li>
          ))}
          {groupChildren.map((group) => (
            <li key={group.href}>
              <hr className="my-1 border-brand-warm" />
              <span className="block px-3 py-1 text-xs font-semibold uppercase tracking-wider text-text-muted">
                {t(group.labelKey)}
              </span>
              <ul className="pl-2">
                {group.children?.map((subChild) => (
                  <li key={subChild.href}>
                    <NavigationMenuLink asChild>
                      <Link
                        href={subChild.href}
                        className={cn(
                          "block select-none rounded-md px-3 py-1.5 text-sm text-brand-navy no-underline transition-colors",
                          "hover:bg-muted",
                          pathname === subChild.href && "bg-muted font-semibold",
                        )}
                      >
                        {t(subChild.labelKey)}
                      </Link>
                    </NavigationMenuLink>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </NavigationMenuContent>
    </>
  );
}
