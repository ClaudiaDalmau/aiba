"use client";
import { useMemo } from "react";

/**
 * Zero-dependency confetti overlay for the badges page.
 * Uses CSS animations only — safe for SSR + no bundle bloat.
 */
export function Confetti() {
  const pieces = useMemo(() => {
    return Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 3 + Math.random() * 3,
      rotate: Math.random() * 360,
      hue: Math.floor(Math.random() * 360),
      size: 6 + Math.random() * 6,
    }));
  }, []);

  return (
    <div
      aria-hidden
      className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
    >
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-sm"
          style={{
            left: `${p.left}%`,
            top: "-10%",
            width: `${p.size}px`,
            height: `${p.size * 1.5}px`,
            backgroundColor: `hsl(${p.hue}, 85%, 55%)`,
            transform: `rotate(${p.rotate}deg)`,
            animation: `confetti-fall ${p.duration}s ${p.delay}s ease-in forwards`,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(120vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
