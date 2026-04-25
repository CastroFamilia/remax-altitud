/**
 * Database Schema Barrel
 *
 * Single public entry point for all Drizzle table objects, relations, and
 * inferred row types. Downstream code imports from `@/lib/db/schema` only.
 *
 * @see architecture.md §4 — Database Schema
 */
export * from "./schema/index";
