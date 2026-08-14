/**
 * GenericLeadConfirmationEmail — Bilingual auto-responder email template
 *
 * Sent to leads who provide an email address on any form:
 * seller_form, cma_form, contact_form (VIP/general), agent_contact.
 *
 * Follows the same branded structure as PropertyInquiryEmail:
 * navy header → gold accent → agent/office contact card → footer.
 */

export type LeadSource =
  | "seller_form"
  | "cma_form"
  | "contact_form"
  | "vip_buyer_form"
  | "agent_contact"
  | "whatsapp"
  | "whatsapp_click";

export type LeadIntent = "buy" | "sell" | "invest" | "recruit";

export interface GenericLeadConfirmationEmailProps {
  locale: string;
  source: LeadSource;
  leadName: string;
  agentName?: string | null;
  agentEmail?: string | null;
  agentPhone?: string | null;
  /** Only used for agent_contact — shows the specific agent they reached out to */
  contactedAgentName?: string | null;
  /** When set, overrides the contact_form copy to reference the shortlist */
  shortlistUrl?: string | null;
  /** Lead intent — used to detect recruitment and show custom copy */
  intent?: LeadIntent | null;
}

/**
 * Returns source-specific copy for the email body.
 */
function getSourceCopy(
  source: LeadSource,
  isEs: boolean,
  contactedAgentName?: string | null,
  shortlistUrl?: string | null,
  intent?: LeadIntent | null,
): { subject: string; headline: string; message: string } {
  // Recruitment is detected by intent, not source (same source as general contact)
  if (source === "contact_form" && intent === "recruit") {
    return {
      subject: isEs
        ? "Hemos recibido su solicitud para unirse al equipo"
        : "We received your application to join our team",
      headline: isEs ? "¡Solicitud recibida!" : "Application Received!",
      message: isEs
        ? "Gracias por su interés en unirse al equipo de REMAX Altitud. Hemos recibido su información y revisaremos su solicitud. Nos pondremos en contacto con usted a la brevedad."
        : "Thank you for your interest in joining the REMAX Altitud team. We have received your information and will review your application. We will get back to you shortly.",
    };
  }

  switch (source) {
    case "seller_form":
      return {
        subject: isEs ? "Hemos recibido su consulta de venta" : "We received your seller inquiry",
        headline: isEs ? "¡Consulta recibida!" : "Inquiry Received!",
        message: isEs
          ? "Gracias por su interés en vender su propiedad con REMAX Altitud. Hemos recibido su información y uno de nuestros agentes se pondrá en contacto con usted muy pronto para ayudarle con el proceso."
          : "Thank you for your interest in selling your property with REMAX Altitud. We have received your information and one of our agents will contact you very soon to assist you with the process.",
      };

    case "cma_form":
      return {
        subject: isEs
          ? "Hemos recibido su solicitud de valoración"
          : "We received your valuation request",
        headline: isEs ? "¡Solicitud recibida!" : "Request Received!",
        message: isEs
          ? "Gracias por solicitar una valoración de su propiedad. Nuestro equipo preparará un análisis comparativo de mercado (CMA) y se comunicará con usted pronto con los resultados."
          : "Thank you for requesting a property valuation. Our team will prepare a Comparative Market Analysis (CMA) and reach out to you soon with the results.",
      };

    case "agent_contact":
      return {
        subject: isEs
          ? `Hemos recibido su mensaje${contactedAgentName ? ` para ${contactedAgentName}` : ""}`
          : `We received your message${contactedAgentName ? ` for ${contactedAgentName}` : ""}`,
        headline: isEs ? "¡Mensaje recibido!" : "Message Received!",
        message: isEs
          ? `Gracias por contactar a ${contactedAgentName || "nuestro agente"} a través de REMAX Altitud. Su mensaje ha sido entregado y recibirá una respuesta muy pronto.`
          : `Thank you for reaching out to ${contactedAgentName || "our agent"} through REMAX Altitud. Your message has been delivered and you will receive a response very soon.`,
      };

    case "vip_buyer_form":
      return {
        subject: isEs
          ? "Hemos recibido su solicitud de Servicio VIP"
          : "We received your VIP Buyer Service request",
        headline: isEs ? "¡Solicitud VIP recibida!" : "VIP Request Received!",
        message: isEs
          ? "Gracias por su interés en nuestro Servicio de Comprador VIP. Hemos recibido su información y uno de nuestros agentes especializados se pondrá en contacto con usted muy pronto para brindarle una atención personalizada."
          : "Thank you for your interest in our VIP Buyer Service. We have received your information and one of our specialized agents will contact you very soon to provide you with personalized attention.",
      };

    case "contact_form":
    default:
      if (shortlistUrl) {
        return {
          subject: isEs
            ? "Hemos recibido su consulta sobre su lista de propiedades"
            : "We have received your inquiry about your property shortlist",
          headline: isEs ? "¡Consulta recibida!" : "Inquiry Received!",
          message: isEs
            ? `Gracias por ponerse en contacto con REMAX Altitud. Hemos recibido su consulta sobre su <a href="${shortlistUrl}" style="color: #d4af37; font-weight: bold;">lista de propiedades</a> y uno de nuestros agentes se comunicará con usted a la brevedad posible.`
            : `Thank you for contacting REMAX Altitud. We have received your inquiry about your <a href="${shortlistUrl}" style="color: #d4af37; font-weight: bold;">property shortlist</a> and one of our agents will get in touch with you as soon as possible.`,
        };
      }
      return {
        subject: isEs ? "Hemos recibido su consulta" : "We have received your inquiry",
        headline: isEs ? "¡Consulta recibida!" : "Inquiry Received!",
        message: isEs
          ? "Gracias por ponerse en contacto con REMAX Altitud. Hemos recibido su consulta y uno de nuestros agentes se comunicará con usted a la brevedad posible."
          : "Thank you for contacting REMAX Altitud. We have received your inquiry and one of our agents will get in touch with you as soon as possible.",
      };
  }
}

