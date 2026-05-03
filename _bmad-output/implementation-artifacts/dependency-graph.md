# Story Dependency Graph
_Last updated: 2026-05-03T17:00:00-06:00_

## Stories

| Story | Epic | Title | Sprint Status | Issue | PR | PR Status | Dependencies | Ready to Work |
|-------|------|-------|--------------|-------|----|-----------|--------------|---------------|
| 1.1   | 1    | Project Scaffolding & CI/CD Pipeline | done | #71 | #1,#56,#58 | merged | none | ✅ Yes (done) |
| 1.2   | 1    | Design System & Token Foundation | done | #72 | #59 | merged | 1.1 | ✅ Yes (done) |
| 1.3   | 1    | Core Layout & Navigation | done | #73 | #61 | merged | 1.2 | ✅ Yes (done) |
| 1.4   | 1    | Internationalization (EN/ES) | done | #74 | #62 | merged | 1.1 | ✅ Yes (done) |
| 1.5   | 1    | Homepage Shell & Split-Hero | done | #75 | #63 | merged | 1.3, 1.4 | ✅ Yes (done) |
| 1.6   | 1    | Static Content Pages | done | #76 | #63 | merged | 1.3, 1.4 | ✅ Yes (done) |
| 1.7   | 1    | Loading States, Empty States & Error Handling | done | #77 | #64 | merged | 1.3 | ✅ Yes (done) |
| 2.1   | 2    | Database Schema & Drizzle Models | done | #78 | #66 | merged | 1.1 | ✅ Yes (done) |
| 2.2   | 2    | API Integration & Data Fetching | done | #79 | #67 | merged | 2.1 | ✅ Yes (done) |
| 2.3   | 2    | Sync Pipeline Core | done | #80 | #117 | merged | 2.2 | ✅ Yes (done) |
| 2.4   | 2    | Image Optimization Pipeline | done | #81 | #118 | merged | 2.3 | ✅ Yes (done) |
| 2.5   | 2    | Translation Pipeline | done | #82 | #119 | merged | 2.3 | ✅ Yes (done) |
| 2.6   | 2    | Lifestyle Tag Auto-Tagging | done | #83 | #120 | merged | 2.3 | ✅ Yes (done) |
| 2.7   | 2    | Sync Monitoring & Failure Resilience | done | #84 | #121 | merged | 2.3 | ✅ Yes (done) |
| 3.1   | 3    | Search Page Layout & Split-View | done | #85 | #122 | merged | none | ✅ Yes (done) |
| 3.2   | 3    | Interactive Map with Property Pins | done | #86 | #123 | merged | 3.1 | ✅ Yes (done) |
| 3.3   | 3    | Search Filters & URL State | done | #87 | #125 | merged | 3.1, 3.2 | ✅ Yes (done) |
| 3.4   | 3    | Lifestyle Tags & Smart Presets | done | #88 | #126 | merged | 3.3 | ✅ Yes (done) |
| 3.5   | 3    | Property Cards & Grid View | done | #89 | #127 | merged | 3.1 | ✅ Yes (done) |
| 3.6   | 3    | Mobile Pull-Up Sheet | done | #90 | #128 | merged | 3.1, 3.5 | ✅ Yes (done) |
| 3.7   | 3    | Unit Conversion & Price Display | done | #91 | #129 | merged | 3.5 | ✅ Yes (done) |
| 3.8   | 3    | No-Results, Hidden Listings & Near Me | done | #92 | #130 | merged | 3.3 | ✅ Yes (done) |
| 4.1   | 4    | Listing Detail Page & Photo Gallery | done | #93 | #131 | merged | none | ✅ Yes (done) |
| 4.2   | 4    | Agent Card & Contact CTAs | done | #94 | #132 | merged | 4.1 | ✅ Yes (done) |
| 4.3   | 4    | Agent Profile Pages | done | #95 | #133 | merged | 4.2 | ✅ Yes (done) |
| 4.4   | 4    | SEO Architecture & WordPress Redirects | done | #96 | #134 | merged | 4.1 | ✅ Yes (done) |
| 4.5   | 4    | Similar Properties & Cross-Linking | ready-for-dev | #97 | — | — | 4.1, 4.3 | ✅ Yes (4.3 merged) |
| 5.1   | 5    | Seller Landing Page & List With Us Form | backlog | #98 | — | — | none | ❌ No (epic 4 not complete) |
| 5.2   | 5    | CMA Request Form | backlog | #99 | — | — | 5.1 | ❌ No (epic 4 not complete) |
| 5.3   | 5    | Seller Lead Storage, Routing & Source Tracking | backlog | #100 | — | — | 5.1 | ❌ No (epic 4 not complete) |
| 6.1   | 6    | Area Guide Pages | backlog | #101 | — | — | none | ❌ No (epic 5 not complete) |
| 6.2   | 6    | Community Pages | backlog | #102 | — | — | 6.1 | ❌ No (epic 5 not complete) |
| 6.3   | 6    | Community Mini-Map & Geo-Fence Display | backlog | #103 | — | — | 6.2 | ❌ No (epic 5 not complete) |
| 6.4   | 6    | Investment Discovery & Area Context | backlog | #104 | — | — | 6.1 | ❌ No (epic 5 not complete) |
| 6.5   | 6    | Community Geo-Fence Auto-Tagging | backlog | #105 | — | — | 6.2 | ❌ No (epic 5 not complete) |
| 7.1   | 7    | Save & Shortlist Properties | backlog | #106 | — | — | none | ❌ No (epic 6 not complete) |
| 7.2   | 7    | Shortlist Comparison Page | backlog | #107 | — | — | 7.1 | ❌ No (epic 6 not complete) |
| 7.3   | 7    | Shareable Shortlist URL | backlog | #108 | — | — | 7.2 | ❌ No (epic 6 not complete) |
| 7.4   | 7    | Smart Agent Routing from Shortlist | backlog | #109 | — | — | 7.2 | ❌ No (epic 6 not complete) |
| 8.1   | 8    | Sync Status Dashboard & Monitoring | backlog | #110 | — | — | none | ❌ No (epic 7 not complete) |
| 8.2   | 8    | Lead Management & Agent Assignment | backlog | #111 | — | — | none | ❌ No (epic 7 not complete) |
| 8.3   | 8    | Bulk Lead Reassignment & Export | backlog | #112 | — | — | 8.2 | ❌ No (epic 7 not complete) |
| 8.4   | 8    | Lifestyle Tag Administration | backlog | #113 | — | — | none | ❌ No (epic 7 not complete) |
| 8.5   | 8    | Community Administration | backlog | #114 | — | — | none | ❌ No (epic 7 not complete) |
| 8.6   | 8    | Listing Visibility & SEO Monitoring | backlog | #115 | — | — | none | ❌ No (epic 7 not complete) |
| 8.7   | 8    | Shortlist Analytics | backlog | #116 | — | — | none | ❌ No (epic 7 not complete) |

