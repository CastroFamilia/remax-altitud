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
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { mainNavItems, mobileOnlyItems, type NavItem } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { CurrencyToggle } from "@/components/layout/currency-toggle";
import { UnitToggle } from "@/components/layout/unit-toggle";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";

/** A logical section of items shown under a labelled heading in the mobile menu */
interface MobileNavSection {
  /** i18n key for the section heading, or null for standalone items */
  headingKey: string | null;
  items: NavItem[];
}

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("Navigation");
  const tMobile = useTranslations("MobileNav");

  // Close sheet on route change (Next.js client-side navigation)
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Build grouped sections for mobile nav
  const sections = buildMobileSections(mainNavItems);

  return (
    <div className="lg:hidden">
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
            {sections.map((section, idx) => (
              <div key={idx}>
                {/* Divider before every section except the first */}
                {idx > 0 && <hr className="my-3 border-brand-warm" />}

                {/* Section heading */}
                {section.headingKey && (
                  <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    {t(section.headingKey)}
                  </p>
                )}

                <ul className="flex flex-col gap-1">
                  {section.items.map((item) => (
                    <MobileNavItem key={item.href} item={item} pathname={pathname} t={t} />
                  ))}
                </ul>
              </div>
            ))}

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

          <SheetFooter className="border-t border-brand-warm px-4 pt-4 flex flex-col gap-4">
            <div className="flex flex-row items-center justify-between w-full">
              <LanguageToggle variant="light" />
              <CurrencyToggle variant="light" />
            </div>
            <div className="flex flex-row items-center justify-center w-full">
              <UnitToggle locale={locale} />
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

/**
 * Build the mobile nav as a list of labelled sections with dividers.
 *
 * Structure produced:
 *   [Properties section]  — Mountains / Coast / All
 *   [Areas section]       — Pérez Zeledón / Dominical / Uvita
 *   [Communities section] — Rise / Santa Elena Hills / All communities
 *   [standalone items]    — VIP Buyer Service / About / Blog
 */
function buildMobileSections(items: NavItem[]): MobileNavSection[] {
  const sections: MobileNavSection[] = [];
  const standaloneItems: NavItem[] = [];

  for (const item of items) {
    if (item.isCta) continue; // CTA rendered separately

    if (item.children) {
      // Separate regular children from isGroup children
      const regularChildren: NavItem[] = [];
      const groupSections: MobileNavSection[] = [];

      for (const child of item.children) {
        if (child.isGroup && child.children) {
          // Becomes its own section (e.g. Communities)
          groupSections.push({
            headingKey: child.labelKey,
            items: child.children.map((gc) => ({ ...gc })),
          });
        } else {
          regularChildren.push({ ...child, icon: child.icon || item.icon });
        }
      }

      if (regularChildren.length > 0) {
        sections.push({ headingKey: item.labelKey, items: regularChildren });
      }
      sections.push(...groupSections);
    } else {
      standaloneItems.push(item);
    }
  }

  // Standalone items (VIP, About, Blog) go in a single un-labelled section
  if (standaloneItems.length > 0) {
    sections.push({ headingKey: null, items: standaloneItems });
  }

  return sections;
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
