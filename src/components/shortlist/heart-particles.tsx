"use client";

/**
 * HeartParticles — Pure CSS particle burst for ♡ save animation (UX-DR22).
 *
 * Renders 4 tiny heart-outline SVGs that float upward and fade on save.
 * Uses CSS @keyframes defined in globals.css. Each particle animates for
 * 400ms with staggered delays. The component auto-removes after the
 * animation completes.
 *
 * Respects `prefers-reduced-motion` — particles are hidden via CSS when
 * the user prefers reduced motion.
 */
export function HeartParticles() {
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0 z-10">
      {[1, 2, 3, 4].map((i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--accent, #660000)"
          strokeWidth={2.5}
          className="absolute left-1/2 top-1/2 h-3 w-3 -ml-1.5 -mt-1.5 motion-reduce:hidden"
          style={{
            animation: `heart-particle-${i} 0.4s ease-out forwards`,
            animationDelay: `${(i - 1) * 30}ms`,
            opacity: 0,
          }}
        >
          <path d="M12 21C12 21 4 14.5 4 8.5C4 5.5 6.5 3 9.5 3C11 3 12 4 12 4C12 4 13 3 14.5 3C17.5 3 20 5.5 20 8.5C20 14.5 12 21 12 21Z" />
        </svg>
      ))}
    </span>
  );
}
