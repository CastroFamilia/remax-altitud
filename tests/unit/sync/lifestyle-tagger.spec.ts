/**
 * ATDD Scaffolds — Story 2.6: Lifestyle Tag Auto-Tagging (RED PHASE)
 * Module: src/lib/sync/lifestyle-tagger.ts
 *
 * Covers:
 *   AC #1 — lifestyle tags auto-assigned from configurable rules in lifestyle-tags.ts
 *   AC #2 — Condo in tourist zone → "Rental Potential"
 *   AC #3 — Large lot (lotSizeM2 ≥ 5000) → "Investment Property"
 *   AC #4 — "retirement" in description (case-insensitive) → "Retire"
 *   AC #5 — multiple rules → all matching tags applied, deduplicated
 *   AC #6 — new rule config takes effect without other code changes (architecture test)
 *   AC #7 — manual override tags PRESERVED on re-sync (Risk R-006, P0)
 *   AC #8 — UNCHANGED listings skipped (NFR15 — zero DB writes for unchanged)
 *   tagBatch — batch contract: TaggingResult per input, tagged=true only when new tags added
 *   Deduplication — same tag from two rules stored only once
 *
 * All tests are scaffolded as it.skip() (TDD RED PHASE).
 * The dev agent removes it.skip() task-by-task during implementation.
 *
 * No external I/O or DB — lifestyle-tagger.ts is synchronous pure functions.
 * Uses makeRawProperty() factory from ./factories.ts — do NOT redefine it.
 */

import { describe, expect, it } from "vitest";
import { makeRawProperty } from "./factories";

// ---------------------------------------------------------------------------
// Imports — will fail until src/lib/sync/lifestyle-tagger.ts is created (RED)
// ---------------------------------------------------------------------------

import { applyLifestyleTags, tagBatch } from "@/lib/sync/lifestyle-tagger";
import { LIFESTYLE_TAG_RULES } from "@/lib/constants/lifestyle-tags";

// ---------------------------------------------------------------------------
// AC #1 + AC #2 — Condo in tourist zone → "Rental Potential"
// ---------------------------------------------------------------------------

describe("applyLifestyleTags — Condo → 'Rental Potential' (AC #1, #2)", () => {
  it(
    "[P1] given propertyTypeEn='Condo' when applyLifestyleTags called then result includes 'Rental Potential'",
    () => {
      // AC #2 — condo property type triggers the Rental Potential rule
      // Architecture §5: LIFESTYLE-TAG step applies configurable attribute rules
      const raw = makeRawProperty({ propertyTypeEn: "Condo" });

      const result = applyLifestyleTags(raw, []);

      expect(result).toContain("Rental Potential");
    },
  );

  it(
    "[P1] given propertyTypeEn='Luxury Condo' (contains 'condo') when called then result includes 'Rental Potential'",
    () => {
      // AC #2 — case-insensitive substring match on 'condo'
      const raw = makeRawProperty({ propertyTypeEn: "Luxury Condo" });

      const result = applyLifestyleTags(raw, []);

      expect(result).toContain("Rental Potential");
    },
  );

  it(
    "[P1] given propertyTypeEn='House' (not a condo) when called then result does NOT include 'Rental Potential'",
    () => {
      // AC #2 negative — non-condo property types must NOT receive this tag
      const raw = makeRawProperty({ propertyTypeEn: "House" });

      const result = applyLifestyleTags(raw, []);

      expect(result).not.toContain("Rental Potential");
    },
  );
});

// ---------------------------------------------------------------------------
// AC #1 + AC #3 — Large lot/land ≥ 5000m² → "Investment Property"
// ---------------------------------------------------------------------------

