/**
 * Translation glossary for legal/property terms (EN → ES).
 * Used with the DeepL glossary API to enforce consistent translations
 * for domain-specific terms (FR33).
 *
 * This file is intentionally a shared constants file:
 * - NO "use client" directive
 * - NO "server-only" import
 *
 * Required env var: DEEPL_GLOSSARY_ID (one-time setup — store glossary ID after creation).
 */

export const TRANSLATION_GLOSSARY: Record<string, string> = {
  "Titled Property": "Propiedad Titulada",
  Concession: "Concesión",
  "ZMT Restricted": "Zona Marítimo Terrestre Restringida",
  "Fee Simple": "Pleno Dominio",
  "Maritime Zone": "Zona Marítimo Terrestre",
};
