/**
 * Normalizes an agent's name by:
 * 1. Converting to lowercase
 * 2. Normalizing to NFD unicode form to decompose characters
 * 3. Removing accents/diacritics using a regex range for combining diacritical marks
 * 4. Trimming any leading/trailing whitespace
 */
export function normalizeAgentName(name: string): string {
  if (!name) return "";
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * A dictionary mapping normalized agent names to their spoken languages.
 */
export const AGENT_LANGUAGE_OVERRIDES: Record<string, string[]> = {
  "gustavo valverde": ["es", "en"],
  "natalia leon": ["es", "en"],
  "gerardo gonzalez": ["es", "en"],
  "krisley pereira": ["es", "en"],
  "omar gonzalez": ["es", "en"],
  "yeudi cisneros": ["es"],
  "mauricio espinoza": ["es", "en"],
  "carlos mora": ["es", "en"],
  "tatiana estrada": ["es"],
  "klary perez": ["es"],
  "alejandra castro": ["es", "pt", "en"],
  "cesar negrette": ["es", "en"],
  "debra west": ["en"],
  "david west": ["en"],
  "ismara ubeda": ["es"],
  "ralff abarca": ["es"],
  "josue alvarado": ["es", "en"],
  "rafael lee": ["es", "en"],
  "kevin alvarez": ["es", "en"],
  "andrey perez": ["es"],
  "natalia soto": ["es", "en"],
  "rodrigo fernandez": ["es", "en"],
};
