/**
 * WordPress static URL redirect map — Task 3 (Story 4.4)
 *
 * Stub file created for ATDD red-phase test compilation.
 * Implementations are filled in during the dev phase.
 *
 * Static redirects for next.config.ts (build-time, edge-level, no DB access).
 * Dynamic property/agent redirects handled by middleware (Task 4).
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
 * TODO: Implement in Task 3 (Story 4.4) — populate with staticRedirects array
 */
export const staticRedirects: RedirectEntry[] = [
  // TODO: Implement full redirect map in Task 3
];
