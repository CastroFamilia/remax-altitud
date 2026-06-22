#!/usr/bin/env node
/**
 * Quick Resend smoke-test — run from the project root:
 *
 *   npx tsx scripts/test-resend.ts                    # sends to the sender address itself
 *   npx tsx scripts/test-resend.ts you@example.com    # sends to a custom recipient
 *
 * On Coolify (production):
 *   node dist/test-resend.mjs                         # env vars injected by Coolify
 *   node dist/test-resend.mjs you@example.com
 *
 * Reads RESEND_API_KEY and EMAIL_SENDER_ADDRESS from .env.local (local) or
 * the environment (production).
 */

// Load .env.local when running locally — silently skip in production
try { await import("dotenv/config"); } catch {}

import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
  console.error("❌  RESEND_API_KEY is not set in .env.local — aborting.");
  process.exit(1);
}

const sender = process.env.EMAIL_SENDER_ADDRESS || "info@remax-altitud.cr";
const recipient = process.argv[2] || sender; // default: send to yourself

console.log(`📧  Sending test email…`);
console.log(`    From : RE/MAX Altitud <${sender}>`);
console.log(`    To   : ${recipient}`);

const resend = new Resend(apiKey);

try {
  const { data, error } = await resend.emails.send({
    from: `RE/MAX Altitud <${sender}>`,
    to: recipient,
    subject: "🔔 Resend Test — RE/MAX Altitud",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto; padding: 24px;">
        <h2 style="color: #003DA5;">✅ Resend is working!</h2>
        <p>This is a test email sent at <strong>${new Date().toISOString()}</strong>.</p>
        <hr style="border: none; border-top: 1px solid #ddd;" />
        <p style="color: #888; font-size: 12px;">Sent from the test-resend.ts script.</p>
      </div>
    `,
  });

  if (error) {
    console.error("❌  Resend returned an error:", error);
    process.exit(1);
  }

  console.log("✅  Email sent successfully!");
  console.log("    ID:", data?.id);
} catch (err) {
  console.error("❌  Unexpected error:", err);
  process.exit(1);
}