describe("applyLifestyleTags — large lot → 'Investment Property' (AC #1, #3)", () => {
  it(
    "[P1] given propertyTypeEn='Lot/Land' and lotSizeM2=5000 when called then result includes 'Investment Property'",
    () => {
      // AC #3 — lot/land at exactly the threshold (≥ 5000m²)
      const raw = makeRawProperty({ propertyTypeEn: "Lot/Land", lotSizeM2: 5000 });

      const result = applyLifestyleTags(raw, []);

      expect(result).toContain("Investment Property");
    },
  );

  it(
    "[P1] given propertyTypeEn='Lot/Land' and lotSizeM2=14757 when called then result includes 'Investment Property'",
    () => {
      // AC #3 — lot/land well above threshold
      const raw = makeRawProperty({ propertyTypeEn: "Lot/Land", lotSizeM2: 14757 });

      const result = applyLifestyleTags(raw, []);

      expect(result).toContain("Investment Property");
    },
  );

  it(
    "[P1] given propertyTypeEn='Lot/Land' and lotSizeM2=4999 when called then result does NOT include 'Investment Property'",
    () => {
      // AC #3 boundary — just below threshold must NOT match
      const raw = makeRawProperty({ propertyTypeEn: "Lot/Land", lotSizeM2: 4999 });

      const result = applyLifestyleTags(raw, []);

      expect(result).not.toContain("Investment Property");
    },
  );

  it(
    "[P1] given propertyTypeEn='House' and lotSizeM2=10000 when called then result does NOT include 'Investment Property'",
    () => {
      // AC #3 — large lot but NOT lot/land type: rule must not fire on houses
      const raw = makeRawProperty({ propertyTypeEn: "House", lotSizeM2: 10000 });

      const result = applyLifestyleTags(raw, []);

      expect(result).not.toContain("Investment Property");
    },
  );

  it(
    "[P1] given propertyTypeEn='Land' (contains 'land') and lotSizeM2=6000 when called then result includes 'Investment Property'",
    () => {
      // AC #3 — 'Land' is a recognized variant (architecture note)
      const raw = makeRawProperty({ propertyTypeEn: "Land", lotSizeM2: 6000 });

      const result = applyLifestyleTags(raw, []);

      expect(result).toContain("Investment Property");
    },
  );

  it(
    "[P1] given propertyTypeEn='Lot/Land' and lotSizeM2=null when called then result does NOT include 'Investment Property'",
    () => {
      // AC #3 — null lot size must not throw and must not match
      const raw = makeRawProperty({ propertyTypeEn: "Lot/Land", lotSizeM2: null });

      const result = applyLifestyleTags(raw, []);

      expect(result).not.toContain("Investment Property");
    },
  );
});

// ---------------------------------------------------------------------------
// AC #1 + AC #4 — "retirement" in description → "Retire"
// ---------------------------------------------------------------------------

describe("applyLifestyleTags — 'retirement' keyword → 'Retire' (AC #1, #4)", () => {
  it(
    "[P1] given publicRemarksEn='Perfect retirement home with mountain views' when called then result includes 'Retire'",
    () => {
      // AC #4 — 'retirement' substring (case-insensitive) in publicRemarksEn
      // Architecture §5 example: "House with 'retirement' in description → 'Retire'"
      const raw = makeRawProperty({
        propertyTypeEn: "House",
        publicRemarksEn: "Perfect retirement home with mountain views",
        lotSizeM2: 100,
      });

      const result = applyLifestyleTags(raw, []);

      expect(result).toContain("Retire");
    },
  );

  it(
    "[P1] given publicRemarksEn='RETIREMENT community near beach' (uppercase) when called then result includes 'Retire'",
    () => {
      // AC #4 — case-insensitive match
      const raw = makeRawProperty({
        propertyTypeEn: "House",
        publicRemarksEn: "RETIREMENT community near beach",
        lotSizeM2: 100,
      });

      const result = applyLifestyleTags(raw, []);

      expect(result).toContain("Retire");
    },
  );

  it(
    "[P1] given publicRemarksEn='Great investment property' (no 'retirement') when called then result does NOT include 'Retire'",
    () => {
      // AC #4 negative — no keyword → no tag
      const raw = makeRawProperty({
        propertyTypeEn: "House",
        publicRemarksEn: "Great investment property near amenities",
        lotSizeM2: 100,
      });

      const result = applyLifestyleTags(raw, []);

      expect(result).not.toContain("Retire");
    },
  );

  it(
    "[P1] given publicRemarksEn=null when called then result does NOT include 'Retire' and no exception thrown",
    () => {
      // AC #4 — null remarks must be handled safely (no crash)
      const raw = makeRawProperty({
        propertyTypeEn: "House",
        publicRemarksEn: null,
        lotSizeM2: 100,
      });

      expect(() => applyLifestyleTags(raw, [])).not.toThrow();
      const result = applyLifestyleTags(raw, []);
      expect(result).not.toContain("Retire");
    },
  );
});

