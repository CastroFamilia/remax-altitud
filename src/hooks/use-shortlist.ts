/**
 * Story 7.1: Save & Shortlist Properties
 * Custom React hook for shortlist state management (TDD Skeleton)
 */

export function useShortlist() {
  return {
    shortlist: [] as string[],
    isSaved: (id: string) => false,
    save: (id: string) => ({ success: false, error: "unknown" as const }),
    remove: (id: string) => {},
    isLoaded: false,
  };
}