export function renderGenericLeadConfirmationEmail(props: GenericLeadConfirmationEmailProps): {
  subject: string;
  html: string;
} {
  const isEs = props.locale === "es";

  const { subject, headline, message } = getSourceCopy(
    props.source,
    isEs,
    props.contactedAgentName,
    props.shortlistUrl,
    props.intent,
  );

  const greeting = isEs ? `¡Hola, ${props.leadName}!` : `Hello, ${props.leadName}!`;

  const agentCardLabel = isEs ? "Su agente asignado" : "Your Assigned Agent";
  const officeContactLabel = isEs ? "Contáctenos" : "Contact Us";
  const officePhone = "+506 2771-7011";
  const officeEmail = "info@remax-altitud.cr";

  const hasAgent = props.agentName && (props.agentEmail || props.agentPhone);
  const isRecruitment = props.intent === "recruit";

  const agentCard = hasAgent
    ? `
      <div class="agent-card">
        <h3>${agentCardLabel}</h3>
        <p><strong>${props.agentName}</strong></p>
        ${props.agentPhone ? `<p>📱 ${props.agentPhone}</p>` : ""}
        ${props.agentEmail ? `<p>✉️ ${props.agentEmail}</p>` : ""}
      </div>
    `
    : isRecruitment
      ? `
      <div class="agent-card">
        <h3>${officeContactLabel}</h3>
        <p><strong>REMAX Altitud</strong></p>
        <p>📱 ${officePhone}</p>
        <p>✉️ cesar@remax-altitud.cr</p>
        <p>✉️ hola@remax-altitud.cr</p>
      </div>
    `
      : `
      <div class="agent-card">
        <h3>${officeContactLabel}</h3>
        <p><strong>REMAX Altitud</strong></p>
        <p>📱 ${officePhone}</p>
        <p>✉️ ${officeEmail}</p>
      </div>
    `;

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
          .content {
            padding: 32px;
            line-height: 1.6;
          }
          .content h2 {
            color: #0b1528;
            margin-top: 0;
          }
          .agent-card {
            background-color: #f3f4f6;
            padding: 16px;
            border-radius: 6px;
            margin-top: 24px;
          }
          .agent-card h3 {
            margin-top: 0;
            margin-bottom: 8px;
            font-size: 16px;
            color: #0b1528;
          }
          .agent-card p {
            margin: 4px 0;
            font-size: 14px;
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
            <h1>REMAX Altitud</h1>
          </div>
          <div class="content">
            <h2>${headline}</h2>
            <p>${greeting}</p>
            <p>${message}</p>
            ${agentCard}
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} REMAX Altitud. ${isEs ? "Todos los derechos reservados." : "All rights reserved."}</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return { subject, html };
}
