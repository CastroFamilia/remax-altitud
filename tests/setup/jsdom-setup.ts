/**
 * jsdom setup for component tests (Story 3.1+).
 * Runs before each component test file.
 *
 * This file is listed in global `setupFiles` so Vitest loads it for every
 * test suite. The guard below makes it a no-op in Node-environment tests
 * (db, sync, api) while still initialising @testing-library/react for the
 * jsdom suites that actually need it.
 */
export {};

if (typeof globalThis.document !== "undefined") {
  // Dynamic import so the module isn't even resolved in Node environments.
  await import("@testing-library/react");
}
