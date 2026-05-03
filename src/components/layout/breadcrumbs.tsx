/**
 * Breadcrumbs — Server Component
 *
 * Reusable visual breadcrumb navigation component.
 * Labels are passed as pre-translated strings from the parent — no i18n inside.
 * Accessibility: aria-label on nav, aria-current="page" on last item, aria-hidden on separators.
 *
 * Story 4.5, Task 6 | AC #4
 */

import { Link } from "@/i18n/navigation";

interface BreadcrumbItem {
  label: string;
  href?: string; // last item (current page) has no href
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  locale: string; // reserved for future i18n use — not actively used in component body
}

export function Breadcrumbs({ items }: BreadcrumbsProps): React.ReactElement {
  return (
    <nav
      aria-label="Breadcrumb"
      data-testid="breadcrumbs"
      className="px-4 py-2 md:px-0"
    >
      <ol className="flex flex-wrap items-center gap-1 text-sm text-text-muted">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="flex items-center gap-1">
              {index > 0 && (
                <span aria-hidden="true" className="text-text-muted/60">
                  /
                </span>
              )}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="hover:text-brand-navy transition-colors truncate max-w-[12rem]"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={
                    isLast ? "text-brand-navy font-medium truncate max-w-[20rem]" : ""
                  }
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
