# Story 2.4: Image Optimization Pipeline

Status: ready-for-dev

## Story

As a **visitor**,
I want property photos to load quickly in high quality,
so that I can evaluate listings without waiting on slow images.

## Acceptance Criteria

1. **Given** a property classified as `NEW` or `UPDATED` by the diff (Story 2.3) **When** the sync pipeline's image-optimization step runs **Then** each source URL in `raw.images[]` is downloaded from the Azure CDN origin and converted to WebP format using `sharp` (FR47).

2. **Given** each downloaded source image **When** generating responsive variants **Then** exactly three sizes are produced per image: `400px` wide (mobile card), `800px` wide (gallery thumb), and `1600px` wide (full-screen / hero) — all in WebP format with `fit: "inside"` (no upscale) and quality `≤ 85` (FR47, UX-DR27, NFR6).

3. **Given** each generated WebP variant **When** stored to the Docker-volume public directory **Then** the file is written under `public/property-images/{apiId}/{filename_base}-{width}w.webp` and the resulting file size is `≤ 200KB` (UX-DR35, Architecture §5 Docker volume storage).

4. **Given** all variants for a property are generated **When** updating the database **Then** the `properties.images` JSONB column is overwritten with an array of `OptimizedImage` objects (shape defined below) — one entry per source image — and `properties.synced_at` is updated.

5. **Given** an `OptimizedImage` record **When** stored in the JSONB array **Then** it contains: `{ src: string (400w URL, relative /property-images/…), srcset: string ("…400w, …800w, …1600w"), blurDataUrl: string (base64 LQIP, 20×13px), width: 400, height: number, alt: string }` — where `alt` follows the architecture template `"Photo {n} of {total} — {property_type} in {location}"` (Architecture §8, FR47).

6. **Given** the API `Images` field contains pipe-delimited URLs that may include spaces **When** processing **Then** the existing `splitAndEncodeImages()` helper from `src/lib/sync/utils/images.ts` is used to split and URL-encode before download — no duplication of that logic (API3).

7. **Given** a source image URL that responds with a non-2xx HTTP status or whose download throws **When** the download fails **Then** the failure is logged as a structured entry `{ apiId, imageIndex, url, error }` appended to an `imageErrors` array; the pipeline continues with remaining images; the property's `images` JSONB is set to whatever variants were successfully generated (empty array if all failed).

8. **Given** a property whose `images` array is already populated with `OptimizedImage` objects from a prior sync **When** the current diff classifies the property as `UNCHANGED` **Then** the image-optimization step is skipped entirely for that property — zero re-downloads, zero re-encodes (NFR15 — incremental processing).

9. **Given** the `properties.api_hash` has changed (property is `UPDATED`) **When** image optimization runs **Then** ALL images for that property are re-processed regardless of whether image URLs themselves changed (conservative refresh to ensure consistency).

10. **Given** a listing whose `raw.images` array is empty (`[]`) **When** the optimizer processes it **Then** `properties.images` is set to `[]`, no download is attempted, and no error is logged — this is a valid, non-error state.

11. **Given** the image optimizer processes a batch of properties **When** all image work for a sync run completes **Then** the `sync_logs.images_optimized` count is updated with the total number of **individual image variants** successfully written to disk (3 per source image × properties processed).

12. **Given** the complete implementation **When** running `npm run typecheck && npm run lint && npm run format:check && npm run build && npm test` **Then** all pass with zero new errors. The `image-optimizer.ts` module must import `"server-only"` and must NOT be importable by any Client Component.

## Tasks / Subtasks

