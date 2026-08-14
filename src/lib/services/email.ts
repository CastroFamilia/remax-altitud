import { Resend } from "resend";

export interface SendEmailPayload {
  to: string;
  subject: string;
  html: string;
}

/**
 * Sends an email in the background using Resend.
 * Non-blocking: catches errors silently so it never interrupts the user request.
 */
export async function sendEmailInBackground(payload: SendEmailPayload) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.log("Email sending skipped: RESEND_API_KEY not set.");
      return;
    }

    // Default to the provided env var, or fallback to a standard domain email
    const sender = process.env.EMAIL_SENDER_ADDRESS || "info@remax-altitud.cr";

    // We import Resend dynamically to keep it out of client bundles just in case
    const resend = new Resend(apiKey);

    resend.emails
      .send({
        from: `REMAX Altitud <${sender}>`,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      })
      .catch((err) => {
        console.error("Failed to send email via Resend:", err);
      });
  } catch (error) {
    console.error("Failed to prepare email payload:", error);
  }
}
