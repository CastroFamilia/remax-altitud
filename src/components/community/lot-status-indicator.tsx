interface LotStatusIndicatorProps {
  status: string;
  locale: string;
}

const STATUS_CONFIG: Record<
  string,
  { icon: string; labelEn: string; labelEs: string; testId: string }
> = {
  active: {
    icon: "✅",
    labelEn: "Available",
    labelEs: "Disponible",
    testId: "lot-status-available",
  },
  sold: { icon: "❌", labelEn: "Sold", labelEs: "Vendido", testId: "lot-status-sold" },
  reserved: {
    icon: "🟡",
    labelEn: "Reserved",
    labelEs: "Reservado",
    testId: "lot-status-reserved",
  },
};

/**
 * LotStatusIndicator — Server Component (AC #4)
 *
 * Renders status icon + label based on property status field.
 * Maps "active" → Available, "sold" → Sold, "reserved" → Reserved.
 */
export function LotStatusIndicator({ status, locale }: LotStatusIndicatorProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.active;
  const label = locale === "es" ? config.labelEs : config.labelEn;

  return (
    <span data-testid={config.testId} className="inline-flex items-center gap-1.5 text-sm">
      <span aria-hidden="true">{config.icon}</span>
      <span>{label}</span>
    </span>
  );
}
