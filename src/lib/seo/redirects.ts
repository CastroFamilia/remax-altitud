/**
 * WordPress static URL redirect map — Task 3 (Story 4.4)
 *
 * Static redirects for next.config.ts (build-time, edge-level, no DB access).
 * Dynamic property/agent redirects handled by middleware (Task 4) because
 * they require a DB lookup to resolve old IDs to new slugs.
 *
 * Performance: All entries are O(1) lookups — next.config.ts builds a
 * prefix-trie at startup; matched at the CDN/proxy layer before Node.js
 * handles the request (typically < 10ms, well within NFR26 < 50ms).
 */

export type RedirectEntry = {
  source: string;
  destination: string;
  permanent: boolean;
};

/**
 * Static WordPress → new platform redirect map.
 * All entries use permanent: true → HTTP 301.
 *
 * Property-specific redirects (/property/123 → /en/property/beautiful-home)
 * require DB access and are handled by middleware (Task 4), NOT here.
 */
export const staticRedirects: RedirectEntry[] = [
  // WordPress legacy static pages — EN
  { source: "/contact", destination: "/en/contact", permanent: true },
  { source: "/about", destination: "/en/about", permanent: true },
  { source: "/services", destination: "/en/services", permanent: true },
  { source: "/join", destination: "/en/join", permanent: true },

  // WordPress legacy static pages — ES
  { source: "/contacto", destination: "/es/contact", permanent: true },
  { source: "/nosotros", destination: "/es/about", permanent: true },
  { source: "/servicios", destination: "/es/services", permanent: true },
  { source: "/unete", destination: "/es/join", permanent: true },

  // WordPress listings index pages → EN/ES search
  { source: "/listings", destination: "/en/search", permanent: true },
  { source: "/propiedades", destination: "/es/search", permanent: true },

  // WordPress listing wildcard patterns → search (no slug mapping available yet)
  // TODO: upgrade to per-slug 301 once WordPress URL audit + mapping table is complete (R-001)
  { source: "/listings/:path*", destination: "/en/search", permanent: true },
  { source: "/propiedades/:path*", destination: "/es/search", permanent: true },

  // WordPress agent index pages
  { source: "/agents", destination: "/en/agents", permanent: true },
  { source: "/agentes", destination: "/es/agents", permanent: true },
];