- [ ] Task 1: Install `sharp` and add `@types/sharp` (AC: #1, #2, #3)
  - [ ] Run `npm install sharp` and `npm install --save-dev @types/sharp`.
  - [ ] Verify `sharp` is now in `package.json` `dependencies` (runtime dep, not devDep — needed in the Docker image).
  - [ ] In `next.config.ts`, add `experimental: { serverComponentsExternalPackages: ['sharp'] }` if not already present (Next.js 15 requirement for native-module sharp in App Router).
  - [ ] **DO NOT** install `jimp`, `canvas`, or any other image library — `sharp` is the architecture-mandated choice.

- [ ] Task 2: Create `OptimizedImage` type (AC: #5)
  - [ ] Add `src/types/images.ts` with: `export interface OptimizedImage { src: string; srcset: string; blurDataUrl: string; width: 400; height: number; alt: string; }`.
  - [ ] This file must NOT have `"use client"` or `import "server-only"` — it is a shared type definition only.
  - [ ] Export `OptimizedImage` from `src/types/remax-api.ts` via re-export (`export type { OptimizedImage } from './images'`) so downstream stories import from the canonical types barrel.

- [ ] Task 3: Create `src/lib/sync/image-optimizer.ts` (AC: #1–#11)
  - [ ] Add `import "server-only"` at the top.
  - [ ] Import `sharp` (default import: `import sharp from 'sharp'`).
  - [ ] Import `splitAndEncodeImages` from `@/lib/sync/utils/images` — reuse, do NOT rewrite URL-encoding logic.
  - [ ] Import `OptimizedImage` from `@/types/images`.
  - [ ] Define `SIZES = [400, 800, 1600] as const` — widths to generate.
  - [ ] Define `LQIP_SIZE = 20` — width of the blur placeholder.
  - [ ] Define `OUTPUT_BASE_DIR = path.join(process.cwd(), 'public', 'property-images')` using Node's `path.join`.
  - [ ] Export `async function optimizePropertyImages(apiId: string, rawImageUrls: string[], propertyType: string, location: string): Promise<{ optimized: OptimizedImage[]; errors: ImageOptimizeError[] }>`.
  - [ ] **Download loop**: For each url in `rawImageUrls` (0-indexed):
    - Fetch the URL with `fetch(url)`. If non-2xx or throws, append `{ apiId, imageIndex: i, url, error: err.message }` to `errors` and `continue`.
    - Read response as `ArrayBuffer`, convert to `Buffer`.
  - [ ] **Output directory**: `path.join(OUTPUT_BASE_DIR, apiId)`. Create with `fs.mkdirSync(dir, { recursive: true })` (sync is fine — called during server-side sync, not hot path).
  - [ ] **Filename base**: Derive from URL. Take `path.basename(new URL(url).pathname)` and strip extension: `base = name.replace(/\.[^.]+$/, '')`. If empty, use `image-${i}`.
  - [ ] **Generate 3 variants**: For each `width` in `SIZES`:
    - `const outPath = path.join(dir, \`${base}-${width}w.webp\`)`.
    - `await sharp(buffer).resize(width, undefined, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toFile(outPath)`.
    - Collect `{ width, path: outPath, relUrl: \`/property-images/${apiId}/${base}-${width}w.webp\` }`.
  - [ ] **LQIP generation**: `const lqipBuf = await sharp(buffer).resize(LQIP_SIZE, undefined, { fit: 'inside' }).webp({ quality: 20 }).toBuffer()`. `blurDataUrl = \`data:image/webp;base64,\${lqipBuf.toString('base64')}\``.
  - [ ] **Height extraction**: Use `const meta = await sharp(buffer).metadata()`. `const aspectRatio = (meta.height ?? 800) / (meta.width ?? 1200)`. `height = Math.round(400 * aspectRatio)`.
  - [ ] **Alt text**: `alt = \`Photo ${i + 1} of ${rawImageUrls.length} — ${propertyType} in ${location}\``.
  - [ ] **srcset**: `\`${variants[0].relUrl} 400w, ${variants[1].relUrl} 800w, ${variants[2].relUrl} 1600w\``.
  - [ ] Assemble `OptimizedImage`: `{ src: variants[0].relUrl, srcset, blurDataUrl, width: 400, height, alt }`.
  - [ ] Return `{ optimized, errors }`.
  - [ ] Export `interface ImageOptimizeError { apiId: string; imageIndex: number; url: string; error: string }`.

- [ ] Task 4: Integrate optimizer into `src/lib/sync/pipeline.ts` (AC: #8, #9, #11)
  - [ ] Import `optimizePropertyImages` from `./image-optimizer`.
  - [ ] After the property upsert loop (Task 6b in Story 2.3, currently lines ~119–140 of `pipeline.ts`), add a new **image optimization step** that runs ONLY on `diff.new` and `diff.updated` (skip `diff.unchanged`).
  - [ ] For each `raw` in `[...diff.new, ...diff.updated]`:
    - Call `optimizePropertyImages(raw.apiId, raw.images, raw.propertyTypeEn, raw.location ?? raw.stateProv ?? 'Costa Rica')`.
    - Update the property's `images` JSONB: call `updatePropertyImages(raw.apiId, result.optimized)` (Task 5).
    - Accumulate `result.errors` into a new `imageErrors` array.
    - Accumulate `result.optimized.length` variants into `totalImagesOptimized` counter.
  - [ ] Append `imageErrors` entries (mapped to `ParseError` shape: `{ apiId, scope: 'image_error', message: err.error, raw: { url: err.url } }`) to `allErrors`.
  - [ ] Pass `imagesOptimized: totalImagesOptimized` in the `updateSyncLog(...)` call.
  - [ ] **Scope guard**: Do NOT touch `diff.unchanged` — zero re-processing (AC #8, NFR15).
  - [ ] **DO NOT** move the optimizer step before agent upserts — maintain existing pipeline order: fetch → diff → agents → properties → **images** → counts → sync log.
  - [ ] Update `SyncPipelineResult` interface to add `imagesOptimized: number`.
  - [ ] Update `ParseError` scope union in `src/types/remax-api.ts` to include `"image_error"`.

- [ ] Task 5: Create `updatePropertyImages` DB helper (AC: #4)
  - [ ] In `src/lib/db/queries/properties.ts`, export `async function updatePropertyImages(apiId: string, images: OptimizedImage[]): Promise<void>`.
  - [ ] Implementation: `await db.update(properties).set({ images: images as unknown as JsonbValue, syncedAt: new Date(), updatedAt: new Date() }).where(eq(properties.apiId, apiId))`.
  - [ ] Import `OptimizedImage` from `@/types/images`.
  - [ ] Add `import "server-only"` is already present in this file — DO NOT add again.

- [ ] Task 6: Tests (AC: #12)
  - [ ] Create `tests/unit/sync/image-optimizer.spec.ts`:
    - Mock `sharp` with `vi.mock('sharp', ...)` returning a chainable builder: `.resize().webp().toFile()` and `.resize().webp().toBuffer()` and `.metadata()`.
    - Mock `node:fs` (`mkdirSync`) so no disk I/O in tests.
    - Mock `fetch` via `vi.stubGlobal('fetch', ...)`.
    - **AC #1 test**: Given 1 valid image URL, when `optimizePropertyImages` called, then `fetch` called with that URL, `sharp` called, 3 `.webp().toFile()` calls made.
    - **AC #2 test**: Verify the 3 resize widths are `400`, `800`, `1600`.
    - **AC #5 test**: Returned `OptimizedImage` has `src`, `srcset`, `blurDataUrl`, `width: 400`, `height`, `alt` matching template.
    - **AC #6 test**: `splitAndEncodeImages` already tested — verify that the optimizer receives pre-encoded URLs (test that the function is called, not reimplemented).
    - **AC #7 test**: Given `fetch` returns `404`, when called, then error is in `errors` array and `optimized` is `[]`.
    - **AC #10 test**: Given `rawImageUrls = []`, when called, then returns `{ optimized: [], errors: [] }` without calling `fetch`.
    - **AC #5 alt text test**: Given `propertyType = 'House'` and `location = 'Pérez Zeledón'` and 2 images, then first `OptimizedImage.alt = 'Photo 1 of 2 — House in Pérez Zeledón'`.
  - [ ] Update `tests/unit/sync/pipeline-happy-path.spec.ts`:
    - Add mock for `optimizePropertyImages` (`vi.mock('@/lib/sync/image-optimizer', () => ({ optimizePropertyImages: vi.fn().mockResolvedValue({ optimized: [], errors: [] }) }))`).
    - Assert `imagesOptimized: 0` in the `updateSyncLog` result for the happy-path test.
    - Add a test where optimizer returns 3 optimized variants for 1 image → assert `imagesOptimized: 3` in sync log.
  - [ ] Update `tests/unit/db/properties.spec.ts` (create if not exists):
    - Mock `@/lib/db/client` with `vi.mock`.
    - Test `updatePropertyImages('apiId', [...])` → assert `db.update` called with correct set payload.

- [ ] Task 7: `public/property-images/` directory setup (AC: #3)
  - [ ] Create `public/property-images/.gitkeep` so the directory is tracked in git but images are not.
  - [ ] Add `public/property-images/` to `.gitignore` (add a line `public/property-images/` — gitkeep pattern: track the directory, ignore its contents). Actually the correct pattern: add `public/property-images/*` and `!public/property-images/.gitkeep` to `.gitignore`.
  - [ ] Verify `Dockerfile` (if present) includes a `VOLUME` or `COPY` step for `public/property-images` to persist optimized images across deploys. If not, add a comment in the Dockerfile noting this directory requires a Docker volume mount at `/app/public/property-images` for persistence.

- [ ] Task 8: CI verification (AC: #12)
  - [ ] `npm run typecheck` → 0 errors.
  - [ ] `npm run lint` → 0 errors.
  - [ ] `npm run format:check` → pass.
  - [ ] `npm run build` → pass (note: `sharp` is a native module; ensure `serverComponentsExternalPackages` is set).
  - [ ] `npm test` → all green (all previously passing tests + all new image-optimizer tests).

## Dev Notes

### Architecture Compliance

- **Pre-declared file (Architecture §3):** `src/lib/sync/image-optimizer.ts` is explicitly listed in the architecture source tree as `# Image download + optimization`. Do NOT create it anywhere else.
- **server-only (AR16/NFR11):** `import "server-only"` MUST be at the top of `src/lib/sync/image-optimizer.ts`. This prevents accidental import from Client Components.
- **Sharp — native module:** `sharp` uses native bindings. In Next.js 15 App Router, it requires `serverComponentsExternalPackages: ['sharp']` in `next.config.ts` to avoid bundling errors. The Docker build must install it in a native-compatible environment (the existing multi-stage Dockerfile already handles this for Next.js native deps — verify it's not explicitly excluded).
- **Docker volume storage (Architecture §5):** Images are stored at `public/property-images/{apiId}/` on the server filesystem. This is a Docker volume mount in Coolify (not an S3/CDN bucket). The `process.cwd()` in Next.js server context points to `/app` inside the container — so `public/property-images/` resolves to `/app/public/property-images/` which must be a mounted volume for persistence across redeploys.
- **next/image compatibility:** Storing files under `public/` means they are served statically by Next.js at `/property-images/…`. The `OptimizedImage.src` and `srcset` are relative paths starting with `/property-images/…` — these work directly with `<img src>` or `next/image src` prop.
- **Incremental processing (NFR15):** ONLY `diff.new` and `diff.updated` properties get images re-processed. `diff.unchanged` = zero file I/O. This is critical for NFR15 (sync within 2 hours for ~300 listings).
- **Max images per listing:** Architecture §5 documents `max 12 images/listing`. The optimizer should process all images in `raw.images[]` up to whatever the API provides; no artificial cap is required in code, but the 12-image architectural constraint is worth noting for sizing tests.
- **`splitAndEncodeImages` reuse:** This helper already exists at `src/lib/sync/utils/images.ts` and is already called by the Story 2.2 parser (produces `raw.images[]`). By the time `optimizePropertyImages` receives `rawImageUrls`, they are already URL-encoded. Do NOT call `splitAndEncodeImages` again inside the optimizer — the URLs are clean.
- **Pipeline ordering:** Insert image optimization AFTER property upserts (to have the property row exist for FK sanity) but BEFORE `updateSyncLog` final status write. This preserves the Story 2.3 pipeline sequence.
- **`ParseError` scope extension:** The `src/types/remax-api.ts` `ParseError` interface has `scope: "property" | "agent" | "lot_size_warning"`. Add `| "image_error"` to this union to support image failure logging.

### `OptimizedImage` Shape Reference

```ts
// src/types/images.ts
export interface OptimizedImage {
  src: string;       // relative URL to 400w WebP: "/property-images/{apiId}/{base}-400w.webp"
  srcset: string;    // "…400w.webp 400w, …800w.webp 800w, …1600w.webp 1600w"
  blurDataUrl: string; // "data:image/webp;base64,…" (20px wide LQIP)
  width: 400;        // literal 400 — the `src` always points to the 400w variant
  height: number;    // pixel height of 400w variant (aspect-ratio preserved)
  alt: string;       // "Photo {n} of {total} — {propertyType} in {location}"
}
```

### DB Column Reference

The `properties.images` column is `jsonb` (from Story 2.1 schema, `src/lib/db/schema/properties.ts`):
```ts
images: jsonb("images").notNull().default(sql`'[]'::jsonb`)
```
Story 2.3 writes `raw.images` (array of string URLs) here. Story 2.4 OVERWRITES it with `OptimizedImage[]` objects. This is an intentional schema evolution — no migration required (JSONB is schema-free).

### Anti-Pattern Guardrails (DO NOT)

1. **DO NOT** install `jimp`, `canvas`, `imagemin`, or any image library other than `sharp`.
2. **DO NOT** call `splitAndEncodeImages` inside `image-optimizer.ts` — URLs are already encoded by the parser.
3. **DO NOT** process `diff.unchanged` properties — this would violate NFR15.
4. **DO NOT** re-encode images that haven't changed (check diff classification, not image content).
5. **DO NOT** write images to any path other than `public/property-images/{apiId}/`.
6. **DO NOT** hard-delete or overwrite previously optimized images for unchanged listings.
7. **DO NOT** make image optimization blocking for the entire sync if one image fails — continue with remaining (AC #7).
8. **DO NOT** import `sharp` in any Client Component or shared utility — server-only boundary is mandatory.
9. **DO NOT** use `fs.writeFileSync` for WebP output — use `sharp(...).toFile(outPath)` which handles atomic writes.
10. **DO NOT** create a new `images-optimizer.ts` (note: architecture spells it `image-optimizer.ts`, no plural).

### Previous Story Intelligence (2.3)

- **Pipeline extension pattern:** Story 2.3 built `runSyncPipeline()` in `src/lib/sync/pipeline.ts`. Story 2.4 extends it by inserting a new step. Follow the exact same `try/catch` structure, log appending pattern (`allErrors.push(...)`), and `updateSyncLog` field pattern.
- **Mocking pattern in tests:** All pipeline tests use `vi.mock('@/lib/db/client')` to prevent live DB calls. The image optimizer tests should mock `sharp` similarly. See `tests/unit/sync/pipeline-happy-path.spec.ts` for the exact mock setup pattern.
- **`server-only` boundary:** Every file under `src/lib/sync/**` and `src/lib/db/queries/**` uses `import "server-only"` as first line. The image optimizer is under `src/lib/sync/` — the rule applies.
- **Test factories:** `tests/unit/sync/factories.ts` exports `makeRawProperty()`. Reuse it in image-optimizer tests — do NOT redefine the factory.
- **`ParseError` type:** Imported from `@/types/remax-api`. To add `"image_error"` scope, edit `src/types/remax-api.ts` (not the schema file) and extend the union.
- **Drizzle update pattern:** Story 2.3's `softDeleteProperties` and `updateAgentListingCounts` show the Drizzle update pattern. Follow the same `db.update(table).set({...}).where(eq(...))` pattern for `updatePropertyImages`.

### Sharp API Quick Reference (v0.33.x — current as of 2026)

```ts
import sharp from 'sharp';
// Resize + WebP encode to file:
await sharp(buffer)
  .resize(800, undefined, { fit: 'inside', withoutEnlargement: true })
  .webp({ quality: 82 })
  .toFile('/path/to/output.webp');

// LQIP to buffer:
const lqip = await sharp(buffer)
  .resize(20)
  .webp({ quality: 20 })
  .toBuffer();

// Get image metadata (width, height, format):
const meta = await sharp(buffer).metadata();
// meta.width, meta.height are numbers or undefined
```

Key sharp options:
- `fit: 'inside'` — scales proportionally, never exceeds given dimension
- `withoutEnlargement: true` — prevents upscaling small images
- `quality: 82` — good WebP quality/size tradeoff (tune down to 75 if >200KB)

### File Structure Target

```
src/
├── lib/
│   └── sync/
│       └── image-optimizer.ts   ← NEW (Task 3)
├── types/
│   ├── images.ts                ← NEW (Task 2)
│   └── remax-api.ts             ← EDIT: add OptimizedImage re-export + "image_error" scope
├── lib/db/queries/
│   └── properties.ts            ← EDIT: add updatePropertyImages()
└── lib/sync/
    └── pipeline.ts              ← EDIT: insert image-optimization step

public/
└── property-images/
    └── .gitkeep                 ← NEW (Task 7)

tests/unit/sync/
└── image-optimizer.spec.ts      ← NEW (Task 6)
```

### References

- Architecture §3 Source Tree: `src/lib/sync/image-optimizer.ts` [Source: `_bmad-output/planning-artifacts/architecture.md`]
- Architecture §5 Sync Pipeline Step 5: image download, 3 sizes (1200×800, 800×533, 400×267), LQIP, Docker volume storage [Source: `_bmad-output/planning-artifacts/architecture.md` lines 645–651]
- Architecture §5 Sync Execution Constraints: `Docker volume storage | Server disk | WebP compression; max 12 images/listing` [Source: `_bmad-output/planning-artifacts/architecture.md` line 696]
- Architecture §8 NFR: `Largest image | <200KB | WebP via next/image` [Source: `_bmad-output/planning-artifacts/architecture.md` line 880]
- Architecture §8 Alt text template: `"Photo {n} of {total} — {property_type} in {location}"` [Source: `_bmad-output/planning-artifacts/architecture.md` line 399]
- PRD FR47: Image optimization (WebP, responsive sizes) during sync [Source: `_bmad-output/planning-artifacts/prd.md`]
- Epics Story 2.4 acceptance criteria [Source: `_bmad-output/planning-artifacts/epics.md` lines 937–964]
- Story 2.1 DB schema: `properties.images jsonb` [Source: `src/lib/db/schema/properties.ts`]
- Story 2.3 Pipeline: `src/lib/sync/pipeline.ts` — integration point [Source: codebase]
- Existing images util: `src/lib/sync/utils/images.ts` — `splitAndEncodeImages`, `encodeImageUrl` [Source: codebase]
- Test design matrix: Story 2.4 P1 and P2 test scenarios [Source: `_bmad-output/test-artifacts/test-design-epic-2.md` lines 170–173, 195–196, 206]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
