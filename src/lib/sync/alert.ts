import "server-only";

/**
 * Sends a failure alert to the configured Slack webhook (if set).
 * If no webhook is configured, logs a warning and returns without throwing.
 * Alert failures are swallowed — they must NEVER crash the sync pipeline.
 *
 * Architecture §11 — Admin Alert Flow: sync failure → notification to admin.
 * TODO: Add email alert (email/WhatsApp) once an email service is added to the project.
 */
export async function sendSyncFailureAlert(errorMessage: string): Promise<void> {
  const webhookUrl = process.env.ALERT_SLACK_WEBHOOK;

  if (!webhookUrl) {
    console.warn("[sync/alert] No ALERT_SLACK_WEBHOOK configured. Sync failure:", errorMessage);
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: `[remax-altitud] Sync failure: ${errorMessage}` }),
    });
    if (!response.ok) {
      // Non-2xx from Slack (e.g. 429 rate limit, 403 invalid token) — log but do not throw
      console.warn(
        "[sync/alert] Slack webhook returned non-2xx:",
        response.status,
        response.statusText,
      );
    }
  } catch (err) {
    // Alert delivery failure must not propagate — site resilience takes priority
    console.warn("[sync/alert] Failed to send Slack alert:", err);
  }
}
