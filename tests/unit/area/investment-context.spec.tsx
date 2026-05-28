import { describe, expect, it } from "vitest";
import { getInvestmentContext } from "@/lib/utils/investment";
import * as fs from "node:fs";

describe("Investment Parser (getInvestmentContext)", () => {
  it("returns null if metadata is null, undefined, or not an object", () => {
    expect(getInvestmentContext(null)).toBeNull();
    expect(getInvestmentContext(undefined)).toBeNull();
    // @ts-expect-error - testing invalid JS inputs
    expect(getInvestmentContext("string")).toBeNull();
  });

  it("returns null if metadata does not contain investmentContext", () => {
    expect(getInvestmentContext({})).toBeNull();
    expect(getInvestmentContext({ otherKey: {} })).toBeNull();
  });

  it("returns null if investmentContext is not a valid object", () => {
    expect(getInvestmentContext({ investmentContext: null })).toBeNull();
    expect(getInvestmentContext({ investmentContext: [] })).toBeNull();
    expect(getInvestmentContext({ investmentContext: "not-an-object" })).toBeNull();
  });

  it("returns null if appreciationTrend is missing, empty, or not a string", () => {
    expect(
      getInvestmentContext({
        investmentContext: {
          rentalYieldEstimate: "5-10%",
        },
      }),
    ).toBeNull();

    expect(
      getInvestmentContext({
        investmentContext: {
          appreciationTrend: "",
          rentalYieldEstimate: "5-10%",
        },
      }),
    ).toBeNull();

    expect(
      getInvestmentContext({
        investmentContext: {
          appreciationTrend: 123,
          rentalYieldEstimate: "5-10%",
        },
      }),
    ).toBeNull();
  });

  it("returns null if rentalYieldEstimate is missing, empty, or not a string", () => {
    expect(
      getInvestmentContext({
        investmentContext: {
          appreciationTrend: "5-8%",
        },
      }),
    ).toBeNull();

    expect(
      getInvestmentContext({
        investmentContext: {
          appreciationTrend: "5-8%",
          rentalYieldEstimate: "   ",
        },
      }),
    ).toBeNull();
  });

  it("returns parsed context without marketHighlights if none are provided", () => {
    const parsed = getInvestmentContext({
      investmentContext: {
        appreciationTrend: " 5-8% annual ",
        rentalYieldEstimate: " 6-10% yield ",
      },
    });

    expect(parsed).toEqual({
      appreciationTrend: "5-8% annual",
      rentalYieldEstimate: "6-10% yield",
    });
  });

  it("filters out empty or invalid highlights and omits key if list is empty", () => {
    const parsed = getInvestmentContext({
      investmentContext: {
        appreciationTrend: "5-8%",
        rentalYieldEstimate: "6-10%",
        marketHighlights: ["  ", "", null, 123, "Valid highlight"],
      },
    });

    expect(parsed).toEqual({
      appreciationTrend: "5-8%",
      rentalYieldEstimate: "6-10%",
      marketHighlights: ["Valid highlight"],
    });
  });

  it("returns fully parsed context when all fields are correct", () => {
    const parsed = getInvestmentContext({
      investmentContext: {
        appreciationTrend: "5-8%",
        rentalYieldEstimate: "6-10%",
        marketHighlights: ["Highlight 1", "Highlight 2"],
      },
    });

    expect(parsed).toEqual({
      appreciationTrend: "5-8%",
      rentalYieldEstimate: "6-10%",
      marketHighlights: ["Highlight 1", "Highlight 2"],
    });
  });
});

describe("InvestmentContext Component Structural Audits (AC #2, #6)", () => {
  const componentPath = "src/components/area/investment-context.tsx";

  it("is a Server Component (no 'use client' directive)", () => {
    const source = fs.readFileSync(componentPath, "utf-8");
    expect(source).not.toMatch(/^\s*["']use client["']/);
  });

  it("renders with the mandated data-testid attributes", () => {
    const source = fs.readFileSync(componentPath, "utf-8");
    expect(source).toContain('data-testid="investment-context"');
    expect(source).toContain('data-testid="investment-disclaimer"');
  });

  it("implements WAI-ARIA and semantic accessibility contracts", () => {
    const source = fs.readFileSync(componentPath, "utf-8");
    // Should use section with aria-labelledby
    expect(source).toContain("<section");
    expect(source).toContain("aria-labelledby=");
    // Should use aside role="note" for disclaimer
    expect(source).toContain("<aside");
    expect(source).toContain('role="note"');
  });

  it("forces co-rendering of disclaimer alongside investment data (AC #6)", () => {
    const source = fs.readFileSync(componentPath, "utf-8");
    // The disclaimer should always render alongside the main component output
    expect(source).toContain('data-testid="investment-disclaimer"');
  });
});
