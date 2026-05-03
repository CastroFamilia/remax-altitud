/**
 * Story 4.5: Breadcrumbs component — TYPE STUB (ATDD red phase)
 *
 * This file is a minimal type stub so tests compile cleanly during the red phase.
 * The actual implementation is in Task 6 of Story 4.5.
 *
 * DO NOT use this stub in production — replace with full implementation.
 */

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  locale: string;
}

export function Breadcrumbs(_props: BreadcrumbsProps): React.ReactElement {
  // Stub — implementation pending (Story 4.5, Task 6)
  throw new Error("Breadcrumbs: not yet implemented");
}
