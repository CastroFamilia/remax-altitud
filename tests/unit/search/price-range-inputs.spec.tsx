/**
 * Tests for PriceRangeInputs
 */
import { describe, expect, it, vi, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { PriceRangeInputs } from "@/components/search/price-range-inputs";

// Mock next-intl and hooks
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/hooks/use-locale-currency", () => ({
  useLocaleCurrency: () => ({
    currency: "USD",
    formatPrice: (val: number) => `$${val}`,
  }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("PriceRangeInputs", () => {
  it("renders two inputs", () => {
    const onChange = vi.fn();
    const { container } = render(<PriceRangeInputs value={[undefined, undefined]} onChange={onChange} />);
    const inputs = container.querySelectorAll("input");
    expect(inputs.length).toBe(2);
  });
});
