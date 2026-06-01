/**
 * jsdom setup for component tests (Story 3.1+).
 * Runs before each component test file.
 *
 * This file is listed in `setupFiles` for the jsdom project only.
 */
export {};

if (typeof globalThis.document !== "undefined") {
  // Dynamic import so the module isn't even resolved in Node environments.
  await import("@testing-library/react");

  // ---------------------------------------------------------------------------
  // localStorage polyfill for Node 22+ / jsdom compatibility
  //
  // Node 22+ ships a built-in `localStorage` global that is NOT the Web Storage
  // API (it lacks `.clear()`, `.key()`, `.length`, etc.).  jsdom 29 defers to
  // this built-in instead of creating its own Storage implementation.
  //
  // We replace the global with a spec-compliant in-memory Storage so that both
  // test code and component code using `localStorage` get the full API.
  // ---------------------------------------------------------------------------
  if (typeof globalThis.localStorage?.clear !== "function") {
    const createStorage = (): Storage => {
      const store = new Map<string, string>();
      return {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => store.set(key, String(value)),
        removeItem: (key: string) => store.delete(key),
        clear: () => store.clear(),
        key: (index: number) => [...store.keys()][index] ?? null,
        get length() {
          return store.size;
        },
      };
    };

    Object.defineProperty(globalThis, "localStorage", {
      value: createStorage(),
      writable: true,
      configurable: true,
    });

    Object.defineProperty(window, "localStorage", {
      value: globalThis.localStorage,
      writable: true,
      configurable: true,
    });
  }
}
