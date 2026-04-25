// Vitest no-op shim for Next.js's `server-only` directive. Next aliases the
// real module at build time to fail the build when a Client Component imports
// a server-only module; Vitest does not run that alias, so we substitute an
// empty module to keep unit tests green.
export {};