## Dependency Chains

- **1.2** depends on: 1.1
- **1.3** depends on: 1.2
- **1.4** depends on: 1.1
- **1.5** depends on: 1.3, 1.4
- **1.6** depends on: 1.3, 1.4
- **1.7** depends on: 1.3
- **2.1** depends on: 1.1
- **2.2** depends on: 2.1
- **2.3** depends on: 2.2
- **2.4** depends on: 2.3
- **2.5** depends on: 2.3
- **2.6** depends on: 2.3
- **2.7** depends on: 2.3
- **3.1** depends on: Epic 2 complete
- **3.2** depends on: 3.1
- **3.3** depends on: 3.1, 3.2
- **3.4** depends on: 3.3
- **3.5** depends on: 3.1
- **3.6** depends on: 3.1, 3.5
- **3.7** depends on: 3.5
- **3.8** depends on: 3.3
- **4.1** depends on: Epic 3 complete
- **4.2** depends on: 4.1
- **4.3** depends on: 4.2
- **4.4** depends on: 4.1
- **4.5** depends on: 4.1, 4.3
- **5.1** depends on: Epic 4 complete
- **5.2** depends on: 5.1
- **5.3** depends on: 5.1
- **6.1** depends on: Epic 5 complete
- **6.2** depends on: 6.1
- **6.3** depends on: 6.2
- **6.4** depends on: 6.1
- **6.5** depends on: 6.2
- **7.1** depends on: Epic 6 complete
- **7.2** depends on: 7.1
- **7.3** depends on: 7.2
- **7.4** depends on: 7.2
- **8.1** depends on: Epic 7 complete
- **8.2** depends on: Epic 7 complete
- **8.3** depends on: 8.2
- **8.4** depends on: Epic 7 complete
- **8.5** depends on: Epic 7 complete
- **8.6** depends on: Epic 7 complete
- **8.7** depends on: Epic 7 complete

## Notes

- Epic 1 is fully complete (all 7 stories done and merged).
- Epic 2 is fully complete (all 7 stories done and merged). PR #121 for 2.7 merged 2026-04-26.
- Epic 2 complete: PRs #66, #67, #117, #118, #119, #120, #121 all merged.
- Epic 3 is fully complete (all 8 stories done and merged). PRs #122, #123, #125, #126, #127, #128, #129, #130 all merged.
- Epic 4 (Listing Detail & Agent Profiles) is now the active epic. Stories 4.1 and 4.2 are done and merged.
- Epic ordering is strictly enforced: Epic N cannot start until all stories in Epic N-1 have merged PRs.
- Updated 2026-05-02 (batch 2): PRs #128 (3.6), #129 (3.7), #130 (3.8) confirmed merged. Epic 3 marked done. Epic 4 stories now unblocked (4.1 Ready to Work).
- Updated 2026-05-02 (batch 4): PR #131 (4.1) merged 2026-05-02. PR #132 (4.2) merged 2026-05-03. Stories 4.3 and 4.4 are now unblocked (Ready to Work). Story 4.5 still blocked on 4.3 not merged.
- Updated 2026-05-03 (batch 5): PR #133 (4.3) merged 2026-05-03. Story 4.3 marked done. Story 4.5 now unblocked (both 4.1 and 4.3 merged). Next story: 4.4 (SEO Architecture & WordPress Redirects, GH #96).
- Updated 2026-05-03 (batch 6): PR #134 (4.4) merged 2026-05-03. Story 4.4 marked done. Stories 4.1–4.4 all done. Next story: 4.5 (Similar Properties & Cross-Linking, GH #97). 4.5 was already ready-for-dev (dependencies 4.1 + 4.3 both merged).
- No open PRs. No stale worktrees.
