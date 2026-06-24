"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const Accordion = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("space-y-4", className)} {...props} />
  ),
);
Accordion.displayName = "Accordion";

const AccordionItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "border-b border-brand-gold/20 last:border-0 pb-2 transition-colors hover:border-brand-gold/40",
      className,
    )}
    {...props}
  />
));
AccordionItem.displayName = "AccordionItem";

const AccordionTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { isOpen?: boolean; onToggle?: () => void }
>(({ className, children, isOpen, onToggle, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    onClick={onToggle}
    aria-expanded={isOpen}
    className={cn(
      "flex w-full items-center justify-between py-6 text-left text-xl font-semibold text-brand-navy transition-all hover:text-brand-gold group",
      className,
    )}
    {...props}
  >
    {children}
    <span
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brand-gold/30 bg-brand-crema/50 text-brand-gold transition-all duration-[var(--duration-normal)] group-hover:bg-brand-gold group-hover:text-white",
        isOpen && "bg-brand-gold text-white rotate-180",
      )}
    >
      <ChevronDown className="h-5 w-5" />
    </span>
  </button>
));
AccordionTrigger.displayName = "AccordionTrigger";

const AccordionContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { isOpen?: boolean }
>(({ className, children, isOpen, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "overflow-hidden text-lg text-text-secondary transition-all duration-[var(--duration-normal)] ease-in-out",
      isOpen ? "max-h-96 opacity-100 mb-6" : "max-h-0 opacity-0",
    )}
    {...props}
  >
    <div className={cn("pb-6 pt-2 pl-2 leading-relaxed", className)}>{children}</div>
  </div>
));
AccordionContent.displayName = "AccordionContent";

interface AccordionWrapperProps {
  items: { value: string; title: string; content: React.ReactNode }[];
  className?: string;
}

export function SimpleAccordion({ items, className }: AccordionWrapperProps) {
  const [openItem, setOpenItem] = React.useState<string | null>(null);

  const handleToggle = (value: string) => {
    setOpenItem((prev) => (prev === value ? null : value));
  };

  return (
    <Accordion className={className}>
      {items.map((item) => (
        <AccordionItem key={item.value} value={item.value}>
          <AccordionTrigger
            isOpen={openItem === item.value}
            onToggle={() => handleToggle(item.value)}
          >
            {item.title}
          </AccordionTrigger>
          <AccordionContent isOpen={openItem === item.value}>{item.content}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
