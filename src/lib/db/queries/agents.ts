import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { agents } from "@/lib/db/schema/agents";
import { slugify } from "@/lib/sync/utils/slugify";
import type { RawAgent } from "@/types/remax-api";

/**
 * Upserts a single agent into the database using Drizzle's
 * `onConflictDoUpdate` on the `api_id` unique constraint.
 * On a slug uniqueness conflict, retries once with the apiId as suffix.
 *
 * AC #8 — agents from both offices upserted.
 * Note: `role` (RawAgent.role) has no DB column — silently dropped.
 * Note: `api_raw` column does not exist on agents table — omitted.
 *
 * @param raw      - Normalized agent record from the parser
 * @param officeId - UUID of the office (resolved from offices table lookup)
 */
export async function upsertAgent(raw: RawAgent, officeId: string): Promise<void> {
  const baseSlug = slugify(raw.name);
  const slugWithSuffix = slugify(raw.name, raw.apiId);

  const values = {
    apiId: raw.apiId,
    officeId,
    slug: baseSlug || raw.apiId,
    name: raw.name,
    email: raw.email ?? null,
    phone: raw.phone ?? null,
    whatsapp: raw.whatsapp ?? null,
    photoUrl: raw.photoUrl ?? null,
    languages: raw.primaryLang ? [raw.primaryLang] : [],
    specializations: [],
    isActive: true,
    syncedAt: new Date(),
  };

  const mutableSet = {
    name: values.name,
    email: values.email,
    phone: values.phone,
    whatsapp: values.whatsapp,
    photoUrl: values.photoUrl,
    languages: values.languages,
    isActive: values.isActive,
    syncedAt: values.syncedAt,
    updatedAt: new Date(),
  };

  try {
    await db.insert(agents).values(values).onConflictDoUpdate({
      target: agents.apiId,
      set: mutableSet,
    });
  } catch (err: unknown) {
    const isSlugConflict =
      err instanceof Error &&
      err.message.includes("unique") &&
      err.message.toLowerCase().includes("slug");

    if (isSlugConflict) {
      await db
        .insert(agents)
        .values({ ...values, slug: slugWithSuffix || raw.apiId })
        .onConflictDoUpdate({
          target: agents.apiId,
          set: mutableSet,
        });
    } else {
      throw err;
    }
  }
}

/**
 * Updates the denormalized `listing_count` on every agent row to reflect
 * the current count of active (is_visible=true) properties assigned to them.
 * Must be called AFTER all property upserts complete (AC #8).
 */
export async function updateAgentListingCounts(): Promise<void> {
  await db.execute(
    sql`UPDATE agents
        SET listing_count = (
          SELECT count(*)::integer
          FROM properties
          WHERE properties.agent_id = agents.id
            AND properties.is_visible = true
        )`,
  );
}
