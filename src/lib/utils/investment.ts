import { InvestmentContext } from "@/types/investment";

/**
 * Safely extracts and validates the InvestmentContext from area metadata JSONB.
 * Returns null if the context is missing, malformed, or missing required fields.
 */
export function getInvestmentContext(
  metadata: Record<string, unknown> | null | undefined,
): InvestmentContext | null {
  if (!metadata || typeof metadata !== "object") return null;

  const ctx = metadata.investmentContext;
  if (!ctx || typeof ctx !== "object" || Array.isArray(ctx)) return null;

  const typedCtx = ctx as Record<string, unknown>;
  const { appreciationTrend, rentalYieldEstimate, marketHighlights } = typedCtx;

  if (
    typeof appreciationTrend !== "string" ||
    !appreciationTrend.trim() ||
    typeof rentalYieldEstimate !== "string" ||
    !rentalYieldEstimate.trim()
  ) {
    return null;
  }

  // Validate market highlights if provided
  let highlights: string[] | undefined = undefined;
  if (Array.isArray(marketHighlights)) {
    const filtered = marketHighlights.filter(
      (h): h is string => typeof h === "string" && h.trim().length > 0,
    );
    if (filtered.length > 0) {
      highlights = filtered.map((h) => h.trim());
    }
  }

  return {
    appreciationTrend: appreciationTrend.trim(),
    rentalYieldEstimate: rentalYieldEstimate.trim(),
    ...(highlights ? { marketHighlights: highlights } : {}),
  };
}
