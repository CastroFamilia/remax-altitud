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
}

export function Logo({ variant = "default" }: LogoProps) {
  // variant prop reserved for future light-background logo support
  void variant;
  return (
    <Link href="/" className="flex shrink-0 items-center">
      <Image
        src={LOGO_SRC}
        alt="REMAX Altitud — Costa Rica Real Estate"
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        priority
        sizes="(max-width: 768px) 120px, 160px"
        className="h-8 w-auto object-contain md:h-10"
      />
    </Link>
  );
}
