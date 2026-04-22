/**
 * Navigation data structure — shared between DesktopNav and MobileNav.
 * Labels will become i18n keys in Story 1.4.
 */

export interface NavItem {
  /** Display label (i18n key in Story 1.4) */
  label: string;
  /** Route path */
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
    label: "Properties",
    href: "/search",
    activePrefix: "/search",
    icon: "🏠",
    children: [
      { label: "Mountains (PZ)", href: "/search?region=mountain" },
      { label: "Coast (Dominical)", href: "/search?region=coast" },
      { label: "Search All Properties", href: "/search" },
    ],
  },
  {
    label: "Areas",
    href: "/areas",
    activePrefix: "/areas",
    icon: "📍",
    children: [
      { label: "Pérez Zeledón", href: "/areas/perez-zeledon" },
      { label: "Dominical", href: "/areas/dominical" },
      { label: "Uvita", href: "/areas/uvita" },
      { label: "All Areas", href: "/areas" },
      // Communities sub-group (rendered after divider in dropdown)
      {
        label: "Communities",
        href: "/communities",
        isGroup: true,
        children: [
          {
            label: "RISE",
            href: "/areas/perez-zeledon/communities/rise",
          },
          {
            label: "Santa Elena Hills",
            href: "/areas/perez-zeledon/communities/santa-elena-hills",
          },
          { label: "All Communities", href: "/communities" },
        ],
      },
    ],
  },
  {
    label: "Sell Your Property",
    href: "/sell",
    isCta: true,
    icon: "🏠",
  },
  {
    label: "About",
    href: "/about",
    icon: "👥",
  },
];

/** Mobile-only items (Our Team, Contact) — not shown in desktop nav */
export const mobileOnlyItems: NavItem[] = [
  {
    label: "Our Team",
    href: "/about/team",
    icon: "👥",
  },
  {
    label: "Contact",
    href: "/contact",
    icon: "📞",
  },
];
