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
    className={cn("border-b border-brand-dark/10 last:border-0 pb-2", className)}
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
      "flex w-full items-center justify-between py-4 text-left text-lg font-semibold transition-all hover:text-brand-dark",
      className,
    )}
    {...props}
  >
    {children}
    <ChevronDown
      className={cn(
        "h-5 w-5 shrink-0 text-brand-dark transition-transform duration-200",
        isOpen && "rotate-180",
      )}
    />
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
      "overflow-hidden text-base text-brand-dark/80 transition-all",
      isOpen ? "max-h-96 opacity-100 mb-4" : "max-h-0 opacity-0",
    )}
    {...props}
  >
    <div className={cn("pb-4 pt-0", className)}>{children}</div>
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
