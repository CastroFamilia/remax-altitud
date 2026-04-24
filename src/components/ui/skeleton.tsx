import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "animate-[skeleton-pulse_var(--duration-skeleton)_ease-in-out_infinite] rounded-md bg-muted",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
