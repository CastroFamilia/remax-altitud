"use client";

/**
 * DesktopNav — Desktop navigation with hover-triggered dropdowns.
 *
 * Uses shadcn NavigationMenu (Radix) for ARIA-compliant hover dropdowns.
 * Hidden on mobile via `hidden lg:flex`.
 *
 * Client Component — requires usePathname() for active route detection.
 */

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { mainNavItems, type NavItem } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { CurrencyToggle } from "@/components/layout/currency-toggle";
import { UnitToggle } from "@/components/layout/unit-toggle";
import { useLocaleCurrency } from "@/hooks/use-locale-currency";
import { useLocaleUnits } from "@/hooks/use-locale-units";
import { Globe, Users } from "lucide-react";
import { getTheHubReferralDirectoryUrl } from "@/lib/thehub/config";
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
  const locale = useLocale();
  const { currency } = useLocaleCurrency();
  const { unitSystem } = useLocaleUnits(locale);
  const t = useTranslations("Navigation");

  return (
    <nav
      className="hidden items-center gap-0.5 xl:flex 2xl:gap-1 ml-auto"
      aria-label={t("mainNav")}
    >
      <NavigationMenu delayDuration={150} skipDelayDuration={300} viewport={false}>
        <NavigationMenuList className="flex items-center gap-0.5 xl:gap-0.5 2xl:gap-1">
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

          {/* External Referral Directory CTA */}
          <NavigationMenuItem>
            <a
              href={getTheHubReferralDirectoryUrl(locale)}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-2 text-xs font-semibold text-white transition hover:bg-white/20 hover:text-white whitespace-nowrap",
                "xl:h-8 xl:px-2.5 xl:text-xs 2xl:h-9 2xl:px-3 2xl:text-sm",
              )}
              title={t("referrals")}
            >
              <Users className="size-3.5 opacity-90" />
              <span>{t("referrals")}</span>
            </a>
          </NavigationMenuItem>

          {/* Unified Preferences Dropdown Selector */}
          <NavigationMenuItem>
            <NavigationMenuTrigger
              className={cn(
                "text-white/90 hover:bg-white/10 hover:text-white whitespace-nowrap",
                "px-1.5 py-1 text-xs lg:px-1.5 lg:text-xs xl:px-2 xl:text-xs 2xl:px-2.5 2xl:text-sm",
              )}
            >
              <Globe className="mr-1 size-3.5 opacity-80 shrink-0" />
              <span className="hidden 2xl:inline">
                {locale.toUpperCase()} / {currency} / {unitSystem === "metric" ? "m²" : "ft²"}
              </span>
              <span className="inline 2xl:hidden">
                {locale.toUpperCase()} / {currency}
              </span>
            </NavigationMenuTrigger>
            <NavigationMenuContent className="z-50 md:left-auto md:right-0">
              <div className="w-[260px] p-4 space-y-4 bg-white rounded-lg shadow-lg border border-brand-warm/20">
                <div className="space-y-1.5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-navy/60">
                    {t("language")}
                  </h4>
                  <LanguageToggle variant="light" />
                </div>
                <hr className="border-brand-warm/40" />
                <div className="space-y-1.5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-navy/60">
                    {t("currency")}
                  </h4>
                  <CurrencyToggle variant="light" />
                </div>
                <hr className="border-brand-warm/40" />
                <div className="space-y-1.5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-navy/60">
                    Area Unit
                  </h4>
                  <UnitToggle locale={locale} />
                </div>
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
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
        "inline-flex h-8 items-center justify-center rounded-lg transition-colors whitespace-nowrap text-text-on-dark",
        "hover:bg-white/10 hover:text-white",
        "px-1.5 py-1 text-xs lg:px-1.5 lg:text-xs xl:px-2 xl:text-xs 2xl:px-2.5 2xl:text-sm 2xl:h-9",
        isActive && "border-b-2 border-brand-gold text-white rounded-none",
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
        "ml-0.5 bg-transparent border-brand-gold text-brand-gold hover:bg-brand-gold/10 hover:text-white whitespace-nowrap",
        "h-8 px-2 text-xs lg:h-8 lg:px-2 lg:text-xs xl:h-8 xl:px-2.5 xl:text-xs 2xl:h-9 2xl:px-3.5 2xl:text-sm",
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
          "text-text-on-dark hover:bg-white/10 hover:text-white whitespace-nowrap",
          "px-1.5 py-1 text-xs lg:px-1.5 lg:text-xs xl:px-2 xl:text-xs 2xl:px-2.5 2xl:text-sm",
          isActive && "border-b-2 border-brand-gold text-white rounded-none",
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
