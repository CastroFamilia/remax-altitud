/**
 * Story 5.3: Seller Lead Storage, Routing & Source Tracking — Encryption Tests
 *
 * TDD Phase: RED — all tests will fail until encryption utility is implemented.
 *
 * Covers (from test-design-epic-5.md):
 *   5.3-UNIT-001 — encryptField() produces ciphertext (not plaintext) for phone and email
 *   5.3-UNIT-002 — leads table phone and email columns stored as ciphertext, not plaintext
 *
 * AC #7: Phone and email fields are encrypted at column level (AR17, NFR9)
 * Risk: R-001 (SEC, score 6) — PII stored in plaintext
 *
 * Implementation target: src/lib/utils/encryption.ts
 *   - encryptField(plaintext: string): string
 *   - decryptField(ciphertext: string): string
 *   - AES-256-GCM with random IV, key from LEAD_ENCRYPTION_KEY env var
 *   - Output format: iv:authTag:ciphertext (hex-encoded, colon-separated)
 *
 * Environment: node (.spec.ts → node project via vitest.config.mts)
 */

import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

// ---------------------------------------------------------------------------
// Set up test encryption key before importing the module
// The key must be 32 bytes (64 hex chars) for AES-256-GCM
// ---------------------------------------------------------------------------

const TEST_ENCRYPTION_KEY =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

