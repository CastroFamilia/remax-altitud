import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SimplePageLayoutProps {
  pageTitle: string;
  intro?: string;
  children: ReactNode;
  className?: string;
}

export function SimplePageLayout({ pageTitle, intro, children, className }: SimplePageLayoutProps) {
  return (
    <div className={cn("container py-12 md:py-16", className)}>
      <header className="mx-auto mb-10 max-w-3xl text-center md:mb-14">
        <h1 className="!text-[length:var(--text-hero)] font-extrabold text-brand-navy">
          {pageTitle}
        </h1>
        {intro ? (
          <p className="mt-4 !text-[length:var(--text-body-lg)] text-text-muted">{intro}</p>
        ) : null}
      </header>
      {children}
    </div>
  );
}
