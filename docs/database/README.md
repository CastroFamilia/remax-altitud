# Database (PostgreSQL + PostGIS)

This project stores all platform data in PostgreSQL with the PostGIS extension
enabled. The schema is defined with Drizzle ORM under `src/lib/db/schema/` and
is the source of truth — migrations in `src/lib/db/migrations/` are generated
from it via `drizzle-kit`.

## Running Postgres + PostGIS locally

A minimal local stack is provided via `docker-compose.dev.yml` at the repo
root. It boots `postgis/postgis:16-3.4` with a persistent named volume.

```bash
docker compose -f docker-compose.dev.yml up -d
```

Default credentials (override with env vars before `docker compose up`):

```
POSTGRES_USER=remax
POSTGRES_PASSWORD=remax
POSTGRES_DB=remax_altitud
```

Matching `DATABASE_URL` for `.env.local`:

```
DATABASE_URL=postgresql://remax:remax@localhost:5432/remax_altitud
```

Any Postgres host works — Coolify, local `postgis/postgis:16-3.4` container,
or a managed service — as long as PostGIS 3.x is available.

## Applying migrations

```bash
npm run db:generate   # regenerate SQL from schema changes
npm run db:migrate    # run pending migrations against DATABASE_URL
npm run db:push       # dev-only: push schema without a migration (prototyping)
npm run db:studio     # open drizzle-kit studio UI
```

`npm run db:migrate` runs `tsx src/lib/db/migrate.ts`, which loads `.env.local`,
opens a single-use `postgres` client, and applies every pending migration in
`src/lib/db/migrations/`. The initial migration enables `postgis`
(`CREATE EXTENSION IF NOT EXISTS postgis`) and seeds the two `offices` rows.

## PostGIS `geography(Point, 4326)` convention

Drizzle 0.44 has no first-class `geography` helper. This project declares a
`customType` in [`src/lib/db/types/postgis.ts`](../../src/lib/db/types/postgis.ts)
that writes `SRID=4326;POINT(lng lat)` on INSERT/UPDATE.

**Reads return raw EWKB hex.** Do NOT attempt to parse it in JS. When a query
needs `{ lng, lat }` back, project through SQL:

```ts
const rows = await client`
  SELECT id,
         ST_X(geo::geometry)::float AS lng,
         ST_Y(geo::geometry)::float AS lat
  FROM properties
  WHERE id = ${id}
`;
```

Shared query helpers in `src/lib/db/queries/` should wrap this pattern to keep
downstream code clean.

## Adding a new migration

1. Update the table definition in `src/lib/db/schema/*.ts`.
2. `npm run db:generate` — drizzle-kit diffs the schema and emits a new SQL
   file in `src/lib/db/migrations/`.
3. Review the generated SQL carefully. Drizzle does **not** wrap destructive
   changes automatically — edit the file if needed.
4. `npm run db:migrate` — apply it.

## Testing against a live database

`tests/unit/db/schema.spec.ts` includes a geo round-trip, the seed check, and
index verification. The suite is auto-skipped when `DATABASE_URL` is not set
so CI without a database stays green. Run locally:

```bash
DATABASE_URL=postgresql://remax:remax@localhost:5432/remax_altitud npm test
```
