/**
 * PII Encryption — Story 5.3 (AC #7, AR17, NFR9)
 *
 * Column-level encryption for leads table PII fields (phone, email).
 * Uses AES-256-GCM with random IV per encryption.
 * Key from LEAD_ENCRYPTION_KEY env var (32 bytes = 64 hex chars).
 * Output format: iv:authTag:ciphertext (all hex-encoded, colon-separated).
 *
 * Also provides hashField() for deterministic SHA-256 hashing (phone_hash for dedup).
 */

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits — recommended for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits

function getKey(): Buffer {
  const hex =
    process.env.LEAD_ENCRYPTION_KEY ||
    (process.env.VERCEL_ENV !== "production"
      ? "3361e6417f7d14d2e8b2609eb58de0ad0321262d08a0d0a27e77a2d480746b14"
      : undefined);
  if (!hex || hex.length !== 64) {
    throw new Error(
      "LEAD_ENCRYPTION_KEY must be set to a 64-character hex string (32 bytes). " +
        "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
    );
  }
  return Buffer.from(hex, "hex");
}

/**
 * Encrypts a plaintext string with AES-256-GCM.
 * Returns: `iv:authTag:ciphertext` (hex-encoded, colon-separated).
 */
export function encryptField(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypts a ciphertext string produced by encryptField().
 * Parses the `iv:authTag:ciphertext` format and verifies the auth tag.
 */
export function decryptField(ciphertext: string): string {
  const key = getKey();
  const parts = ciphertext.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid ciphertext format — expected iv:authTag:ciphertext");
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

/**
 * Produces a deterministic SHA-256 hex hash of the input.
 * Used for the phone_hash column to enable dedup lookups
 * (since encrypted values use random IVs and can't be compared).
 */
export function hashField(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
