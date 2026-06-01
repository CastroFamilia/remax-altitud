# Story 5.3: Seller Lead Storage, Routing & Source Tracking

Status: ready-for-dev

## Story

As an **admin**,
I want seller form and CMA submissions stored with full context and routed to the right agent,
so that leads are never lost and the assigned agent has all the information needed to respond.

## Acceptance Criteria

1. **Given** a seller listing form is submitted, **when** the lead is created via `POST /api/leads`, **then** a lead record is stored with: name, phone, email (if provided), `source = "seller_form"`, `intent = "sell"`, property details (type, location coordinates, size, price or "needs pricing help"), description, preferred language, and `assigned_agent_id` (FR43).

2. **Given** a CMA form is submitted, **when** the lead is created, **then** a lead record is stored with: `source = "cma_form"`, `intent = "sell"`, and all collected fields (FR43).

3. **Given** the leads table, **when** a seller/CMA lead is created, **then** the `leads` table includes all schema fields per Architecture §4: `id`, `name`, `email`, `phone`, `source`, `intent`, `language`, `assigned_agent_id`, `property_id` (null for seller leads), `shortlist_property_ids` (empty), `notes`, `status` ("new"), `utm_source`, `utm_medium`, `utm_campaign`, `referrer`, `created_at`.

4. **Given** lead source tracking, **when** a seller visits the form page via a URL with UTM parameters (e.g., `?utm_source=facebook&utm_medium=ad&utm_campaign=sellers_pz`), **then** the UTM values and HTTP `Referer` are captured and stored on the lead record (FR54).

5. **Given** WhatsApp clicks on the confirmation page, **when** the seller taps "WhatsApp [Agent]" on the agent match card, **then** a WhatsApp lead event is also recorded with source context (FR54).

6. **Given** agent routing logic, **when** a seller submits a form with location coordinates, **then** the system matches the nearest office (Altitud PZ or Altitud Cero) and assigns an active agent from that office (FR43).

7. **Given** lead PII (name, phone, email), **when** stored in the database, **then** phone and email fields are encrypted at column level (AR17, NFR9).

8. **Given** the `/api/leads` endpoint, **when** receiving a POST request, **then** all input is validated with Zod schema (AR18) and invalid submissions return a clear 400 error response with field-specific messages.

9. **And** lead creation is idempotent — duplicate submissions within 60 seconds (same phone + same source) are rejected with a friendly 409 "Already submitted" response.

10. **And** Sentry captures any lead creation failures with full context (AR19).

## Tasks / Subtasks

