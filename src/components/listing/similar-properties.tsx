/**
 * Story 4.5: SimilarProperties component — TYPE STUB (ATDD red phase)
 *
 * This file is a minimal type stub so tests compile cleanly during the red phase.
 * The actual implementation is in Task 2 of Story 4.5.
 *
 * DO NOT use this stub in production — replace with full implementation.
 */
import type { PropertySearchItem } from "@/types/search";

interface SimilarPropertiesProps {
  properties: PropertySearchItem[];
  locale: string;
  currentPropertySlug: string;
}

export async function SimilarProperties(
  _props: SimilarPropertiesProps,
): Promise<React.ReactElement> {
  // Stub — implementation pending (Story 4.5, Task 2)
  throw new Error("SimilarProperties: not yet implemented");
}
