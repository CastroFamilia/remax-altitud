import "server-only";

import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { agents } from "@/lib/db/schema/agents";
import {
  getNearestOfficeCoords,
  OFFICE_PZ_COORDS,
  OFFICE_DOMINICAL_COORDS,
} from "@/lib/constants/offices-geo";
import { getAllOffices } from "@/lib/db/queries/offices";

/**
 * Agent Routing — Story 5.3 (AC #6)
 *
 * Matches a lead's coordinates to the nearest office and returns
 * an active agent from that office (ordered by listingCount DESC).
 *
 * Fallback chain:
 *   1. coords → nearest office → first active agent
 *   2. null coords → PZ office (primary)
 *   3. no agents in matched office → try other office
 *   4. no agents at all → return null
 *
 * @returns agent ID or null
 */
export async function matchAgentByCoordinates(
  lat: number | null,
  lng: number | null,
): Promise<string | null> {
  // Determine target office coordinates
  let targetCoords: { lat: number; lng: number };

  if (lat !== null && lng !== null) {
    targetCoords = getNearestOfficeCoords(lat, lng);
  } else {
    // Fallback: default to PZ office (primary)
    targetCoords = OFFICE_PZ_COORDS;
  }

  // Find the office matching these coordinates, then get agent
  const agent = await findAgentByOfficeCoords(targetCoords);
  if (agent) return agent;

  // Fallback: try the other office
  const otherCoords =
    targetCoords.lat === OFFICE_PZ_COORDS.lat && targetCoords.lng === OFFICE_PZ_COORDS.lng
      ? OFFICE_DOMINICAL_COORDS
      : OFFICE_PZ_COORDS;

  const fallbackAgent = await findAgentByOfficeCoords(otherCoords);
  return fallbackAgent;
}

/**
 * Finds the first active agent (by listing count DESC) in the office
 * whose latitude/longitude match the given coordinates.
 * Uses getAllOffices() to find office by coords, then queries agents.
 */
async function findAgentByOfficeCoords(coords: {
  lat: number;
  lng: number;
}): Promise<string | null> {
  try {
    // Find office by matching coordinates
    const allOffices = await getAllOffices();
    const matchedOffice = allOffices.find(
      (o) => o.latitude === coords.lat && o.longitude === coords.lng,
    );

    if (!matchedOffice) return null;

    // Find first active agent from that office, ordered by listing count DESC
    const agentRows = await db
      .select({ id: agents.id })
      .from(agents)
      .where(and(eq(agents.officeId, matchedOffice.id), eq(agents.isActive, true)))
      .orderBy(desc(agents.listingCount))
      .limit(1);

    return agentRows.length > 0 ? agentRows[0].id : null;
  } catch {
    // If DB is unavailable, return null gracefully
    return null;
  }
}
