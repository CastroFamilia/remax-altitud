/**
 * upsertProperty — slug conflict retry (fix for Drizzle + postgres-js error wrapping)
 * Module: src/lib/db/queries/properties.ts
 *
 * Background:
 *   Drizzle (postgres-js driver) wraps postgres errors so that:
 *     err.message  = "Failed query: insert into \"properties\" ..."  (no "unique")
 *     err.cause    = PostgresError { message: "duplicate key value violates unique
 *                    constraint \"properties_slug_unique\"" }
 *
 *   The original code only checked err.message, so the suffix-retry never fired when
 *   two listings share an identical English title (e.g. api_id 162576 vs 162577).
 *
 * Fix verified here:
 *   upsertProperty detects slug conflicts via err.cause.message as well as err.message,
 *   then retries with a `<slug>-<apiId>` suffix that is guaranteed unique per listing.
 *
 * All DB calls are mocked via vi.mock — no live DATABASE_URL required.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Hoisted mock primitives for the db.insert chain
// db.insert(table).values(vals).onConflictDoUpdate(conf) → Promise<void>
// ---------------------------------------------------------------------------

const { mockOnConflictDoUpdate, mockValues, mockInsert } = vi.hoisted(() => {
  const mockOnConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
  const mockValues = vi.fn().mockReturnValue({ onConflictDoUpdate: mockOnConflictDoUpdate });
  const mockInsert = vi.fn().mockReturnValue({ values: mockValues });
  return { mockOnConflictDoUpdate, mockValues, mockInsert };
});

// ---------------------------------------------------------------------------
// Mock Drizzle client with insert support
// ---------------------------------------------------------------------------

vi.mock("@/lib/db/client", () => ({
  db: {
    insert: mockInsert,
  },
}));

// ---------------------------------------------------------------------------
// Imports — resolved after mocks are hoisted
// ---------------------------------------------------------------------------

import { upsertProperty } from "@/lib/db/queries/properties";
import { makeRawProperty } from "../sync/factories";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Builds an error shaped like Drizzle (postgres-js) wraps a real postgres error.
 * The outer error has a generic "Failed query: ..." message; the real postgres
 * error lives in .cause.
 */
function makeDrizzleSlugConflictError(): Error {
  const pgError = new Error(
    'duplicate key value violates unique constraint "properties_slug_unique"',
  );
  const drizzleError = Object.assign(
    new Error("Failed query: insert into \"properties\" (\"id\", \"api_id\", ...) values (...)"),
    { cause: pgError },
  );
  return drizzleError;
}

/**
 * Builds an error where the postgres message is directly in err.message
 * (node-postgres style, or future Drizzle adapters) — tests backward compat.
 */
function makeLegacySlugConflictError(): Error {
  return new Error(
    'duplicate key value violates unique constraint "properties_slug_unique"',
  );
}

/**
 * Builds a non-slug unique constraint error (e.g. api_id conflict, should not retry).
 */
