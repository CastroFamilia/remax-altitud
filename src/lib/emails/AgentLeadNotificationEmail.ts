/**
 * AgentLeadNotificationEmail — Notification email sent TO an agent or the office
 *
 * Triggered when a visitor contacts an agent through their profile page,
 * submits a property inquiry, or submits any office-routed form (seller,
 * CMA, VIP buyer, recruitment, general contact).
 *
 * Contains the lead's details so the recipient can follow up directly.
 * When `source` and `intent` are provided, the email displays a clear
 * origin label so the office can instantly distinguish lead types.
 */

export type LeadSourceType =
  | "seller_form"
  | "cma_form"
  | "contact_form"
  | "vip_buyer_form"
  | "agent_contact"
  | "whatsapp"
  | "whatsapp_click";

export type LeadIntentType = "buy" | "sell" | "invest" | "recruit";

export interface AgentLeadNotificationEmailProps {
  locale: string;
  agentName: string;
  leadName: string;
  leadPhone: string;
  leadEmail: string | null;
  leadMessage: string | null;
  /** Form source — used to generate a human-readable origin label */
  source?: LeadSourceType | null;
  /** Lead intent — combined with source to refine the label */
  intent?: LeadIntentType | null;
}

// ---------------------------------------------------------------------------
// Human-readable source labels (bilingual)
// ---------------------------------------------------------------------------

interface SourceLabel {
  en: string;
  es: string;
  /** Color used for the badge background */
  color: string;
}

function getSourceLabel(
  source?: LeadSourceType | null,
  intent?: LeadIntentType | null,
): SourceLabel {
  if (!source) {
    return { en: "Website", es: "Sitio Web", color: "#6b7280" };
  }

  // Recruitment is a special case — same source as general contact but very different intent
  if (source === "contact_form" && intent === "recruit") {
    return {
      en: "🤝 Recruitment — Join Our Team",
      es: "🤝 Reclutamiento — Únete al Equipo",
      color: "#7c3aed",
    };
  }

  const labels: Record<LeadSourceType, SourceLabel> = {
    seller_form: { en: "🏠 Seller Inquiry", es: "🏠 Consulta de Vendedor", color: "#059669" },
    cma_form: {
      en: "📊 Property Valuation (CMA)",
      es: "📊 Valoración de Propiedad (CMA)",
      color: "#0284c7",
    },
    contact_form: { en: "📋 General Contact", es: "📋 Contacto General", color: "#d97706" },
    vip_buyer_form: {
      en: "⭐ VIP Buyer Service",
      es: "⭐ Servicio Comprador VIP",
      color: "#b45309",
    },
    agent_contact: {
      en: "👤 Agent Profile Contact",
      es: "👤 Contacto desde Perfil de Agente",
      color: "#dc2626",
    },
    whatsapp: { en: "💬 WhatsApp", es: "💬 WhatsApp", color: "#16a34a" },
    whatsapp_click: { en: "💬 WhatsApp Click", es: "💬 WhatsApp Click", color: "#16a34a" },
  };

  return labels[source];
}

export function renderAgentLeadNotificationEmail(props: AgentLeadNotificationEmailProps): {
  subject: string;
  html: string;
} {
  const isEs = props.locale === "es";
  const sourceLabel = getSourceLabel(props.source, props.intent);
  const sourceName = isEs ? sourceLabel.es : sourceLabel.en;

  // Subject line now includes the origin so it's scannable from the inbox
  const subject = isEs
    ? `[${sourceName}] Nuevo lead: ${props.leadName}`
    : `[${sourceName}] New lead: ${props.leadName}`;

  const greeting = isEs ? `Hola ${props.agentName},` : `Hi ${props.agentName},`;

  const intro = isEs
    ? `Tenés un nuevo lead desde el sitio web de RE/MAX Altitud. Aquí están los detalles:`
    : `You have a new lead from the RE/MAX Altitud website. Here are the details:`;

  const nameLabel = isEs ? "Nombre" : "Name";
  const phoneLabel = isEs ? "Teléfono" : "Phone";
  const emailLabel = isEs ? "Correo" : "Email";
  const sourceFieldLabel = isEs ? "Origen" : "Source";
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
          .source-badge {
            display: inline-block;
            margin-top: 12px;
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: bold;
            color: #ffffff;
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
            <span class="source-badge" style="background-color: ${sourceLabel.color};">${sourceName}</span>
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
                <tr>
                  <td>${sourceFieldLabel}:</td>
                  <td><strong>${sourceName}</strong></td>
                </tr>
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
