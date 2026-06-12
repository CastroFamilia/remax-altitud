/**
 * Navigation data structure — shared between DesktopNav and MobileNav.
 * Labels resolve through `useTranslations('Navigation')` / `t(labelKey)`.
 */

export interface NavItem {
  /** i18n message key within the "Navigation" namespace */
  labelKey: string;
  /** Route path (locale prefix added automatically by `@/i18n/navigation` Link) */
  href: string;
  /** Path prefix to match for active state (e.g., "/areas") */
  activePrefix?: string;
  /** Dropdown items (desktop only, max 4) */
  children?: NavItem[];
  /** True for "Sell" — triggers accent styling */
  isCta?: boolean;
  /** Emoji or lucide icon name (mobile only) */
  icon?: string;
  /** True for divider-separated groups (e.g., Communities section) */
  isGroup?: boolean;
}

export const mainNavItems: NavItem[] = [
  {
    labelKey: "properties",
    href: "/search",
    activePrefix: "/search",
    icon: "🏠",
    children: [
      { labelKey: "mountainsPZ", href: "/search?region=mountain" },
      { labelKey: "coastDominical", href: "/search?region=coast" },
      { labelKey: "searchAll", href: "/search" },
    ],
  },
  {
    labelKey: "areas",
    href: "/areas",
    activePrefix: "/areas",
    icon: "📍",
    children: [
      { labelKey: "perezZeledon", href: "/areas/perez-zeledon" },
      { labelKey: "dominical", href: "/areas/dominical" },
      { labelKey: "uvita", href: "/areas/uvita" },
      // Communities sub-group (rendered after divider in dropdown)
      {
        labelKey: "communities",
        href: "/communities",
        isGroup: true,
        children: [
          {
            labelKey: "rise",
            href: "/areas/perez-zeledon/communities/rise",
          },
          {
            labelKey: "santaElenaHills",
            href: "/areas/perez-zeledon/communities/santa-elena-hills",
          },
          { labelKey: "allCommunities", href: "/communities" },
        ],
      },
    ],
  },
  {
    labelKey: "vipBuyerService",
    href: "/find-your-dream-property",
    activePrefix: "/find-your-dream-property",
    icon: "✨",
  },
  {
    labelKey: "sellYourProperty",
    href: "/sell",
    isCta: true,
    icon: "🏠",
  },
  {
    labelKey: "about",
    href: "/about",
    icon: "👥",
  },
  {
    labelKey: "ourAgents",
    href: "/agents",
    activePrefix: "/agents",
    icon: "🤝",
  },
  {
    labelKey: "blog",
    href: "/blog",
    activePrefix: "/blog",
    icon: "📝",
  },
];

/** Mobile-only items (Our Team, Contact) — not shown in desktop nav */
export const mobileOnlyItems: NavItem[] = [
  {
    labelKey: "ourAgents",
    href: "/agents",
    activePrefix: "/agents",
    icon: "🤝",
  },
  {
    labelKey: "ourTeam",
    href: "/about/team",
    icon: "👥",
  },
  {
    labelKey: "contact",
    href: "/contact",
    icon: "📞",
  },
  {
    labelKey: "faq",
    href: "/faq",
    icon: "❓",
  },
];
