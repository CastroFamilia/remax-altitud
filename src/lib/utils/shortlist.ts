/**
 * Story 7.1: Save & Shortlist Properties
 * Pure utilities for localStorage/sessionStorage management (TDD Skeleton)
 */

export function getShortlist(): string[] {
  return [];
}

export function addToShortlist(id: string): { success: boolean; error?: "limit" | "unknown" } {
  return { success: false, error: "unknown" };
}

export function removeFromShortlist(id: string): void {
  // Skeleton placeholder
}

export function hasShownTooltipThisSession(): boolean {
  return false;
}

export function markTooltipShownThisSession(): void {
  // Skeleton placeholder
}
