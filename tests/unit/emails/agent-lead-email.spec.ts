import { describe, it, expect } from "vitest";
import { renderAgentLeadNotificationEmail } from "@/lib/emails/AgentLeadNotificationEmail";

describe("AgentLeadNotificationEmail", () => {
  it("formats newline-separated form fields into distinct lines with bold labels", () => {
    const message = [
      "Languages: Spanish and English",
      "Area: Dominical",
      "Has vehicle: Yes",
      "Time availability: Full-time",
    ].join("\n");

    const { html } = renderAgentLeadNotificationEmail({
      locale: "es",
      agentName: "RE/MAX Altitud",
      leadName: "Juan Pérez",
      leadPhone: "+506 8888 8888",
      leadEmail: "juan@test.com",
      leadMessage: message,
      source: "contact_form",
      intent: "recruit",
    });

    expect(html).toContain('<strong style="color: #0b1528;">Languages:</strong> Spanish and English');
    expect(html).toContain('<strong style="color: #0b1528;">Area:</strong> Dominical');
    expect(html).toContain('<strong style="color: #0b1528;">Has vehicle:</strong> Yes');
    expect(html).toContain('<strong style="color: #0b1528;">Time availability:</strong> Full-time');
  });

  it("formats legacy pipe-separated fields into distinct lines", () => {
    const message = "Languages: Español | Area: pz | Has vehicle: Yes";

    const { html } = renderAgentLeadNotificationEmail({
      locale: "es",
      agentName: "RE/MAX Altitud",
      leadName: "Juan Pérez",
      leadPhone: "+506 8888 8888",
      leadEmail: "juan@test.com",
      leadMessage: message,
      source: "contact_form",
      intent: "recruit",
    });

    expect(html).toContain('<strong style="color: #0b1528;">Languages:</strong> Español');
    expect(html).toContain('<strong style="color: #0b1528;">Area:</strong> pz');
    expect(html).toContain('<strong style="color: #0b1528;">Has vehicle:</strong> Yes');
  });

  it("includes 'Ver en el Hub' CTA button when intent is recruit or hubUrl is provided", () => {
    const { html } = renderAgentLeadNotificationEmail({
      locale: "es",
      agentName: "RE/MAX Altitud",
      leadName: "Juan Pérez",
      leadPhone: "+506 8888 8888",
      leadEmail: "juan@test.com",
      leadMessage: "Test message",
      source: "contact_form",
      intent: "recruit",
      hubUrl: "https://dev.hub.remax-altitud.cr/es/broker/recruiting",
    });

    expect(html).toContain("Ver en el Hub →");
    expect(html).toContain('href="https://dev.hub.remax-altitud.cr/es/broker/recruiting"');
  });
});