- [ ] Task 1: Create `leads` Drizzle schema and migration (AC: #3, #7)
  - [ ] 1.1 Create `src/lib/db/schema/leads.ts` with all columns per Architecture §4 Entity `LEADS`
  - [ ] 1.2 Add `LEAD_ENCRYPTION_KEY` env var support — use `encryptField()`/`decryptField()` utilities in `src/lib/utils/encryption.ts`
  - [ ] 1.3 Phone and email columns must store ciphertext, NOT plaintext — use AES-256-GCM via Node.js `crypto`
  - [ ] 1.4 Export leads table and types from `src/lib/db/schema/index.ts`
  - [ ] 1.5 Add leads relations to `src/lib/db/schema/relations.ts` (agents → leads, properties → leads)
  - [ ] 1.6 Generate and apply Drizzle migration via `npx drizzle-kit generate` + `npx drizzle-kit migrate`
  - [ ] 1.7 Add composite index: `idx_leads_agent` on `(assigned_agent_id, created_at DESC)`
  - [ ] 1.8 Add idempotency index: `idx_leads_dedup` on `(phone, source, created_at DESC)` — used by 60s dedup check

- [ ] Task 2: Implement PII encryption utilities (AC: #7)
  - [ ] 2.1 Create `src/lib/utils/encryption.ts` with `encryptField(plaintext: string): string` and `decryptField(ciphertext: string): string`
  - [ ] 2.2 Use AES-256-GCM with random IV per encryption — key from `LEAD_ENCRYPTION_KEY` env var
  - [ ] 2.3 Output format: `iv:authTag:ciphertext` (all hex-encoded, colon-separated)
  - [ ] 2.4 `decryptField` must parse this format and verify the auth tag
  - [ ] 2.5 Add `LEAD_ENCRYPTION_KEY` to `.env.example` with a placeholder and generation instructions
  - [ ] 2.6 Unit tests: roundtrip, different inputs produce different ciphertexts, output is NOT the input string

- [ ] Task 3: Implement agent routing function (AC: #6)
  - [ ] 3.1 Create `src/lib/leads/route-agent.ts` with `matchAgentByCoordinates(lat: number | null, lng: number | null): Promise<string | null>`
  - [ ] 3.2 Use existing `getNearestOfficeCoords()` from `src/lib/constants/offices-geo.ts` to determine nearest office
  - [ ] 3.3 Map the winning office coords to an office ID via DB lookup (`offices` table)
  - [ ] 3.4 Select one active agent from that office (`agents` table, `isActive = true`, order by `listingCount DESC`, pick first)
  - [ ] 3.5 Fallback: if coordinates are null/undefined, default to Altitud PZ office (primary)
  - [ ] 3.6 Fallback: if no active agents exist in the matched office, try the other office
  - [ ] 3.7 Fallback: if no active agents exist at all, return `null` (API must still create the lead with `assigned_agent_id = null`)
  - [ ] 3.8 Unit tests for PZ coords, Dominical coords, null coords, no-agents-found

- [ ] Task 4: Create `/api/leads` POST route (AC: #1, #2, #3, #4, #8, #9, #10)
  - [ ] 4.1 Create `src/app/api/leads/route.ts` with `POST` handler
  - [ ] 4.2 Define Zod input schema: `leadInputSchema` — validates name, phone, email, source (enum), intent (enum), propertyType, location, size, sizeUnit, priceExpectation, needsPricingHelp, description, bedrooms, bathrooms, preferredLanguage, notes, utm_source, utm_medium, utm_campaign, referrer
  - [ ] 4.3 On validation failure: return 400 with `{ error: "Validation failed", issues: zodError.issues }`
  - [ ] 4.4 Idempotency check: query `leads` table for same phone + source within last 60 seconds. If found, return 409 with `{ error: "Already submitted", leadId: existing.id }`
  - [ ] 4.5 Call `matchAgentByCoordinates()` with location coords to get `assigned_agent_id`
  - [ ] 4.6 Encrypt phone and email before insert using `encryptField()`
  - [ ] 4.7 Insert lead record with all fields, `status = "new"`, `created_at = new Date()`
  - [ ] 4.8 Return 201 with `{ leadId, assignedAgentId }` — also return agent details (name, photo, phone, whatsapp) for the confirmation screen
  - [ ] 4.9 Wrap DB operations in try/catch — on error: call `Sentry.captureException(error)`, return 500 with `{ error: "Lead creation failed" }`
  - [ ] 4.10 Add rate limiting: max 10 requests/minute per IP (use in-memory Map with TTL, adequate for single-instance Docker)
  - [ ] 4.11 Read `Referer` from request headers for referrer field
  - [ ] 4.12 For the idempotency dedup query, the phone comparison must use encrypted phone — encrypt the incoming phone and compare against stored ciphertext. **Important**: Since each encryption uses a random IV, ciphertext comparison will NOT work. Instead, store a SHA-256 hash of the phone in a separate `phone_hash` column for dedup lookups.

- [ ] Task 5: Create lead query functions (AC: #1, #2)
  - [ ] 5.1 Create `src/lib/db/queries/leads.ts` with `import "server-only"`
  - [ ] 5.2 `createLead(data)` — inserts a new lead record (encrypts phone/email)
  - [ ] 5.3 `findRecentDuplicate(phoneHash, source, windowSeconds)` — checks for duplicate within time window
  - [ ] 5.4 `getLeadById(id)` — fetches and decrypts a lead record (for future admin use)

- [ ] Task 6: Wire seller form to real API (AC: #1, #4)
  - [ ] 6.1 Update `src/components/seller/seller-form.tsx`: replace the `// 5.1 stub` block (lines 308-318) with `POST /api/leads` call
  - [ ] 6.2 Build the API payload from `buildLeadPayload()` output, adding `source: "seller_form"`, `intent: "sell"`, UTM params (from `extractUtmParams()`), and `referrer: document.referrer`
  - [ ] 6.3 Handle API responses: 201 → show confirmation with real agent data from response, 409 → show "Already submitted" message, 400 → show validation error, 500 → show generic error with retry button
  - [ ] 6.4 Pass the matched agent from API response to `SellerConfirmation` instead of `fallbackAgent`

- [ ] Task 7: Wire CMA form to real API (AC: #2, #4)
  - [ ] 7.1 Update `src/components/seller/cma-form.tsx`: replace the `// 5.2 stub` block (lines 204-212) with `POST /api/leads` call
  - [ ] 7.2 Build the API payload from `buildCmaLeadPayload()` output, adding UTM params and referrer
  - [ ] 7.3 Handle API responses identically to seller form (Task 6.3)
  - [ ] 7.4 Pass the matched agent from API response to `SellerConfirmation`

- [ ] Task 8: WhatsApp click tracking (AC: #5)
  - [ ] 8.1 In `src/components/seller/seller-confirmation.tsx`, add an `onClick` handler to the WhatsApp CTA
  - [ ] 8.2 On click, fire `POST /api/leads` with `source: "whatsapp_click"`, `intent: "sell"`, the original lead's phone, agent_id, and UTM context
  - [ ] 8.3 Fire-and-forget — don't block navigation to wa.me URL; use `navigator.sendBeacon` or `fetch` with `keepalive: true`

- [ ] Task 9: Tests (AC: all)
  - [ ] 9.1 Unit: `encryptField`/`decryptField` roundtrip, non-plaintext output
  - [ ] 9.2 Unit: `matchAgentByCoordinates` — PZ coords, Dominical coords, null coords, no-agents
  - [ ] 9.3 Unit: Zod schema validation — valid payload, missing required fields, invalid source enum
  - [ ] 9.4 Integration: `POST /api/leads` — full seller payload → 201 with correct DB record
  - [ ] 9.5 Integration: duplicate within 60s → 409
  - [ ] 9.6 Integration: DB error → Sentry.captureException called, 500 returned
  - [ ] 9.7 Integration: encrypted phone/email in DB are NOT plaintext
  - [ ] 9.8 Integration: CMA form submission stores `source = "cma_form"`, `intent = "sell"`
  - [ ] 9.9 Integration: UTM params stored on lead record
  - [ ] 9.10 E2E scaffold: seller form → submit → confirmation with real agent card (Playwright, `test.skip` until CI framework unskips)

## Dev Notes

### Architecture & Constraints

- **Database**: PostgreSQL via Drizzle ORM (`drizzle-orm/postgres-js` + `postgres` driver). Lazy singleton in `src/lib/db/client.ts`.
- **PII Encryption** (AR17, NFR9): Column-level encryption for `email` and `phone` on leads. Use Node.js `crypto.createCipheriv('aes-256-gcm', key, iv)`. Key from `LEAD_ENCRYPTION_KEY` env var (32 bytes hex). Store as `iv:authTag:ciphertext` format.
- **Idempotency**: The dedup window is 60 seconds, keyed on phone + source. Because encrypted phone uses random IV, direct ciphertext comparison is impossible. Add a `phone_hash` column (SHA-256 of raw phone) for dedup lookups. The hash is deterministic and safe for comparison.
- **Zod validation** (AR18): All API input validated with Zod before processing. Return 400 with structured error on failure.
- **Sentry** (AR19): Wrap lead creation in try/catch; call `Sentry.captureException()` on error. Import from `@sentry/nextjs` if configured, or use a stub `captureLeadError()` utility that logs and forwards to Sentry when available.
- **Rate limiting**: In-memory rate limiter (Map<IP, {count, resetAt}>). 10 requests/minute/IP. Adequate for single-instance Docker deployment.

### Agent Routing Logic

The routing function (`matchAgentByCoordinates`) follows this algorithm:
1. If coordinates provided → use `getNearestOfficeCoords()` from `src/lib/constants/offices-geo.ts` to find nearest office (Euclidean distance, same as existing utility).
2. Map winning office coords to office DB row by matching `offices.latitude`/`offices.longitude`.
3. Select the first active agent from that office, ordered by `listingCount DESC`.
4. Fallback chain: null coords → PZ office → if no agents → other office → if still no agents → return null.
5. The function is `async` because it queries the DB.

**Office coordinates** (already defined in `src/lib/constants/offices-geo.ts`):
- PZ: `{ lat: 9.3725, lng: -83.7011 }`
- Dominical: `{ lat: 9.257, lng: -83.885 }`

### Existing Code to Reuse — DO NOT RECREATE

| What | Path | Notes |
|------|------|-------|
| UTM extraction | `src/lib/utils/utm.ts` | `extractUtmParams()` — browser-safe, reads from `window.location.search` |
| Office coords | `src/lib/constants/offices-geo.ts` | `getNearestOfficeCoords()`, `OFFICE_PZ_COORDS`, `OFFICE_DOMINICAL_COORDS` |
| Office metadata | `src/lib/constants/offices.ts` | `offices[]` array with phone, email, whatsapp |
| DB client | `src/lib/db/client.ts` | `db` singleton, lazy Proxy pattern |
| Agent schema | `src/lib/db/schema/agents.ts` | `agents` table, `Agent` type |
| Office schema | `src/lib/db/schema/offices.ts` | `offices` table, `Office` type |
| Schema barrel | `src/lib/db/schema/index.ts` | Re-exports all tables — add `leads` here |
| Relations | `src/lib/db/schema/relations.ts` | Add `leads` relations here |
| Agent queries | `src/lib/db/queries/agents.ts` | Pattern reference — `import "server-only"`, Drizzle select/insert |
| Office queries | `src/lib/db/queries/offices.ts` | `getOfficeById()`, `getAllOffices()` |
| Seller form stub | `src/components/seller/seller-form.tsx:308-318` | Replace `// 5.1 stub` with real `POST /api/leads` |
| CMA form stub | `src/components/seller/cma-form.tsx:204-212` | Replace `// 5.2 stub` with real `POST /api/leads` |
| `buildLeadPayload` | `src/components/seller/seller-form.tsx:93-116` | Already exported, builds payload from form data |
| `buildCmaLeadPayload` | `src/components/seller/cma-form.tsx:64-77` | Already exported, builds CMA payload |
| SellerConfirmation | `src/components/seller/seller-confirmation.tsx` | Shows matched agent card; already accepts `agent` prop |
| WhatsApp URL builder | `src/lib/constants/offices.ts:33-39` | `buildWhatsAppUrl(office, message)` |

### Stub Replacement Details

**Seller form** (`seller-form.tsx`, lines 308-318):
```typescript
// CURRENT STUB:
// 5.1 stub — Story 5.3 replaces with real API call.
const payload = buildLeadPayload(formData);
if (process.env.NODE_ENV !== "production") {
  console.log("[5.1 stub] seller form payload:", payload);
}
await new Promise((resolve) => setTimeout(resolve, 500));
setSubmitting(false);
setSubmitted(true);
```
Replace with: `fetch("/api/leads", { method: "POST", ... })` using built payload + UTM + referrer. Handle 201/409/400/500 responses. On 201, extract agent data from response and pass to confirmation.

**CMA form** (`cma-form.tsx`, lines 204-212):
```typescript
// CURRENT STUB:
// 5.2 stub — Story 5.3 replaces with real API call.
const payload = buildCmaLeadPayload(formData);
if (process.env.NODE_ENV !== "production") {
  console.log("[5.2 stub] CMA form payload:", payload);
}
await new Promise((resolve) => setTimeout(resolve, 500));
setSubmitting(false);
setSubmitted(true);
```
Replace identically to seller form, but payload source is already `"cma_form"`.

### New Files to Create

| File | Purpose |
|------|---------|
| `src/lib/db/schema/leads.ts` | Drizzle table definition for `leads` |
| `src/lib/utils/encryption.ts` | `encryptField()` / `decryptField()` AES-256-GCM |
| `src/lib/leads/route-agent.ts` | `matchAgentByCoordinates()` routing function |
| `src/lib/db/queries/leads.ts` | `createLead()`, `findRecentDuplicate()`, `getLeadById()` |
| `src/app/api/leads/route.ts` | `POST` handler with Zod validation, dedup, encryption, routing |
| `tests/unit/leads/encryption.spec.ts` | Encryption roundtrip and non-plaintext tests |
| `tests/unit/leads/route-agent.spec.ts` | Agent routing unit tests |
| `tests/unit/leads/api-leads.spec.ts` | API route integration tests |
| `tests/e2e/seller-lead-submission.spec.ts` | E2E scaffold (Playwright, `test.skip`) |

### Files to Modify

| File | Change |
|------|--------|
| `src/lib/db/schema/index.ts` | Add `export * from "./leads"` |
| `src/lib/db/schema/relations.ts` | Add `leads` → agents/properties relations |
| `src/components/seller/seller-form.tsx` | Replace stub with real API call (lines 308-318) |
| `src/components/seller/cma-form.tsx` | Replace stub with real API call (lines 204-212) |
| `src/components/seller/seller-confirmation.tsx` | Add WhatsApp click tracking (AC #5) |
| `.env.example` | Add `LEAD_ENCRYPTION_KEY` |

### data-testid Contracts

Existing (MUST NOT change):
- `seller-form`, `form-step-1/2/3`, `progress-bar`, `pricing-help-checkbox` (Story 5.1)
- `cma-form`, `cma-form-fields`, `cma-submit-button`, `cma-confirmation` (Story 5.2)
- `seller-confirmation` (Story 5.1)
- `agent-card` (Epic 4)

No new `data-testid` values are required for this backend-focused story.

### Testing Standards

- **Unit tests**: Vitest with `vi.mock()` for DB/Sentry. Test file naming: `tests/unit/leads/*.spec.ts`.
- **Integration tests**: Use actual Drizzle queries against test DB (if available) or mock DB. Pattern: `import "server-only"` must be mocked.
- **E2E tests**: Playwright scaffolds with `test.skip` — same pattern as Epics 3-4.
- **Mock pattern**: Declare `vi.mock(...)` before imports; add comment `// imported AFTER mocks`. Reference: `tests/unit/sync/*.spec.ts`.
- **Test IDs from test-design-epic-5.md**: 5.3-API-001 through 5.3-API-010, 5.3-UNIT-001 through 5.3-UNIT-006.

### Leads Schema (Architecture §4 reference)

```sql
LEADS {
    uuid id PK
    text name
    text email "nullable, encrypted"
    text phone "encrypted"
    text phone_hash "SHA-256 for dedup"
    text source "whatsapp|seller_form|contact_form|cma_form|whatsapp_click"
    text intent "buy|sell|invest|recruit"
    text language
    uuid assigned_agent_id FK
    uuid property_id FK "nullable"
    text[] shortlist_property_ids "for shortlist leads"
    text utm_source "nullable"
    text utm_medium "nullable"
    text utm_campaign "nullable"
    text referrer "nullable"
    text notes "nullable"
    text status "new|contacted|qualified|closed"
    timestamp created_at
}
```

Note: `phone_hash` is NOT in the original architecture schema — it is added by this story to support idempotency dedup (since encrypted values with random IV are non-deterministic).

### Deferred Work from Prior Stories (Relevant to 5.3)

From `_bmad-output/implementation-artifacts/deferred-work.md`:
- Email regex is permissive (Story 1.6) → this story owns stricter Zod validation for the API endpoint. Client-side validation in forms remains as-is.
- Phone validation is digit-count only (Story 1.6) → this story adds Zod validation on the API side. The form-level validation remains permissive.
- `CONTACT_INBOX`/`RECRUIT_INBOX` hardcoded in contact-form.tsx (Story 1.6) → this story replaces `mailto:` with `POST /api/leads` for seller/CMA forms only. Contact form swap is out of scope (future story).

### Project Structure Notes

- All new server-side files use `import "server-only"` guard (matches `agents.ts`, `offices.ts` queries pattern).
- API route at `src/app/api/leads/route.ts` follows Next.js 15 App Router convention (matches `sync/route.ts`, `health/route.ts`).
- Lead utilities in `src/lib/leads/` — new directory for lead-specific business logic.
- Encryption utility in `src/lib/utils/encryption.ts` — co-located with existing utilities (`utm.ts`, `currency.ts`, etc.).

### References

- [Architecture §4 — Database Schema](file:///_bmad-output/planning-artifacts/architecture.md#4-database-schema) — LEADS entity, indexes
- [Architecture §6 — API Design](file:///_bmad-output/planning-artifacts/architecture.md#6-api-design) — `/api/leads` POST endpoint
- [Architecture §10 — Security](file:///_bmad-output/planning-artifacts/architecture.md#10-security) — PII encryption, rate limiting, Zod validation
- [Epics §5.3](file:///_bmad-output/planning-artifacts/epics.md#story-53-seller-lead-storage-routing--source-tracking) — Full AC and requirements
- [Test Design Epic 5](file:///_bmad-output/test-artifacts/test-design-epic-5.md) — Risk assessment, test IDs, coverage plan
- [Story 5.1](file:///_bmad-output/implementation-artifacts/5-1-seller-landing-page-and-list-with-us-form.md) — Seller form implementation patterns
- [Story 5.2](file:///_bmad-output/implementation-artifacts/5-2-cma-request-form.md) — CMA form implementation patterns
- [UTM utility](file:///src/lib/utils/utm.ts) — `extractUtmParams()` function
- [Office geo constants](file:///src/lib/constants/offices-geo.ts) — `getNearestOfficeCoords()`, office coordinates
- [Deferred work](file:///_bmad-output/implementation-artifacts/deferred-work.md) — Prior story deferrals relevant to 5.3

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
