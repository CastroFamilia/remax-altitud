import { create } from "zustand";

export type CurrencyCode = "USD" | "EUR" | "CRC";

export type CurrencyStore = {
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  isHydrated: boolean;
  setHydrated: (hydrated: boolean) => void;
};

export const useCurrencyStore = create<CurrencyStore>()((set) => ({
  currency: "USD",
  setCurrency: (currency) => {
    set({ currency });
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem("currency-preference", currency);
      } catch {
        // ignore storage quota/errors
      }
    }
  },
  isHydrated: false,
  setHydrated: (hydrated) => set({ isHydrated: hydrated }),
}));