function makeApiIdConflictError(): Error {
  const pgError = new Error(
    'duplicate key value violates unique constraint "properties_api_id_unique"',
  );
  return Object.assign(
    new Error("Failed query: insert into \"properties\" ..."),
    { cause: pgError },
  );
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  mockOnConflictDoUpdate.mockResolvedValue(undefined);
  mockValues.mockReturnValue({ onConflictDoUpdate: mockOnConflictDoUpdate });
  mockInsert.mockReturnValue({ values: mockValues });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Happy path
// ---------------------------------------------------------------------------

describe("upsertProperty — happy path", () => {
  it(
    "[P0] given a valid RawProperty when upsertProperty is called then db.insert is called once",
    async () => {
      const raw = makeRawProperty({ apiId: "162576", titleEn: "Mountain View Land" });

      await upsertProperty(raw, "office-uuid-pz", "agent-uuid-1", "hash-abc");

      expect(mockInsert).toHaveBeenCalledOnce();
    },
  );

  it(
    "[P0] given a valid RawProperty when upsertProperty is called then values() is called with the correct apiId",
    async () => {
      const raw = makeRawProperty({ apiId: "162576", titleEn: "Mountain View Land" });

      await upsertProperty(raw, "office-uuid-pz", "agent-uuid-1", "hash-abc");

      expect(mockValues).toHaveBeenCalledOnce();
      const payload = mockValues.mock.calls[0][0] as Record<string, unknown>;
      expect(payload.apiId).toBe("162576");
    },
  );

  it(
    "[P0] given a valid RawProperty when upsertProperty is called then onConflictDoUpdate is called once (no retry)",
    async () => {
      const raw = makeRawProperty({ apiId: "162576" });

      await upsertProperty(raw, "office-uuid-pz", null, "hash-abc");

      expect(mockOnConflictDoUpdate).toHaveBeenCalledOnce();
    },
  );

  it(
    "[P1] given agentId=null when upsertProperty is called then values() payload has agentId=null",
    async () => {
      const raw = makeRawProperty({ apiId: "162576" });

      await upsertProperty(raw, "office-uuid-pz", null, "hash-abc");

      const payload = mockValues.mock.calls[0][0] as Record<string, unknown>;
      expect(payload.agentId).toBeNull();
    },
  );

  it(
    "[P2] given upsertProperty resolves successfully then the function returns void (undefined)",
    async () => {
      const raw = makeRawProperty({ apiId: "162576" });

      const result = await upsertProperty(raw, "office-uuid-pz", null);

      expect(result).toBeUndefined();
    },
  );
});

// ---------------------------------------------------------------------------
// Slug conflict retry — err.cause path (the Drizzle + postgres-js fix)
// ---------------------------------------------------------------------------

describe("upsertProperty — slug conflict retry via err.cause (Drizzle + postgres-js)", () => {
  it(
    "[P0] given two listings share the same title slug when the first insert throws a slug conflict via err.cause then db.insert is called a second time",
    async () => {
      // Arrange: first insert throws the Drizzle-wrapped postgres error
      mockOnConflictDoUpdate
        .mockRejectedValueOnce(makeDrizzleSlugConflictError())
        .mockResolvedValueOnce(undefined); // retry succeeds

      const raw = makeRawProperty({
        apiId: "162577",
        titleEn: "For Sale: One of 3 Premium Lots in Santa Rosa, Perez Zeledon",
      });

      // Act
      await upsertProperty(raw, "office-uuid-pz", null);

      // Assert: insert called twice (initial attempt + retry)
      expect(mockInsert).toHaveBeenCalledTimes(2);
    },
  );

  it(
    "[P0] given slug conflict via err.cause when retry fires then the retry values() call uses the apiId-suffixed slug",
    async () => {
      mockOnConflictDoUpdate
        .mockRejectedValueOnce(makeDrizzleSlugConflictError())
        .mockResolvedValueOnce(undefined);

      const raw = makeRawProperty({
        apiId: "162577",
        titleEn: "Stunning Property",
      });

      await upsertProperty(raw, "office-uuid-pz", null);

      // The second values() call must include the apiId suffix in the slug
      const retryPayload = mockValues.mock.calls[1][0] as Record<string, unknown>;
      expect(typeof retryPayload.slug).toBe("string");
      expect(retryPayload.slug as string).toContain("162577");
    },
  );

  it(
    "[P0] given slug conflict via err.cause when retry fires then the initial slug is NOT reused in the retry",
    async () => {
      mockOnConflictDoUpdate
        .mockRejectedValueOnce(makeDrizzleSlugConflictError())
        .mockResolvedValueOnce(undefined);

      const raw = makeRawProperty({ apiId: "162577", titleEn: "Stunning Property" });

      await upsertProperty(raw, "office-uuid-pz", null);

      const firstSlug = (mockValues.mock.calls[0][0] as Record<string, unknown>).slug as string;
      const retrySlug = (mockValues.mock.calls[1][0] as Record<string, unknown>).slug as string;
      expect(retrySlug).not.toBe(firstSlug);
    },
  );

  it(
    "[P1] given slug conflict via err.cause when upsertProperty is called then the function resolves without throwing",
    async () => {
      mockOnConflictDoUpdate
        .mockRejectedValueOnce(makeDrizzleSlugConflictError())
        .mockResolvedValueOnce(undefined);

      const raw = makeRawProperty({ apiId: "162577", titleEn: "Shared Title" });

      await expect(upsertProperty(raw, "office-uuid-pz", null)).resolves.toBeUndefined();
    },
  );
});

// ---------------------------------------------------------------------------
// Slug conflict retry — err.message path (legacy / node-postgres compat)
// ---------------------------------------------------------------------------

describe("upsertProperty — slug conflict retry via err.message (legacy compat)", () => {
  it(
    "[P1] given slug conflict in err.message directly when the first insert throws then db.insert is called a second time",
    async () => {
      mockOnConflictDoUpdate
        .mockRejectedValueOnce(makeLegacySlugConflictError())
        .mockResolvedValueOnce(undefined);

      const raw = makeRawProperty({ apiId: "162577", titleEn: "Shared Title" });

      await upsertProperty(raw, "office-uuid-pz", null);

      expect(mockInsert).toHaveBeenCalledTimes(2);
    },
  );
});

// ---------------------------------------------------------------------------
// Non-slug errors must NOT trigger the retry
// ---------------------------------------------------------------------------

describe("upsertProperty — non-slug errors re-throw without retry", () => {
  it(
    "[P0] given a unique constraint violation on api_id (not slug) when insert throws then the error is re-thrown without retry",
    async () => {
      const apiIdError = makeApiIdConflictError();
      mockOnConflictDoUpdate.mockRejectedValueOnce(apiIdError);

      const raw = makeRawProperty({ apiId: "162577" });

      await expect(upsertProperty(raw, "office-uuid-pz", null)).rejects.toThrow(apiIdError);
      // Only one insert attempt — no retry
      expect(mockInsert).toHaveBeenCalledOnce();
    },
  );

  it(
    "[P0] given a generic DB connection error when insert throws then the error is re-thrown without retry",
    async () => {
      const connectionError = new Error("Connection refused");
      mockOnConflictDoUpdate.mockRejectedValueOnce(connectionError);

      const raw = makeRawProperty({ apiId: "162577" });

      await expect(upsertProperty(raw, "office-uuid-pz", null)).rejects.toThrow(
        "Connection refused",
      );
      expect(mockInsert).toHaveBeenCalledOnce();
    },
  );

  it(
    "[P1] given a non-Error thrown value when insert throws then it is re-thrown without retry",
    async () => {
      mockOnConflictDoUpdate.mockRejectedValueOnce("plain string error");

      const raw = makeRawProperty({ apiId: "162577" });

      await expect(upsertProperty(raw, "office-uuid-pz", null)).rejects.toBe("plain string error");
      expect(mockInsert).toHaveBeenCalledOnce();
    },
  );
});

// ---------------------------------------------------------------------------
// Retry itself fails — must propagate, not loop
// ---------------------------------------------------------------------------

describe("upsertProperty — retry failure propagates up", () => {
  it(
    "[P1] given slug conflict on first attempt AND suffix slug also conflicts when called then the retry error is propagated",
    async () => {
      const secondConflict = makeDrizzleSlugConflictError();
      mockOnConflictDoUpdate
        .mockRejectedValueOnce(makeDrizzleSlugConflictError()) // first attempt
        .mockRejectedValueOnce(secondConflict); // retry also fails

      const raw = makeRawProperty({ apiId: "162577", titleEn: "Shared Title" });

      await expect(upsertProperty(raw, "office-uuid-pz", null)).rejects.toThrow(secondConflict);
      // Both attempts were made
      expect(mockInsert).toHaveBeenCalledTimes(2);
    },
  );
});
