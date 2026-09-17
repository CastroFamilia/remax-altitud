/**
 * Logo — REMAX Altitud brand logo with next/image.
 *
 * Swappable design (UX-DR32): Logo source path is a constant —
 * changing the file at the path swaps the logo with zero code changes.
 *
 * Server Component — no client JS.
 */

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * Swappable logo source path (UX-DR32).
 * To change the logo, replace the file at this path.
 */
const LOGO_SRC = "/images/brand/logo-remax-altitud.png";

/**
 * Intrinsic dimensions of logo-remax-altitud.png: 300×84px
 * Aspect ratio: 300/84 ≈ 3.571
 *
 * Desktop: height 40px → width ≈ 143px
 * Mobile:  height 32px → width ≈ 114px
 */
const LOGO_WIDTH = 143;
const LOGO_HEIGHT = 40;

export type LogoVariant = "default" | "dark-bg";

interface LogoProps {
  /** Logo variant for future light-background support */
  variant?: LogoVariant;
  className?: string;
}

export function Logo({ variant = "default", className }: LogoProps) {
  // variant prop reserved for future light-background support
  void variant;
  return (
    <Link href="/" className={cn("flex items-center shrink-0", className)}>
      <Image
        src={LOGO_SRC}
        alt="REMAX Altitud — Costa Rica Real Estate"
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        priority
        sizes="(max-width: 768px) 120px, 160px"
        className="h-8 w-auto shrink-0 object-contain md:h-9 2xl:h-10"
      />
    </Link>
  );
}
