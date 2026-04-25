import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { afterAll, describe, expect, it } from "vitest";
import { offices, properties } from "@/lib/db/schema";

const DATABASE_URL = process.env.DATABASE_URL;
const describeDb = DATABASE_URL ? describe : describe.skip;

describeDb("database schema (requires DATABASE_URL)", () => {
  const client = postgres(DATABASE_URL!, { max: 1, prepare: false });
  const db = drizzle(client);

  afterAll(async () => {
    await client.end();
  });

  it("seeds exactly two offices", async () => {
    const rows = await db.select().from(offices);
    expect(rows.length).toBe(2);
    const guids = rows.map((r) => r.apiGuid);
    expect(guids).toContain("FEA8746D-CC1D-41B8-89F3-D04AC98274AF");
    expect(guids).toContain("4AD5AE8F-5B47-4A1A-A953-40445F2B4940");
  });

  it("creates the PostGIS GiST index idx_properties_geo", async () => {
    const indexes = await client`
      SELECT indexname, indexdef FROM pg_indexes
      WHERE tablename = 'properties' AND indexname = 'idx_properties_geo'
    `;
    expect(indexes).toHaveLength(1);
    expect(indexes[0].indexdef).toMatch(/USING gist/i);
  });

  it("round-trips a property row with a geography point", async () => {
    const [office] = await db.select().from(offices).limit(1);
    expect(office, "offices seed missing").toBeDefined();

    const suffix = randomUUID();
    const apiId = `test-${suffix}`;
    const slug = `test-property-${suffix}`;

    const lng = -83.7;
    const lat = 9.37;

    await db.insert(properties).values({
      apiId,
      officeId: office.id,
      slug,
      propertyType: "house",
      priceUsd: 100_000,
      titleEn: "Test Villa",
      titleEs: "Villa de Prueba",
      geo: { lng, lat },
    });

    try {
      const [row] = await client<Array<{ id: string; lng: number; lat: number }>>`
        SELECT id,
               ST_X(geo::geometry)::float AS lng,
               ST_Y(geo::geometry)::float AS lat
        FROM properties
        WHERE api_id = ${apiId}
      `;

      expect(row).toBeDefined();
      expect(row.lng).toBeCloseTo(lng, 5);
      expect(row.lat).toBeCloseTo(lat, 5);
    } finally {
      await db.delete(properties).where(sql`api_id = ${apiId}`);
    }
  });
});