// ---------------------------------------------------------------------------
// AC #5 — multiple rules → all matching tags applied, deduplicated
// ---------------------------------------------------------------------------

describe("applyLifestyleTags — multiple matching rules → all tags, deduplicated (AC #5)", () => {
  it(
    "[P1] given a Condo with 'retirement' in description when called then result includes both 'Rental Potential' AND 'Retire'",
    () => {
      // AC #5 — a single property matching multiple rules receives all applicable tags
      const raw = makeRawProperty({
        propertyTypeEn: "Condo",
        publicRemarksEn: "Great condo in a retirement community",
        lotSizeM2: 200,
      });

      const result = applyLifestyleTags(raw, []);

      expect(result).toContain("Rental Potential");
      expect(result).toContain("Retire");
    },
  );

  it(
    "[P1] given existingTags=['Rental Potential'] and a condo (rule also emits 'Rental Potential') when called then 'Rental Potential' appears only once (deduplication of existing + auto-tag)",
    () => {
      // AC #5 deduplication — the Set-based merge must not duplicate a tag that arrives from
      // both existingTags AND a matching rule. This directly exercises the deduplication path:
      //   [...new Set([...existingTags, ...newTags])]
      // The condo rule fires and emits "Rental Potential"; existingTags also contains it.
      // Result must contain it exactly once.
      const raw = makeRawProperty({
        propertyTypeEn: "Condo",
        publicRemarksEn: "Nice condo listing",
        lotSizeM2: 200,
      });

      const result = applyLifestyleTags(raw, ["Rental Potential"]);

      // Count occurrences — must appear exactly once even though both sources supply it
      const rentalCount = result.filter((t) => t === "Rental Potential").length;
      expect(rentalCount).toBe(1);
    },
  );
});

// ---------------------------------------------------------------------------
// AC #7 — manual override tags PRESERVED (Risk R-006, P0)
// ---------------------------------------------------------------------------

describe("applyLifestyleTags — manual override preservation (AC #7, Risk R-006)", () => {
  it(
    "[P0] given existingTags=['Vacation Home'] (admin-set) when applyLifestyleTags called then 'Vacation Home' is preserved in result",
    () => {
      // AC #7 — FR49: preserve manual overrides — auto-tagging only ADDS tags, never removes
      // Risk R-006: "Lifestyle tag manual overrides reset on re-sync" — P0, must test
      const raw = makeRawProperty({
        propertyTypeEn: "House",
        publicRemarksEn: "Beautiful mountain house",
        lotSizeM2: 100,
      });

      const result = applyLifestyleTags(raw, ["Vacation Home"]);

      expect(result).toContain("Vacation Home");
    },
  );

  it(
    "[P0] given existingTags=['Vacation Home'] and a condo when called then result contains BOTH 'Vacation Home' AND 'Rental Potential'",
    () => {
      // AC #7 — manual tag preserved AND new auto-tag added (union, not replace)
      const raw = makeRawProperty({
        propertyTypeEn: "Condo",
        publicRemarksEn: "Beautiful condo",
        lotSizeM2: 200,
      });

      const result = applyLifestyleTags(raw, ["Vacation Home"]);

      expect(result).toContain("Vacation Home");
      expect(result).toContain("Rental Potential");
    },
  );

  it(
    "[P0] given existingTags=['Rental Potential'] (already has the auto-tag) when called then 'Rental Potential' appears only once (deduplication)",
    () => {
      // AC #7 + AC #5 — existing tag that also matches a rule must appear only once
      const raw = makeRawProperty({
        propertyTypeEn: "Condo",
        publicRemarksEn: "A condo",
        lotSizeM2: 200,
      });

      const result = applyLifestyleTags(raw, ["Rental Potential"]);

      const count = result.filter((t) => t === "Rental Potential").length;
      expect(count).toBe(1);
    },
  );

  it(
    "[P0] given existingTags=['Vacation Home'] and a property matching NO rules when called then result equals ['Vacation Home'] unchanged",
    () => {
      // AC #7 — if no new rules fire, existing tags returned unchanged (no-op)
      const raw = makeRawProperty({
        propertyTypeEn: "House",
        publicRemarksEn: "A regular house with no matching keywords",
        lotSizeM2: 100,
      });

      const result = applyLifestyleTags(raw, ["Vacation Home"]);

      expect(result).toEqual(["Vacation Home"]);
    },
  );

  it(
    "[P1] given existingTags=[] and a property matching no rules when called then result is empty array",
    () => {
      // AC #7 — no existing tags, no matching rules → empty result
      const raw = makeRawProperty({
        propertyTypeEn: "House",
        publicRemarksEn: "A simple house",
        lotSizeM2: 100,
      });

      const result = applyLifestyleTags(raw, []);

      expect(result).toEqual([]);
    },
  );
});

