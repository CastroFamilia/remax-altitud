import { type ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

interface EmptyStateAction {
  label: string;
  href: string;
}

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  /** Required — every empty state MUST have at least one forward path (UX-DR20) */
  primaryAction: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
}

/**
 * Reusable empty-state shell.
 *
 * Forward-path rule (UX-DR20): `primaryAction` is required — no dead ends.
 * Uses `aria-live="polite"` so dynamically-rendered empty states
 * (e.g., search returning zero results) are announced to screen readers.
 */
export function EmptyState({
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
}: EmptyStateProps) {
  return (
    <section
      role="status"
      aria-live="polite"
      aria-label={title}
      className="flex flex-col items-center justify-center px-4 py-16 text-center"
    >
      <div className="mb-6">{icon}</div>

      <h2 className="mb-3 text-2xl font-bold text-brand-navy md:text-3xl">{title}</h2>

      <p className="mb-8 max-w-md text-muted-foreground">{description}</p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg">
          {primaryAction.href.startsWith("http") ? (
            <a href={primaryAction.href} target="_blank" rel="noopener noreferrer">
              {primaryAction.label}
            </a>
          ) : (
            <Link href={primaryAction.href}>{primaryAction.label}</Link>
          )}
        </Button>
        {secondaryAction && (
          <Button asChild variant="outline" size="lg">
            {secondaryAction.href.startsWith("http") ? (
              <a href={secondaryAction.href} target="_blank" rel="noopener noreferrer">
                {secondaryAction.label}
              </a>
            ) : (
              <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
            )}
          </Button>
        )}
      </div>
    </section>
  );
}
