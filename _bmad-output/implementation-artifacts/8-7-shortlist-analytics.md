# Story 8.7: Shortlist Analytics

Status: ready-for-dev

## Story

As an **admin**,
I want to view anonymous shortlist analytics for properties,
So that I can identify high-demand listings, track saving trends, and view demand intelligence alongside client leads.

## Acceptance Criteria

1. **Given** a visitor saves or unsaves a property from their shortlist (via the Epic 7 `SaveButton` client component)
   **When** the save or unsave action occurs
   **Then** an anonymous analytics event is fired containing: `property_id`, `locale` (en/es), `action` ("save" or "unsave"), and the creation timestamp. No visitor-identifying data (IP, cookies, session IDs, or fingerprints) is captured or stored in the database (FR66).

2. **Given** the admin dashboard navigation sidebar
   **When** the admin loads the portal
   **Then** a sidebar link to "Shortlist Analytics" is visible and routes to `/admin/analytics/shortlist` (using Lucide `BarChart3` icon) (FR66).

3. **Given** the admin opens the shortlist analytics view `/admin/analytics/shortlist`
   **When** the view loads
   **Then** each property is displayed in a searchable and paginated table including: total saves (all-time), saves in the last 30 days, and current active shortlist count (computed as `saves - unsaves`). Properties with 0 saves must be included and show "0 saves" rather than being hidden or excluded (FR66).

4. **Given** the admin shortlist analytics view
   **When** sorted by popularity
   **Then** properties are ranked by the 30-day save count ("most shortlisted"), enabling easy identification of high-demand listings (FR66).

5. **Given** the admin opens the lead management view (`/admin/leads`)
   **When** a lead references a specific property
   **Then** the active shortlist popularity count (current saves) for that property is visible alongside the property reference (e.g., "#Ref (X saves)"), providing instant demand intelligence to the agent receiving the lead (FR66).

6. **Given** the storage requirement for shortlist events
   **When** events are logged or queried
   **Then** they operate on a new, lightweight `shortlist_events` PostgreSQL table without any PII columns, referencing the `properties` table, and optimized with composite indexes (NFR9).

## Tasks / Subtasks

- [ ] 1. Create a new Drizzle schema file `src/lib/db/schema/shortlist-events.ts` defining the `shortlist_events` table and export it from `src/lib/db/schema/index.ts`.
- [ ] 2. Update `SaveButton` in `src/components/shortlist/save-button.tsx` to asynchronously trigger a POST request to `/api/shortlist/events` immediately upon saving or unsaving, passing the `propertyId`, `action` ("save" | "unsave"), and current `locale`. Ensure this is non-blocking to the Heart UI toggle feel.
- [ ] 3. Create public route handler `src/app/api/shortlist/events/route.ts` that parses, validates via Zod, and inserts anonymous events into `shortlist_events` table. Verify `propertyId` exists in the database.
- [ ] 4. Create database query `fetchShortlistAnalyticsData` in `src/lib/db/queries/properties.ts` (or a new shortlist query file) to retrieve all properties with aggregated analytics: `totalSaves`, `saves30Days`, and `activeSaves` (computed as sum of saves minus unsaves). Implement pagination, searching, and sorting (by saves30Days, totalSaves, activeSaves, or property code).
- [ ] 5. Create server action `getShortlistAnalyticsAction` in `src/app/actions/admin-analytics-actions.ts` protected by admin authentication (`verifyAdminAuth()`).
- [ ] 6. Update `src/app/[locale]/admin/layout.tsx` to add "Shortlist Analytics" navigation link using Lucide `BarChart3` icon. Add corresponding translation strings in `en.json` and `es.json` under the `Admin` namespace.
- [ ] 7. Create admin analytics page at `src/app/[locale]/admin/analytics/shortlist/page.tsx` rendering a premium searchable, paginated table of properties with their shortlist metrics, sorting triggers, and search inputs matching the dashboard's dark slate aesthetics.
- [ ] 8. Update the `getLeads` function in `src/lib/db/queries/leads.ts` to left-join with a property saves subquery so that `propertyPopularityCount` is returned with leads.
- [ ] 9. Update the leads table view component `src/components/admin/admin-leads-table.tsx` to display the popularity saves count inline next to the property reference (e.g. `Property Ref: #123 (X saves)`).
- [ ] 10. Write unit tests in `tests/unit/admin/analytics.test.ts` to verify the DB query aggregations, Zod validations, and API route handler behavior.
- [ ] 11. Write E2E tests in `tests/e2e/admin/analytics.spec.ts` using Playwright verifying the click event analytics logging, analytics dashboard loading, sorting by popularity, and visibility of property saves in the leads page.

## Dev Notes

### Database Schema Definition

Create `src/lib/db/schema/shortlist-events.ts`:
```typescript
import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { properties } from "./properties";

export const shortlistEvents = pgTable(
  "shortlist_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    locale: text("locale").notNull(),
    action: text("action").notNull(), // 'save' | 'unsave'
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    propertyActionIdx: index("idx_shortlist_events_prop_action").on(table.propertyId, table.action, table.createdAt),
    createdIdx: index("idx_shortlist_events_created").on(table.createdAt),
  })
);

export type ShortlistEvent = typeof shortlistEvents.$inferSelect;
export type NewShortlistEvent = typeof shortlistEvents.$inferInsert;
```

Export this from `src/lib/db/schema/index.ts`:
```typescript
export * from "./shortlist-events";
```

