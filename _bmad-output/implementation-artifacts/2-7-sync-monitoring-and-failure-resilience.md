# Story 2.7: Sync Monitoring & Failure Resilience

Status: ready-for-dev

## Story

As an **admin**,
I want to be alerted when sync fails and confident the site still works,
so that data issues never take the website down.

## Acceptance Criteria

1. **Given** the sync pipeline fails **When** all 3 retries are exhausted **Then** an automated alert is sent to admin (email or Slack webhook) — (FR51, NFR17).

2. **Given** the API is unreachable **When** the sync cannot complete **Then** the site continues serving existing listings from the database with no visitor-facing errors — (FR52, NFR18).

3. **Given** a listing is removed from the API **When** detected during sync diff **Then** it is hidden from search results (`is_visible = false`) but its URL still resolves to a "No longer available" page with similar properties — (FR53).

4. **Given** the sync completes successfully **When** new/updated properties exist **Then** ISR on-demand revalidation fires for affected pages via `/api/revalidate` — (AR6).

5. **Given** the `sync_logs` table **When** an admin checks **Then** they can see timestamps, counts, status, and error details for each sync run (the table already has all necessary columns — no new columns needed in this story).

6. **Given** sync failure **When** the site is checked by a visitor **Then** all existing listings remain accessible with zero downtime (NFR18).

## Tasks / Subtasks

