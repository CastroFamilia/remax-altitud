export interface PropertyInquiryEmailProps {
  locale: string;
  propertyName: string;
  propertyUrl: string;
  agentName: string;
  agentEmail: string;
  agentPhone: string;
}

export function renderPropertyInquiryEmail({
  locale,
  propertyName,
  propertyUrl,
  agentName,
  agentEmail,
  agentPhone,
}: PropertyInquiryEmailProps): string {
  const isEs = locale === "es";

  const title = isEs ? "Hemos recibido su consulta" : "We have received your inquiry";

  const greeting = isEs ? "¡Hola!" : "Hello!";

  const message1 = isEs
    ? `Gracias por su interés en <strong>${propertyName}</strong>. Hemos recibido su consulta y la hemos enviado directamente al agente encargado.`
    : `Thank you for your interest in <strong>${propertyName}</strong>. We have received your inquiry and forwarded it directly to the listing agent.`;

  const message2 = isEs
    ? `El agente <strong>${agentName}</strong> se pondrá en contacto con vos muy pronto para ayudarte con más información o programar una visita.`
    : `The agent <strong>${agentName}</strong> will reach out to you very soon to assist you with more information or to schedule a showing.`;

  const propertyLinkLabel = isEs ? "Ver Propiedad" : "View Property";

  const contactAgentLabel = isEs ? "Información del Agente" : "Agent Information";

  return `
    <!DOCTYPE html>
    <html lang="${locale}">
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
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
            background-color: #0b1528; /* brand-navy */
            color: #ffffff;
            padding: 24px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            color: #d4af37; /* brand-gold */
          }
          .content {
            padding: 32px;
            line-height: 1.6;
          }
          .button {
            display: inline-block;
            background-color: #d4af37;
            color: #0b1528;
            font-weight: bold;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            margin-top: 16px;
            margin-bottom: 24px;
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
            <h1>RE/MAX Altitud</h1>
          </div>
          <div class="content">
            <p>${greeting}</p>
            <p>${message1}</p>
            <p>${message2}</p>
            
            <div style="text-align: center;">
              <a href="${propertyUrl}" class="button">${propertyLinkLabel}</a>
            </div>

            <div class="agent-card">
              <h3>${contactAgentLabel}</h3>
              <p><strong>${agentName}</strong></p>
              ${agentPhone ? `<p>📱 ${agentPhone}</p>` : ""}
              ${agentEmail ? `<p>✉️ ${agentEmail}</p>` : ""}
            </div>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} RE/MAX Altitud. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
