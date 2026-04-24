interface BalloonIconProps {
  className?: string;
  size?: number;
}

/**
 * Inline SVG of the RE/MAX hot-air balloon mark.
 * Uses brand tokens: balloon-red (#cc0000), balloon-blue (#003da5), balloon-white (#ffffff).
 * Inline SVG ensures the icon renders even when public assets or CDN are unreachable —
 * critical for error pages (404/500).
 */
export function BalloonIcon({ className, size = 64 }: BalloonIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Balloon envelope */}
      <ellipse cx="32" cy="24" rx="18" ry="22" fill="var(--brand-balloon-red, #cc0000)" />

      {/* Center stripe */}
      <path
        d="M24 4C26 2 30 1.5 32 2C34 1.5 38 2 40 4C42 8 43 14 43 22C43 30 40 36 38 38L26 38C24 36 21 30 21 22C21 14 22 8 24 4Z"
        fill="var(--brand-balloon-blue, #003da5)"
      />

      {/* White chevron accent */}
      <path
        d="M28 6C30 4 34 4 36 6C37 10 37.5 16 37 22C36.5 28 35 32 34 34L30 34C29 32 27.5 28 27 22C26.5 16 27 10 28 6Z"
        fill="var(--brand-balloon-white, #ffffff)"
        opacity="0.85"
      />

      {/* Basket ropes */}
      <line
        x1="26"
        y1="38"
        x2="28"
        y2="48"
        stroke="var(--brand-balloon-red, #cc0000)"
        strokeWidth="1.5"
      />
      <line
        x1="38"
        y1="38"
        x2="36"
        y2="48"
        stroke="var(--brand-balloon-red, #cc0000)"
        strokeWidth="1.5"
      />

      {/* Basket */}
      <rect
        x="27"
        y="48"
        width="10"
        height="6"
        rx="1.5"
        fill="var(--brand-balloon-blue, #003da5)"
      />
      <rect x="27" y="48" width="10" height="2" rx="0.5" fill="var(--brand-balloon-red, #cc0000)" />
    </svg>
  );
}
