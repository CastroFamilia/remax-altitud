/**
 * Sorts an array of community objects dynamically based on the user-specified custom order.
 * Order: RISE, Santa Elena Hills, Harmony Heights, SERENA, Residencial La Piedra, Villas San Miguel
 *
 * This utility is client-safe (no "server-only" imports) so it can be used in both
 * Server Components and Client Components (like swipers and sliders).
 */
export function sortCommunitiesCustom<T extends { slug: string }>(items: T[]): T[] {
  const order = [
    "rise-costa-rica",
    "santa-elena-hills",
    "harmony-heights",
    "serena-san-mateo",
    "residencial-la-piedra",
    "villas-san-miguel"
  ];
  return [...items].sort((a, b) => {
    let idxA = order.indexOf(a.slug);
    let idxB = order.indexOf(b.slug);
    if (idxA === -1) idxA = 999;
    if (idxB === -1) idxB = 999;
    return idxA - idxB;
  });
}
