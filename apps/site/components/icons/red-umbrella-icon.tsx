import * as React from "react";

/**
 * Custom Red Open Umbrella icon.
 * Rendered as inline SVG so the color and open shape are consistent across
 * Windows, macOS, iOS and Android (unlike the standard ☂️ / 🌂 emojis which
 * render inconsistently — often purple or black on Apple/Windows).
 */
export function RedUmbrellaIcon({
  size = 40,
  className,
  title = "Paraguas",
}: {
  size?: number | string;
  className?: string;
  title?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label={title}
      className={className}
    >
      <title>{title}</title>
      {/* Canopy (open umbrella dome) */}
      <path
        d="M32 6 C15 6, 3 19, 2 32 L62 32 C61 19, 49 6, 32 6 Z"
        fill="#DC2626"
      />
      {/* Scalloped bottom edge of the canopy (gives the classic open look) */}
      <path
        d="M2 32 Q7 26, 12 32 Q17 26, 22 32 Q27 26, 32 32 Q37 26, 42 32 Q47 26, 52 32 Q57 26, 62 32 Z"
        fill="#B91C1C"
      />
      {/* Ribs (subtle segment lines) */}
      <g stroke="#991B1B" strokeWidth="1" strokeLinecap="round" opacity="0.55" fill="none">
        <line x1="32" y1="6" x2="12" y2="32" />
        <line x1="32" y1="6" x2="22" y2="32" />
        <line x1="32" y1="6" x2="32" y2="32" />
        <line x1="32" y1="6" x2="42" y2="32" />
        <line x1="32" y1="6" x2="52" y2="32" />
      </g>
      {/* Top tip */}
      <circle cx="32" cy="6" r="1.8" fill="#7F1D1D" />
      {/* Shaft + J-shaped handle */}
      <path
        d="M32 32 L32 52 Q32 58, 26 58 Q21 58, 21 53"
        stroke="#4B2E17"
        strokeWidth="2.8"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default RedUmbrellaIcon;
