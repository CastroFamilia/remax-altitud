/**
 * AgentProfileBio — Unit tests
 * Verifies character truncation and expand/collapse toggle.
 */

import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AgentProfileBio } from "@/components/agent/agent-profile-bio";

describe("AgentProfileBio component", () => {
  it("renders full text without toggle when bio is within maxLength", () => {
    const shortBio = "Broker de REMAX Altitud y REMAX Altitud Cero";
    render(<AgentProfileBio bio={shortBio} maxLength={200} />);

    expect(screen.getByText(shortBio)).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("truncates bio and displays 'Ver más' toggle when bio exceeds maxLength", () => {
    const longBio =
      "Esta es una biografía bastante larga que supera el límite de caracteres configurado para el componente y por ende debe truncarse automáticamente mostrando un botón para ver el contenido completo de la misma.";
    render(
      <AgentProfileBio
        bio={longBio}
        maxLength={50}
        readMoreLabel="Ver más"
        showLessLabel="Ver menos"
      />
    );

    const button = screen.getByRole("button", { name: "Ver más" });
    expect(button).toBeTruthy();
    expect(screen.queryByText(longBio)).toBeNull();

    // Click to expand
    fireEvent.click(button);
    expect(screen.getByText(longBio)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Ver menos" })).toBeTruthy();

    // Click to collapse
    fireEvent.click(screen.getByRole("button", { name: "Ver menos" }));
    expect(screen.getByRole("button", { name: "Ver más" })).toBeTruthy();
  });
});
