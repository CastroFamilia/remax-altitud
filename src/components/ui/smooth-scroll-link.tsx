"use client";

import type { MouseEvent, ReactNode } from "react";

interface SmoothScrollLinkProps {
  href: string;
  className?: string;
  children: ReactNode;
}

export function SmoothScrollLink({ href, className, children }: SmoothScrollLinkProps) {
  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      const targetId = href.slice(1);
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
        window.history.pushState(null, "", href);
      }
    }
  };

  return (
    <a href={href} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