// ---------------------------------------------------------------------------
// AC #6 — rule-driven architecture: configurable without other code changes
// ---------------------------------------------------------------------------

describe("applyLifestyleTags — rule-driven architecture (AC #6)", () => {
  it(
    "[P1] given LIFESTYLE_TAG_RULES array when examined then each rule has a 'tag' string and a 'match' function",
    () => {
      // AC #6 — rules are data: adding a new rule to lifestyle-tags.ts requires zero other changes
      // This test validates the LIFESTYLE_TAG_RULES export contract
      // We import from constants to verify the architecture (rules live outside lifestyle-tagger.ts)
      expect(Array.isArray(LIFESTYLE_TAG_RULES)).toBe(true);
      expect(LIFESTYLE_TAG_RULES.length).toBeGreaterThan(0);

      for (const rule of LIFESTYLE_TAG_RULES) {
        expect(typeof rule.tag).toBe("string");
        expect(typeof rule.match).toBe("function");
      }
    },
  );
});

// ---------------------------------------------------------------------------
// tagBatch — batch contract (Task 6)
// ---------------------------------------------------------------------------

describe("tagBatch — batch processing contract", () => {
  it(
    "[P0] given empty array when tagBatch called then returns empty array",
    () => {
      // Boundary: empty input → empty output
      const result = tagBatch([]);

      expect(result).toEqual([]);
    },
  );

  it(
    "[P0] given batch of 2 properties when tagBatch called then returns one TaggingResult per input",
    () => {
      // tagBatch contract: one result per input item
      const props = [
        { raw: makeRawProperty({ apiId: "P1", propertyTypeEn: "House", lotSizeM2: 100 }), existingTags: [] },
        { raw: makeRawProperty({ apiId: "P2", propertyTypeEn: "Condo", lotSizeM2: 200 }), existingTags: [] },
      ];

      const results = tagBatch(props);

      expect(results).toHaveLength(2);
      expect(results[0].apiId).toBe("P1");
      expect(results[1].apiId).toBe("P2");
    },
  );

  it(
    "[P0] given a condo property when tagBatch called then result.tagged=true and result.tags includes 'Rental Potential'",
    () => {
      // tagBatch: tagged=true when new tags are added (tags.length > existingTags.length)
      const props = [
        { raw: makeRawProperty({ apiId: "C1", propertyTypeEn: "Condo", lotSizeM2: 200 }), existingTags: [] },
      ];

      const results = tagBatch(props);

      expect(results[0].tagged).toBe(true);
      expect(results[0].tags).toContain("Rental Potential");
    },
  );

  it(
    "[P0] given a house matching no rules when tagBatch called then result.tagged=false",
    () => {
      // tagBatch: tagged=false when no new tags are added
      const props = [
        {
          raw: makeRawProperty({ apiId: "H1", propertyTypeEn: "House", lotSizeM2: 100, publicRemarksEn: "Nice house" }),
          existingTags: [],
        },
      ];

      const results = tagBatch(props);

      expect(results[0].tagged).toBe(false);
      expect(results[0].tags).toEqual([]);
    },
  );

  it(
    "[P1] given mixed batch (1 matching, 1 not) when tagBatch called then tagged flags reflect each item independently",
    () => {
      // tagBatch: independence of items — one match doesn't affect the other
      const props = [
        { raw: makeRawProperty({ apiId: "MATCH", propertyTypeEn: "Condo", lotSizeM2: 200 }), existingTags: [] },
        {
          raw: makeRawProperty({ apiId: "NOMATCH", propertyTypeEn: "House", lotSizeM2: 100, publicRemarksEn: "Simple house" }),
          existingTags: [],
        },
      ];

      const results = tagBatch(props);

      const matchResult = results.find((r) => r.apiId === "MATCH")!;
      const noMatchResult = results.find((r) => r.apiId === "NOMATCH")!;

      expect(matchResult.tagged).toBe(true);
      expect(noMatchResult.tagged).toBe(false);
    },
  );

  it(
    "[P1] given property with existingTags=['Vacation Home'] and no new rules match when tagBatch called then tagged=false and tags=['Vacation Home']",
    () => {
      // tagBatch: tagged=false when tags.length equals existingTags.length (no new additions)
      const props = [
        {
          raw: makeRawProperty({ apiId: "EXISTING", propertyTypeEn: "House", lotSizeM2: 100, publicRemarksEn: "Simple house" }),
          existingTags: ["Vacation Home"],
        },
      ];

      const results = tagBatch(props);

      expect(results[0].tagged).toBe(false);
      expect(results[0].tags).toContain("Vacation Home");
    },
  );

  it(
    "[P1] given a condo with existingTags=['Vacation Home'] when tagBatch called then tagged=true and tags contains both 'Vacation Home' and 'Rental Potential'",
    () => {
      // tagBatch: tagged=true when new tags are added on top of existing ones
      const props = [
        {
          raw: makeRawProperty({ apiId: "MERGE", propertyTypeEn: "Condo", lotSizeM2: 200 }),
          existingTags: ["Vacation Home"],
        },
      ];

      const results = tagBatch(props);

      expect(results[0].tagged).toBe(true);
      expect(results[0].tags).toContain("Vacation Home");
      expect(results[0].tags).toContain("Rental Potential");
    },
  );

  it(
    "[P1] tagBatch is synchronous — returns a plain array (not a Promise)",
    () => {
      // Architecture: tagBatch must NOT be async (pure rule evaluation, no I/O)
      // AC #10 / architecture note: "Synchronous (no async — pure rule evaluation, no I/O)"
      const props = [
        { raw: makeRawProperty({ apiId: "SYNC", propertyTypeEn: "House", lotSizeM2: 100 }), existingTags: [] },
      ];

      const result = tagBatch(props);

      // If tagBatch were async, result would be a Promise — we verify it is not
      expect(result).not.toBeInstanceOf(Promise);
      expect(Array.isArray(result)).toBe(true);
    },
  );
});

// ---------------------------------------------------------------------------
// TaggingResult shape validation
// ---------------------------------------------------------------------------

describe("tagBatch — TaggingResult shape", () => {
  it(
    "[P1] given any property when tagBatch called then each result has apiId, tags (array), and tagged (boolean) fields",
    () => {
      // Validates TaggingResult interface contract
      const props = [
        { raw: makeRawProperty({ apiId: "SHAPE-TEST", propertyTypeEn: "House", lotSizeM2: 100 }), existingTags: [] },
      ];

      const results = tagBatch(props);

      expect(results[0]).toMatchObject({
        apiId: expect.any(String),
        tags: expect.any(Array),
        tagged: expect.any(Boolean),
      });
    },
  );
});
