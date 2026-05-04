import "server-only";
/**
 * Lifestyle Tag Auto-Tagging module.
 * Architecture §3: src/lib/sync/lifestyle-tagger.ts — "Auto lifestyle tag assignment"
 * Architecture §5 Step 6: GEO-TAG + LIFESTYLE-TAG with configurable rules.
 *
 * All functions are synchronous (no I/O, no DB calls — pure rule evaluation).
 * DB access lives in pipeline.ts and queries/properties.ts.
 *
 * AC #1–#8: auto-assigns lifestyle tags from LIFESTYLE_TAG_RULES,
 *            preserves manual overrides, skips UNCHANGED (NFR15).
 */

import { LIFESTYLE_TAG_RULES } from "@/lib/constants/lifestyle-tags";
import type { RawProperty } from "@/types/remax-api";

/**
 * Result of tagging a single property.
 * `tagged` is true when at least one new tag was added (tags.length > existingTags.length).
 */
export interface TaggingResult {
  apiId: string;
  tags: string[];
  tagged: boolean;
}

/**
 * Applies all LIFESTYLE_TAG_RULES to `raw`, then merges matching tags
 * with `existingTags` (preserving manual overrides — FR49 AC #7).
 *
 * Returns a deduplicated union of existingTags and newly matched tags.
 * If no new rules match, returns existingTags unchanged (no-op).
 *
 * @param raw          - Raw property record (from the sync API)
 * @param existingTags - Tags already stored in the DB (admin-set or auto-tagged)
 * @returns            Deduplicated merged tag array
 */
export function applyLifestyleTags(raw: RawProperty, existingTags: string[]): string[] {
  const newTags = LIFESTYLE_TAG_RULES.filter((rule) => rule.match(raw)).map((rule) => rule.tag);

  if (newTags.length === 0) {
    return existingTags;
  }

  // Merge: preserve existingTags (manual overrides), add new auto-tags, deduplicate
  return [...new Set([...existingTags, ...newTags])];
}

/**
 * Applies lifestyle tagging to a batch of properties.
 * Synchronous — pure rule evaluation, no I/O (Architecture: no async).
 *
 * @param properties - Array of { raw, existingTags } input items
 * @returns          One TaggingResult per input item
 */
export function tagBatch(
  properties: Array<{ raw: RawProperty; existingTags: string[] }>,
): TaggingResult[] {
  return properties.map(({ raw, existingTags }) => {
    const tags = applyLifestyleTags(raw, existingTags);
    return {
      apiId: raw.apiId,
      tags,
      tagged: tags.length > existingTags.length,
    };
  });
}