### Event Tracking Endpoint

Define public POST endpoint at `src/app/api/shortlist/events/route.ts` with Zod schema validation:
```typescript
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { shortlistEvents } from "@/lib/db/schema/shortlist-events";
import { eq } from "drizzle-orm";
import { properties } from "@/lib/db/schema/properties";

const eventInputSchema = z.object({
  propertyId: z.string().uuid("Invalid property ID format"),
  action: z.enum(["save", "unsave"]),
  locale: z.enum(["en", "es"]),
});

export async function POST(request: Request) {
  try {
    const rawBody = await request.json();
    const parseResult = eventInputSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json({ error: "Validation failed", issues: parseResult.error.issues }, { status: 400 });
    }

    const { propertyId, action, locale } = parseResult.data;

    // Verify property exists
    const propExists = await db.select({ id: properties.id }).from(properties).where(eq(properties.id, propertyId)).limit(1);
    if (propExists.length === 0) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    await db.insert(shortlistEvents).values({
      propertyId,
      action,
      locale,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to record event" }, { status: 500 });
  }
}
```

### SaveButton Integration

In `src/components/shortlist/save-button.tsx`, retrieve locale using `useLocale` and post the analytics event asynchronously inside `handleToggle`:
```typescript
import { useLocale } from "next-intl";
// ...
const locale = useLocale() as "en" | "es";

// Trigger tracking asynchronously (fire-and-forget style to keep UI instantly responsive)
fetch("/api/shortlist/events", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ propertyId, action: saved ? "unsave" : "save", locale }),
}).catch((err) => console.error("Failed to track shortlist event:", err));
```

### Analytics Aggregation Query

Implement the database query to return all properties and their counts:
```typescript
import { sql, eq, and, or, ilike, desc, asc } from "drizzle-orm";
import { shortlistEvents } from "@/lib/db/schema/shortlist-events";
import { properties } from "@/lib/db/schema/properties";

export async function fetchShortlistAnalyticsData(filters: {
  search?: string;
  sortBy?: "saves30" | "savesAll" | "active" | "code";
  sortOrder?: "asc" | "desc";
  limit?: number;
  offset?: number;
}) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Group-by aggregations query
  const query = db
    .select({
      id: properties.id,
      apiId: properties.apiId,
      titleEn: properties.titleEn,
      titleEs: properties.titleEs,
      totalSaves: sql<number>`count(case when ${shortlistEvents.action} = 'save' then 1 end)::int`,
      saves30Days: sql<number>`count(case when ${shortlistEvents.action} = 'save' and ${shortlistEvents.createdAt} >= ${thirtyDaysAgo} then 1 end)::int`,
      activeSaves: sql<number>`coalesce(sum(case when ${shortlistEvents.action} = 'save' then 1 when ${shortlistEvents.action} = 'unsave' then -1 else 0 end), 0)::int`,
    })
    .from(properties)
    .leftJoin(shortlistEvents, eq(properties.id, shortlistEvents.propertyId))
    .groupBy(properties.id);

  // Add search
  if (filters.search) {
    query.where(
      or(
        ilike(properties.apiId, `%${filters.search}%`),
        ilike(properties.titleEn, `%${filters.search}%`),
        ilike(properties.titleEs, `%${filters.search}%`)
      )
    );
  }

  // Handle sorting
  const order = filters.sortOrder === "asc" ? asc : desc;
  if (filters.sortBy === "saves30") {
    query.orderBy(order(sql`saves30Days`), desc(properties.createdAt));
  } else if (filters.sortBy === "savesAll") {
    query.orderBy(order(sql`totalSaves`), desc(properties.createdAt));
  } else if (filters.sortBy === "active") {
    query.orderBy(order(sql`activeSaves`), desc(properties.createdAt));
  } else {
    query.orderBy(order(properties.apiId));
  }

  const limit = filters.limit ?? 20;
  const offset = filters.offset ?? 0;

  return await query.limit(limit).offset(offset);
}
```

### Lead Popularity Count Join

Update `getLeads` inside `src/lib/db/queries/leads.ts` to return property popularity saves count:
```typescript
  // Create an active saves subquery
  const propertySaves = db
    .select({
      propertyId: shortlistEvents.propertyId,
      count: sql<number>`coalesce(sum(case when ${shortlistEvents.action} = 'save' then 1 when ${shortlistEvents.action} = 'unsave' then -1 else 0 end), 0)::int`.as("saves_count"),
    })
    .from(shortlistEvents)
    .groupBy(shortlistEvents.propertyId)
    .as("property_saves");

  const query = db
    .select({
      lead: leads,
      agentName: agents.name,
      propertyApiId: properties.apiId,
      propertyPopularityCount: sql<number>`coalesce(${propertySaves.count}, 0)::int`,
    })
    .from(leads)
    .leftJoin(agents, eq(leads.assignedAgentId, agents.id))
    .leftJoin(properties, eq(leads.propertyId, properties.id))
    .leftJoin(propertySaves, eq(properties.id, propertySaves.propertyId));
```

### References

- Shortlist shares: [Source: src/lib/db/schema/shortlist-shares.ts]
- Properties schema: [Source: src/lib/db/schema/properties.ts]
- Leads database queries: [Source: src/lib/db/queries/leads.ts]
- Admin Dashboard Sidebar navigation: [Source: src/app/[locale]/admin/layout.tsx]
- Visitor wishlist Heart CTA component: [Source: src/components/shortlist/save-button.tsx]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