beforeEach(() => {
  vi.stubEnv("LEAD_ENCRYPTION_KEY", TEST_ENCRYPTION_KEY);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

// ---------------------------------------------------------------------------
// 5.3-UNIT-001: encryptField() / decryptField() roundtrip and non-plaintext
// ---------------------------------------------------------------------------

describe("PII Encryption — encryptField / decryptField (5.3-UNIT-001)", () => {
  it("[P0] 5.3-UNIT-001a: encryptField() output is NOT the plaintext input for phone", async () => {
    const { encryptField } = await import("@/lib/utils/encryption");

    const phone = "+50688881234";
    const encrypted = encryptField(phone);

    // The encrypted value must NOT be the plaintext phone number
    expect(encrypted).not.toBe(phone);
    // Must be a non-empty string
    expect(encrypted.length).toBeGreaterThan(0);
  });

  it("[P0] 5.3-UNIT-001b: encryptField() output is NOT the plaintext input for email", async () => {
    const { encryptField } = await import("@/lib/utils/encryption");

    const email = "seller@example.com";
    const encrypted = encryptField(email);

    // The encrypted value must NOT be the plaintext email
    expect(encrypted).not.toBe(email);
    expect(encrypted.length).toBeGreaterThan(0);
  });

  it("[P0] 5.3-UNIT-001c: decryptField() round-trips correctly — decrypt(encrypt(x)) === x", async () => {
    const { encryptField, decryptField } = await import(
      "@/lib/utils/encryption"
    );

    const phone = "+50688881234";
    const encrypted = encryptField(phone);
    const decrypted = decryptField(encrypted);

    expect(decrypted).toBe(phone);
  });

  it("[P0] 5.3-UNIT-001d: encrypting the same value twice produces different ciphertext (random IV)", async () => {
    const { encryptField } = await import("@/lib/utils/encryption");

    const phone = "+50688881234";
    const encrypted1 = encryptField(phone);
    const encrypted2 = encryptField(phone);

    // Different IVs → different ciphertext
    expect(encrypted1).not.toBe(encrypted2);
  });

  it("[P0] 5.3-UNIT-001e: encrypted output follows iv:authTag:ciphertext format (colon-separated hex)", async () => {
    const { encryptField } = await import("@/lib/utils/encryption");

    const encrypted = encryptField("test-value");
    const parts = encrypted.split(":");

    // Must have exactly 3 colon-separated parts: iv, authTag, ciphertext
    expect(parts).toHaveLength(3);

    // Each part must be valid hex
    const hexRegex = /^[0-9a-f]+$/i;
    expect(parts[0]).toMatch(hexRegex); // IV
    expect(parts[1]).toMatch(hexRegex); // authTag
    expect(parts[2]).toMatch(hexRegex); // ciphertext
  });

  it("[P0] 5.3-UNIT-001f: decryptField() with tampered ciphertext throws an error (auth tag verification)", async () => {
    const { encryptField, decryptField } = await import(
      "@/lib/utils/encryption"
    );

    const encrypted = encryptField("sensitive-data");
    // Tamper with the ciphertext portion
    const parts = encrypted.split(":");
    parts[2] = "0000" + parts[2].slice(4); // corrupt ciphertext
    const tampered = parts.join(":");

    expect(() => decryptField(tampered)).toThrow();
  });

  it("[P0] 5.3-UNIT-001g: encryptField() handles empty string without throwing", async () => {
    const { encryptField, decryptField } = await import(
      "@/lib/utils/encryption"
    );

    const encrypted = encryptField("");
    expect(encrypted).not.toBe("");
    expect(encrypted.split(":")).toHaveLength(3);
    expect(decryptField(encrypted)).toBe("");
  });

  it("[P0] 5.3-UNIT-001h: encryptField() throws when LEAD_ENCRYPTION_KEY is missing", async () => {
    // Temporarily remove the key using stubEnv
    vi.stubEnv("LEAD_ENCRYPTION_KEY", "");

    // Force fresh import to pick up missing env var
    // Since the module is cached, we test getKey() indirectly via the function
    // The key is read on each call, so removing it should cause a throw
    const { encryptField } = await import("@/lib/utils/encryption");
    expect(() => encryptField("test")).toThrow(/LEAD_ENCRYPTION_KEY/);
  });
});

// ---------------------------------------------------------------------------
// hashField() — deterministic SHA-256 hashing for dedup
// ---------------------------------------------------------------------------

describe("PII Hashing — hashField (dedup support)", () => {
  it("[P0] hashField() produces deterministic SHA-256 hex hash", async () => {
    const { hashField } = await import("@/lib/utils/encryption");

    const phone = "+50688881234";
    const hash1 = hashField(phone);
    const hash2 = hashField(phone);

    // Same input must produce same hash (deterministic)
    expect(hash1).toBe(hash2);
    // Must be valid hex, 64 chars (SHA-256 = 256 bits = 64 hex chars)
    expect(hash1).toMatch(/^[0-9a-f]{64}$/);
    // Must NOT be the plaintext
    expect(hash1).not.toBe(phone);
  });

  it("[P0] hashField() produces different hashes for different inputs", async () => {
    const { hashField } = await import("@/lib/utils/encryption");

    const hash1 = hashField("+50688881234");
    const hash2 = hashField("+50688885678");

    expect(hash1).not.toBe(hash2);
  });
});

// ---------------------------------------------------------------------------
// 5.3-UNIT-002: Integration — leads table stores ciphertext, not plaintext
// (Requires DATABASE_URL — skipped when not available)
// ---------------------------------------------------------------------------

const DATABASE_URL = process.env.DATABASE_URL;
const describeDb = DATABASE_URL ? describe : describe.skip;

describeDb(
  "PII Encryption — DB column-level verification (5.3-UNIT-002, requires DATABASE_URL)",
  () => {
    it("[P0] 5.3-UNIT-002: phone and email stored in leads table are ciphertext, not plaintext", async () => {
      // This test verifies R-001: raw DB values for phone/email are NOT plaintext
      // It requires:
      //   1. leads table migrated (Drizzle schema)
      //   2. createLead() function implemented
      //   3. DATABASE_URL set

      const { default: postgres } = await import("postgres");
      const { drizzle } = await import("drizzle-orm/postgres-js");
      const { createLead } = await import("@/lib/db/queries/leads");
      const { sql } = await import("drizzle-orm");

      const client = postgres(DATABASE_URL!, { max: 1, prepare: false });
      const db = drizzle(client);

      const testPhone = "+50677771111";
      const testEmail = "test-encryption@example.com";

      try {
        // Create a lead with known phone and email
        const lead = await createLead({
          name: "Encryption Test",
          phone: testPhone,
          email: testEmail,
          source: "seller_form",
          intent: "sell",
          language: "en",
          assignedAgentId: null,
        });

        // Read raw DB values — bypass Drizzle column transformers
        const [rawRow] = await client<
          Array<{ phone: string; email: string }>
        >`SELECT phone, email FROM leads WHERE id = ${lead.id}`;

        // R-001: Raw phone must NOT be the plaintext phone number
        expect(rawRow.phone).not.toBe(testPhone);
        // R-001: Raw email must NOT be the plaintext email
        expect(rawRow.email).not.toBe(testEmail);

        // Cleanup
        await client`DELETE FROM leads WHERE id = ${lead.id}`;
      } finally {
        await client.end();
      }
    });
  },
);
