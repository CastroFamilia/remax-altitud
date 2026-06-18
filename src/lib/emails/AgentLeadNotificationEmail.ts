/**
 * AgentLeadNotificationEmail — Notification email sent TO an agent
 *
 * Triggered when a visitor contacts an agent through their profile page.
 * Contains the lead's details so the agent can follow up directly.
 */

export interface AgentLeadNotificationEmailProps {
  locale: string;
  agentName: string;
  leadName: string;
  leadPhone: string;
  leadEmail: string | null;
  leadMessage: string | null;
}

export function renderAgentLeadNotificationEmail(props: AgentLeadNotificationEmailProps): {
  subject: string;
  html: string;
} {
  const isEs = props.locale === "es";

  const subject = isEs
    ? `Nuevo lead: ${props.leadName} te contactó desde la web`
    : `New lead: ${props.leadName} contacted you from the website`;

  const greeting = isEs ? `Hola ${props.agentName},` : `Hi ${props.agentName},`;

  const intro = isEs
    ? `Tenés un nuevo lead desde el sitio web de RE/MAX Altitud. Aquí están los detalles:`
    : `You have a new lead from the RE/MAX Altitud website. Here are the details:`;

  const nameLabel = isEs ? "Nombre" : "Name";
  const phoneLabel = isEs ? "Teléfono" : "Phone";
  const emailLabel = isEs ? "Correo" : "Email";
  const messageLabel = isEs ? "Mensaje" : "Message";
  const noMessage = isEs ? "Sin mensaje adicional" : "No additional message";
  const ctaText = isEs ? "Responder lo antes posible" : "Please respond as soon as possible";

  const html = `
    <!DOCTYPE html>
    <html lang="${props.locale}">
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #f9f9f9;
            color: #333;
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid #eaeaec;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          }
          .header {
            background-color: #0b1528;
            color: #ffffff;
            padding: 24px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            color: #d4af37;
          }
          .header p {
            margin: 8px 0 0;
            font-size: 14px;
            color: #ffffff;
            opacity: 0.8;
          }
          .content {
            padding: 32px;
            line-height: 1.6;
          }
          .lead-card {
            background-color: #f3f4f6;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
            border-left: 4px solid #d4af37;
          }
          .lead-card table {
            width: 100%;
            border-collapse: collapse;
          }
          .lead-card td {
            padding: 6px 0;
            vertical-align: top;
            font-size: 14px;
          }
          .lead-card td:first-child {
            font-weight: bold;
            color: #0b1528;
            width: 100px;
          }
          .message-box {
            background-color: #fff;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 16px;
            margin-top: 12px;
            font-style: italic;
            color: #374151;
          }
          .cta {
            text-align: center;
            margin-top: 24px;
            padding: 16px;
            background-color: #fef9e7;
            border-radius: 6px;
            font-weight: bold;
            color: #0b1528;
          }
          .footer {
            text-align: center;
            padding: 24px;
            font-size: 12px;
            color: #6b7280;
            background-color: #f9f9f9;
            border-top: 1px solid #eaeaec;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>RE/MAX Altitud</h1>
            <p>${isEs ? "🔔 Nuevo Lead" : "🔔 New Lead"}</p>
          </div>
          <div class="content">
            <p>${greeting}</p>
            <p>${intro}</p>

            <div class="lead-card">
              <table>
                <tr>
                  <td>${nameLabel}:</td>
                  <td>${props.leadName}</td>
                </tr>
                <tr>
                  <td>${phoneLabel}:</td>
                  <td>${props.leadPhone}</td>
                </tr>
                ${
                  props.leadEmail
                    ? `<tr><td>${emailLabel}:</td><td><a href="mailto:${props.leadEmail}">${props.leadEmail}</a></td></tr>`
                    : ""
                }
              </table>

              ${
                props.leadMessage
                  ? `
                <p style="margin-bottom: 4px; font-weight: bold; color: #0b1528;">${messageLabel}:</p>
                <div class="message-box">${props.leadMessage}</div>
              `
                  : `<p style="color: #6b7280; font-size: 13px;">${noMessage}</p>`
              }
            </div>

            <div class="cta">
              ⚡ ${ctaText}
            </div>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} RE/MAX Altitud. ${isEs ? "Todos los derechos reservados." : "All rights reserved."}</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return { subject, html };
}
