---
workflowStatus: 'completed'
totalSteps: 5
stepsCompleted: ['step-01-detect-mode', 'step-02-load-context', 'step-03-risk-and-testability', 'step-04-coverage-plan', 'step-05-generate-output']
lastStep: 'step-05-generate-output'
nextStep: ''
lastSaved: '2026-05-27'
---

# Test Design Workflow Progress

## Step 1: Mode Detection

- **Mode selected:** Epic-Level (Phase 4)
- **Reason:** `sprint-status.yaml` exists; explicit argument "Epic 6 — Community Pages & Area Guides" provided
- **Epic number:** 6
- **Stories in scope:** 6.1 (done), 6.2 (done), 6.3, 6.4, 6.5

## Step 2: Context Loaded

- Stack detected: `frontend` (Next.js 15 App Router, Vitest + React Testing Library, Playwright)
- `tea_use_playwright_utils`: true
- `tea_browser_automation`: auto
- `test_stack_type`: auto → inferred `frontend`
- Epics loaded: Epic 6 (Stories 6.1–6.5) with all acceptance criteria
- Architecture doc loaded: PostGIS geo-fence matching (AR2), SSG/ISR for community pages, Mapbox Static API for mini-maps
- PRD loaded: FR17–FR21, FR44, FR45, FR50, NFR24, NFR25
- Epic 5 test design loaded for infrastructure carry-over
- Knowledge fragments loaded: risk-governance, probability-impact, test-levels-framework, test-priorities-matrix

## Step 3: Risk Assessment

- 13 risks identified (R-001 through R-013)
- 5 high-priority (score ≥ 6): R-001 through R-005
- Critical categories: DATA (R-001, R-002, R-006), SEO (R-003, R-005), BUS (R-004, R-008–R-012), PERF (R-007)
- No score-9 (BLOCK) risks — all high-priority risks scored 6 (MITIGATE threshold)

## Step 4: Coverage Plan

- P0: 14 scenarios (~24–42 hours) — geo-fence auto-tagging, manual override, SSG description visibility, community property grid, path generation
- P1: 18 scenarios (~20–36 hours) — area guide tabs, community quick facts, lot status, mini-map, investment context, responsive
- P2: 14 scenarios (~10–20 hours) — locale tests, gold border, ISR config, ST_Within verification, bundle analysis
- P3: 5 scenarios (~3–6 hours) — Lighthouse performance, LCP benchmarks, geo-tag performance
- **Total:** 51 scenarios, ~57–104 hours (~1.5–2.5 weeks)

## Step 5: Output Generated

- **Output file:** `_bmad-output/test-artifacts/test-design-epic-6.md`
- **Mode:** Epic-Level (Phase 4)
- **Validated against checklist:** Yes — all sections populated, no orphaned template placeholders
- **Key risks and gates:**
  - R-001 (manual override preservation): admin-set community_id must survive sync pipeline geo-tagging
  - R-002 (correct community assignment): polygon boundary matching with ≥2 polygons verified
  - R-003 (SEO description visibility): area guide description confirmed visible in SSG HTML without tab
  - R-004 (community property grid): filtered grid renders correct count on community page
  - R-005 (SSG path generation): `next build` generates all expected community paths
- **Open assumptions:** community polygon data format (GeoJSON vs WKT), Mapbox Static API availability in CI, investment data storage location (areas.metadata JSONB vs dedicated column)