- [ ] Task 1: Create `src/lib/sync/alert.ts` (AC: #1, #6)
  - [ ] Add `import "server-only"` at the very top (Architecture §3 — all `src/lib/sync/**` modules require this).
  - [ ] Export `async function sendSyncFailureAlert(errorMessage: string): Promise<void>`.
  - [ ] **Primary channel:** Send HTTP POST to `process.env.ALERT_SLACK_WEBHOOK` (if set) with JSON body `{ text: "[remax-altitud] Sync failure: <errorMessage>" }`.
  - [ ] **Fallback channel:** If `ALERT_SLACK_WEBHOOK` is not set, log a structured warning via `console.warn("[sync/alert] No alert channel configured. Sync failure:", errorMessage)` — this is not an error, just a graceful degradation.
  - [ ] **Email note:** Architecture §11 specifies email + WhatsApp; however, there is NO email service (Resend/SendGrid/Nodemailer) in the project dependencies. The `.env.example` has NO SMTP/email keys. Implement Slack webhook as the primary channel; add a TODO comment for future email integration once an email service is chosen.
  - [ ] Wrap the fetch call in try/catch — alert failure must NEVER throw and must NEVER crash the sync pipeline.
  - [ ] Return `void` even on send failure (swallow alerting errors, log them only).

- [ ] Task 2: Integrate `alert.ts` into `src/lib/sync/pipeline.ts` (AC: #1)
  - [ ] Import `sendSyncFailureAlert` from `./alert`.
  - [ ] In the `catch (err)` block (bottom of `runSyncPipeline`), after `await updateSyncLog(logId, { status: "failure", ... })`, call `await sendSyncFailureAlert(message)`.
  - [ ] **Order matters:** `updateSyncLog` first (persists failure state), then `sendSyncFailureAlert` (best-effort notification), then `throw err` (re-throw as before).
  - [ ] Do NOT change any other logic in the try block — partial sync failures (status="partial") do NOT trigger an alert; only uncaught exceptions do.

- [ ] Task 3: Implement "No longer available" property page (AC: #3)
  - [ ] Create `src/app/[locale]/property/[slug]/page.tsx` with an ISR-aware Server Component.
  - [ ] Call `setRequestLocale(locale)` (import from `"next-intl/server"`) — required for next-intl static rendering; all `[locale]/` pages must call this.
  - [ ] Export `async function generateMetadata({ params })` returning `Metadata` with `robots: { index: false }` for soft-deleted properties (see pattern: `src/app/[locale]/contact/page.tsx`). For unknown slugs return empty metadata.
  - [ ] **Fetch logic:** Query DB for property by slug. If `isVisible = false` (soft-deleted), render a "No longer available" page (do NOT call `notFound()`). If property not found at all, call `notFound()`.
  - [ ] **"No longer available" page content (minimum):**
    - Heading: "This property is no longer available."
    - Sub-copy: "It may have been sold or removed from listings."
    - "Browse similar properties" CTA linking to `/[locale]/search` (placeholder — `/search` route is Epic 3 Story 3.1; link is correct but the page won't exist yet).
    - Use existing layout: `import { SimplePageLayout } from "@/components/layout/simple-page-layout"` (same as `contact/page.tsx`, `services/page.tsx`).
    - Use `getTranslations` (NOT `useTranslations` — this is a Server Component): `const t = await getTranslations({ locale, namespace: "PropertyUnavailable" })`.
  - [ ] **Similar properties:** Query up to 3 properties with matching `areaSlug` and `isVisible = true`, sorted by `syncedAt DESC`. Display as a simple list with links (property cards are Epic 3 Story 3.5 — keep it minimal here). If no similar properties found, show "Browse all properties" link only.
  - [ ] **ISR caching:** The page component calls `getPropertyBySlug` and `getSimilarProperties` — both are plain `db` calls that Next.js treats as dynamic by default. Add `export const dynamic = "force-dynamic"` to prevent accidental static generation (property availability changes daily after sync). When Story 4.1 implements the full page, it can adopt ISR with `revalidateTag`.
  - [ ] **SEO noindex via `generateMetadata`:** Return `{ robots: { index: false, follow: false } }` for soft-deleted property pages. This is the Next.js App Router pattern — NOT a raw `<meta>` tag.

- [ ] Task 4: Add DB query for "No longer available" page (AC: #3)
  - [ ] In `src/lib/db/queries/properties.ts`, export `async function getPropertyBySlug(slug: string): Promise<{ isVisible: boolean; ... } | null>`.
    - Selects ALL columns (not just visible ones) — needed to distinguish "soft-deleted" from "never existed".
    - Do NOT filter by `isVisible` in this query — the page component must receive soft-deleted records to render the correct UI.
  - [ ] In `src/lib/db/queries/properties.ts`, export `async function getSimilarProperties(areaSlug: string | null, excludeSlug: string, limit = 3): Promise<...[]>`.
    - Filters `isVisible = true`.
    - Matches `areaSlug` if provided (falls back to any visible properties if `areaSlug` is null).
    - Orders by `syncedAt DESC`.
    - Returns only columns needed for display: `slug, titleEn, titleEs, priceUsd, propertyType, images`.

- [ ] Task 5: Add i18n keys for "No longer available" page (AC: #3)
  - [ ] Add to `src/messages/en.json` under a new `"PropertyUnavailable"` namespace:
    ```json
    "PropertyUnavailable": {
      "heading": "This property is no longer available",
      "subtext": "It may have been sold or removed from our listings.",
      "similarHeading": "Similar properties you might like",
      "browseCta": "Browse all properties",
      "similarCta": "View property"
    }
    ```
  - [ ] Add equivalent Spanish keys to `src/messages/es.json`:
    ```json
    "PropertyUnavailable": {
      "heading": "Esta propiedad ya no está disponible",
      "subtext": "Puede que haya sido vendida o retirada de nuestros listados.",
      "similarHeading": "Propiedades similares que podrían interesarte",
      "browseCta": "Ver todas las propiedades",
      "similarCta": "Ver propiedad"
    }
    ```

- [ ] Task 6: Add env var for alert webhook (AC: #1)
  - [ ] Add `ALERT_SLACK_WEBHOOK=` to `.env.example` with comment: `# Optional Slack webhook URL for sync failure alerts`.
  - [ ] Do NOT add the variable to any committed `.env` file.

- [ ] Task 7: Tests (AC: all)
  - [ ] Create `tests/unit/sync/alert.spec.ts` (new file):
    - Mock `fetch` globally in vitest.
    - **Test: webhook configured** — when `ALERT_SLACK_WEBHOOK` is set, `sendSyncFailureAlert` calls `fetch` with the correct URL, `method: "POST"`, and body containing the error message.
    - **Test: webhook not configured** — when `ALERT_SLACK_WEBHOOK` is unset, `sendSyncFailureAlert` does NOT call `fetch` and does NOT throw.
    - **Test: fetch fails** — when `fetch` rejects, `sendSyncFailureAlert` swallows the error and does NOT throw.
  - [ ] Update `tests/unit/sync/pipeline-error-handling.spec.ts`:
    - Add `vi.mock("@/lib/sync/alert", () => ({ sendSyncFailureAlert: vi.fn().mockResolvedValue(undefined) }))`.
    - Assert that `sendSyncFailureAlert` is called once in the catch block on pipeline failure.
    - Assert it is NOT called on success (happy path stays untouched).
  - [ ] Update `tests/unit/sync/pipeline-happy-path.spec.ts`:
    - Add `vi.mock("@/lib/sync/alert", () => ({ sendSyncFailureAlert: vi.fn().mockResolvedValue(undefined) }))`.
    - Assert `sendSyncFailureAlert` is NOT called in the happy path.
  - [ ] Update `tests/unit/sync/pipeline-image-integration.spec.ts`:
    - Add mock for `@/lib/sync/alert` (same pattern).
  - [ ] Update `tests/unit/sync/sync-route.spec.ts`:
    - Add mock for `@/lib/sync/alert`.
  - [ ] Create `tests/unit/db/properties-unavailable.spec.ts` (or add to existing `properties.spec.ts`):
    - Test `getPropertyBySlug` — returns soft-deleted properties (does not filter `isVisible`).
    - Test `getSimilarProperties` — filters `isVisible = true`, orders by `syncedAt DESC`.

- [ ] Task 8: CI verification (AC: all)
  - [ ] `npm run typecheck` → 0 new errors.
  - [ ] `npm run lint` → 0 errors.
  - [ ] `npm run format:check` → pass.
  - [ ] `npm run build` → pass (pre-existing deepl-node build failure from Story 2.5 is the only known pre-existing issue — unrelated to this story).
  - [ ] `npm test` → 0 new failures (all new tests pass; existing tests remain green).

## Dev Notes

### Critical Architecture Compliance

**Pre-declared file (Architecture §3):** `src/lib/sync/alert.ts` is explicitly listed in the architecture source tree as `# Admin notification on failure`. Create at EXACTLY this path. Do NOT create `src/lib/sync/notifier.ts`, `src/lib/sync/mailer.ts`, or any variant.

**server-only (AR16/NFR11):** ALL files under `src/lib/sync/**` MUST have `import "server-only"` at the very top. This is enforced across `api-client.ts`, `differ.ts`, `translator.ts`, `image-optimizer.ts`, `lifestyle-tagger.ts`, and `pipeline.ts`. The new `alert.ts` is no exception.

**No email service exists:** The `.env.example` has no SMTP/email keys and `package.json` has no email library (Resend, Nodemailer, SendGrid, etc.). Do NOT add an email dependency — use a Slack webhook as the pragmatic v1 implementation. Add a `// TODO: Add email alert once email service is chosen` comment.

**Pipeline catch block order (strict):**
```ts
// In pipeline.ts catch block — DO NOT CHANGE ORDER:
await updateSyncLog(logId, { status: "failure", errorMessage: message, completedAt: new Date() });
await sendSyncFailureAlert(message);   // ← ADD THIS LINE
throw err;                             // ← already exists, keep last
```

**Resilience is already implemented:** The site already serves existing DB data when the API fails — Next.js serves ISR/SSG pages from the PostgreSQL DB. AC #2 and #6 (FR52/NFR18) are validated by the existing architecture, not new code. The story's contribution is the **alert** (notify Nico) and the **unavailable page** (handle removed URLs gracefully).

**Soft-delete already works:** `softDeleteProperties` in `src/lib/db/queries/properties.ts:132-138` already sets `isVisible = false` and the DB index `WHERE is_visible = true` ensures soft-deleted properties are excluded from all search queries. AC #3 does NOT require touching `pipeline.ts` or the differ.

**ISR revalidation already works:** `pipeline.ts` already calls `/api/revalidate` (Step 10). The `revalidate/route.ts` already calls `revalidateTag('properties')` and `revalidateTag('agents')`. AC #4 is satisfied by the existing implementation — no code changes needed.

**No new sync_logs columns:** Story 2.6 already added `tagsQueued`. The `sync_logs` table already has all required columns: `startedAt`, `completedAt`, `status`, `propertiesFetched`, `propertiesCreated`, `propertiesUpdated`, `propertiesRemoved`, `agentsSynced`, `translationsQueued`, `tagsQueued`, `imagesOptimized`, `errors`, `errorMessage`. AC #5 requires NO schema changes.

### Property Page Route

The property listing page is not yet implemented in the app router (Epic 3/4 territory for full listing detail). For Story 2.7, create a **minimal** property page that handles only the soft-deleted/unavailable case. The full listing detail page (photos, specs, agent CTA, etc.) is Story 4.1.

Route: `src/app/[locale]/property/[slug]/page.tsx`

Query pattern:
```ts
// Task 4 — in src/lib/db/queries/properties.ts
export async function getPropertyBySlug(slug: string) {
  const rows = await db
    .select()
    .from(properties)
    .where(eq(properties.slug, slug))
    .limit(1);
  return rows[0] ?? null;
}

export async function getSimilarProperties(areaSlug: string | null, excludeSlug: string, limit = 3) {
  // Build the where clause conditionally — avoid sql`1=1` pattern
  const whereClause = areaSlug
    ? and(eq(properties.isVisible, true), eq(properties.areaSlug, areaSlug), not(eq(properties.slug, excludeSlug)))
    : and(eq(properties.isVisible, true), not(eq(properties.slug, excludeSlug)));

  return db
    .select({
      slug: properties.slug,
      titleEn: properties.titleEn,
      titleEs: properties.titleEs,
      priceUsd: properties.priceUsd,
      propertyType: properties.propertyType,
      images: properties.images,
    })
    .from(properties)
    .where(whereClause)
    .orderBy(desc(properties.syncedAt))
    .limit(limit);
  // Note: add `desc` and `not` to the existing drizzle-orm import in properties.ts:
  // import { and, desc, eq, inArray, not } from "drizzle-orm";
}
```

Page logic:
```ts
// src/app/[locale]/property/[slug]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SimplePageLayout } from "@/components/layout/simple-page-layout";
import { getPropertyBySlug, getSimilarProperties } from "@/lib/db/queries/properties";

// Force dynamic — property visibility changes after each sync run
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const property = await getPropertyBySlug(slug);
  if (!property || property.isVisible) return {};
  // Soft-deleted: suppress from search engines
  return { robots: { index: false, follow: false } };
}

export default async function PropertyPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug, locale } = await params;
  setRequestLocale(locale); // required for next-intl static rendering support

  const property = await getPropertyBySlug(slug);

  if (!property) {
    notFound(); // URL never existed → 404
  }

  if (!property.isVisible) {
    // Soft-deleted → "No longer available" UI (NOT a 404, NOT noindex via <meta> — via generateMetadata above)
    const similar = await getSimilarProperties(property.areaSlug, slug);
    const t = await getTranslations({ locale, namespace: "PropertyUnavailable" });
    return (
      <SimplePageLayout>
        {/* Render unavailable UI using t() keys — see Task 5 for all keys */}
      </SimplePageLayout>
    );
  }

  // TODO Story 4.1: Full listing detail page
  notFound(); // Placeholder — visible properties have no detail page yet
}
```

**IMPORTANT:** For visible properties, fall through to `notFound()` as a placeholder — Story 4.1 implements the full listing detail. The primary deliverable of this story is the **unavailable** branch.

### Alert Module Implementation

```ts
// src/lib/sync/alert.ts
import "server-only";

/**
 * Sends a failure alert to the configured Slack webhook (if set).
 * If no webhook is configured, logs a warning and returns without throwing.
 * Alert failures are swallowed — they must NEVER crash the sync pipeline.
 *
 * Architecture §11 — Admin Alert Flow: sync failure → notification to admin.
 * TODO: Add email alert (email/WhatsApp) once an email service is added to the project.
 */
export async function sendSyncFailureAlert(errorMessage: string): Promise<void> {
  const webhookUrl = process.env.ALERT_SLACK_WEBHOOK;

  if (!webhookUrl) {
    console.warn("[sync/alert] No ALERT_SLACK_WEBHOOK configured. Sync failure:", errorMessage);
    return;
  }

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: `[remax-altitud] Sync failure: ${errorMessage}` }),
    });
  } catch (err) {
    // Alert delivery failure must not propagate — site resilience takes priority
    console.warn("[sync/alert] Failed to send Slack alert:", err);
  }
}
```

### No Duplicate DB Access Pattern

ALL DB queries MUST go through `src/lib/db/queries/*.ts`. Do NOT add direct `db` imports to `pipeline.ts` or page components. Follow the pattern established by `upsertProperty`, `fetchPropertyLifestyleTags`, etc. The `getPropertyBySlug` and `getSimilarProperties` functions belong in `src/lib/db/queries/properties.ts`.

### Test Mock Pattern (established across stories 2.3–2.6)

Every pipeline test file MUST mock `@/lib/sync/alert` to prevent real HTTP calls:
```ts
vi.mock("@/lib/sync/alert", () => ({
  sendSyncFailureAlert: vi.fn().mockResolvedValue(undefined),
}));
```

Add this mock to: `pipeline-happy-path.spec.ts`, `pipeline-error-handling.spec.ts`, `pipeline-image-integration.spec.ts`, `sync-route.spec.ts`.

### i18n Pattern (established in Stories 1.3–1.6)

- Use `getTranslations` in Server Components (async): `const t = await getTranslations({ locale, namespace: "PropertyUnavailable" })`
- Use `useTranslations` in Client Components (sync): `const t = useTranslations("PropertyUnavailable")`
- The `PropertyUnavailablePage` will be a Server Component — use `getTranslations`.

### Existing Test Count Reference

Story 2.6 CI result: 195 pass, 3 skipped (pre-existing schema tests), 0 failures. New tests in this story should bring the total up with 0 regressions.

### Pre-existing Build Issue (do not fix)

`npm run build` has a pre-existing deepl-node type error introduced in Story 2.5. It is tracked and unrelated to Story 2.7. Do not attempt to fix it — just confirm it is still the ONLY build error.

### Summary of What This Story Actually Creates

| New file | Purpose |
|---|---|
| `src/lib/sync/alert.ts` | Slack webhook alert sender |
| `src/app/[locale]/property/[slug]/page.tsx` | Property page (unavailable branch + 4.1 stub) |

| Modified file | Change |
|---|---|
| `src/lib/sync/pipeline.ts` | Add `sendSyncFailureAlert` call in catch block |
| `src/lib/db/queries/properties.ts` | Add `getPropertyBySlug`, `getSimilarProperties` |
| `src/messages/en.json` | Add `PropertyUnavailable` namespace |
| `src/messages/es.json` | Add `PropertyUnavailable` namespace |
| `.env.example` | Add `ALERT_SLACK_WEBHOOK` |

| New test file | Purpose |
|---|---|
| `tests/unit/sync/alert.spec.ts` | Alert module unit tests |
| `tests/unit/db/properties-unavailable.spec.ts` (or add to existing) | DB query tests for new functions |

### References

- Architecture §3 (source tree): `[Source: _bmad-output/planning-artifacts/architecture.md#Source Tree]`
- Architecture §5 (sync pipeline steps 7–8): `[Source: _bmad-output/planning-artifacts/architecture.md#Sync Pipeline Flow]`
- Architecture §11 (monitoring + admin alert flow): `[Source: _bmad-output/planning-artifacts/architecture.md#Monitoring & Observability]`
- FR51, FR52, FR53: `[Source: _bmad-output/planning-artifacts/prd.md#Functional Requirements]`
- NFR17, NFR18: `[Source: _bmad-output/planning-artifacts/prd.md#Non-Functional Requirements]`
- AR6 (ISR revalidation): `[Source: _bmad-output/planning-artifacts/architecture.md#Caching Strategy]`
- Soft-delete implementation: `[Source: src/lib/db/queries/properties.ts:132-138]`
- ISR revalidation implementation: `[Source: src/app/api/revalidate/route.ts]`
- Pipeline catch block: `[Source: src/lib/sync/pipeline.ts:316-325]`
- Previous story dev notes (2.6): `[Source: _bmad-output/implementation-artifacts/2-6-lifestyle-tag-auto-tagging.md#Dev Notes]`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6 (claude-code)

### Debug Log References

### Completion Notes List

### File List
