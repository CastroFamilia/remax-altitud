import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { agents } from "@/lib/db/schema/agents";
import { slugify } from "@/lib/sync/utils/slugify";
import type { RawAgent } from "@/types/remax-api";
import { mapPropertyRowToSearchItem } from "./properties";
import { AGENT_LANGUAGE_OVERRIDES, normalizeAgentName } from "@/lib/constants/agent-overrides";

export function getAgentLanguages(name: string, fallbackLang: string | null): string[] {
  const normalized = normalizeAgentName(name);
  const override = AGENT_LANGUAGE_OVERRIDES[normalized];
  if (override) return override;
  return fallbackLang ? [fallbackLang] : [];
}

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

  const normalizedName = normalizeAgentName(raw.name);
  const resolvedLanguages =
    AGENT_LANGUAGE_OVERRIDES[normalizedName] || (raw.primaryLang ? [raw.primaryLang] : []);

  const values = {
    apiId: raw.apiId,
    officeId,
    slug: baseSlug || raw.apiId,
    name: raw.name,
    email: raw.email ?? null,
    phone: raw.phone ?? null,
    whatsapp: raw.whatsapp ?? null,
    photoUrl: raw.photoUrl ?? null,
    languages: resolvedLanguages,
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
    languages: resolvedLanguages,
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
 * Fetches a single agent by their UUID.
 * Used by the listing detail page to resolve the property's assigned agent.
 * Returns null if no agent with that ID exists.
 *
 * Story 4.1, Task 3.
 *
 * @param id - Agent UUID (not api_id)
 */
export async function getAgentById(id: string) {
  const rows = await db.select().from(agents).where(eq(agents.id, id)).limit(1);
  return rows[0] ?? null;
}

/**
 * Fetches all active agents ordered by listing count descending.
 * Used by the agents index page (AC #4) and generateStaticParams.
 */
export async function getAllAgents() {
  return db
    .select()
    .from(agents)
    .where(eq(agents.isActive, true))
    .orderBy(desc(agents.listingCount));
}

/**
 * Fetches a single agent by their URL slug.
 * Used by the agent profile page. Returns null if not found or inactive.
 * Does NOT filter by isActive so soft-deletes show a proper "no longer available" page.
 */
export async function getAgentBySlug(slug: string) {
  const rows = await db.select().from(agents).where(eq(agents.slug, slug)).limit(1);
  return rows[0] ?? null;
}

/**
 * Fetches all active agent slugs for SSG build-time generation.
 * Used by generateStaticParams in the agent profile page (AC #6, NFR25).
 */
export async function getAllAgentSlugs(): Promise<string[]> {
  const rows = await db.select({ slug: agents.slug }).from(agents).where(eq(agents.isActive, true));
  return rows.map((r) => r.slug);
}

/**
 * Fetches all visible properties for a given agent, ordered by syncedAt DESC.
 * Returns fields matching the PropertySearchItem interface shape
 * (src/types/search.ts) so results can be passed to PropertyCard.
 * Used by the agent profile page (AC #2, FR39).
 *
 * @param agentId - The agent's UUID (not apiId or slug)
 */
export async function getPropertiesByAgentId(agentId: string) {
  // Dynamic import to avoid circular dependency:
  // properties.ts schema imports agents.ts at line 14
  const { properties } = await import("@/lib/db/schema/properties");
  const rows = await db
    .select({
      id: properties.id,
      slug: properties.slug,
      titleEn: properties.titleEn,
      titleEs: properties.titleEs,
      priceUsd: properties.priceUsd,
      bedrooms: properties.bedrooms,
      bathrooms: properties.bathrooms,
      lotSizeM2: properties.lotSizeM2,
      constructionM2: properties.constructionM2,
      zmtStatus: properties.zmtStatus,
      propertyType: properties.propertyType,
      status: properties.status,
      areaSlug: properties.areaSlug,
      images: properties.images,
      latitude: properties.latitude,
      longitude: properties.longitude,
    })
    .from(properties)
    .where(and(eq(properties.agentId, agentId), eq(properties.isVisible, true)))
    .orderBy(desc(properties.syncedAt));

  return rows.map((row) => mapPropertyRowToSearchItem(row));
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
