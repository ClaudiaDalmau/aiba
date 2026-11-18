"use client";

/**
 * Iter102 — Theme toggle for the Next.js dashboard.
 *
 * Kept in parity with the mobile app: only "Claro" and "Oscuro" (no System),
 * so the choice is deterministic and predictable across platforms.
 */
import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Avoid hydration mismatch: render a static placeholder until mounted
  if (!mounted) {
    return (
      <button
        aria-label="Cambiar tema"
        className="p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
      >
        <Sun className="h-4 w-4 text-neutral-700 dark:text-neutral-300" />
      </button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      aria-label={isDark ? "Activar modo claro" : "Activar modo oscuro"}
      title={isDark ? "Modo claro" : "Modo oscuro"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative p-2 rounded-md hover:bg-violet-50 dark:hover:bg-violet-950/40 transition-colors"
    >
      <Sun
        className={`h-4 w-4 transition-all text-violet-600 dark:text-neutral-400 ${
          isDark ? "-rotate-90 scale-0" : "rotate-0 scale-100"
        }`}
      />
      <Moon
        className={`absolute inset-0 m-auto h-4 w-4 transition-all text-violet-300 dark:text-violet-300 ${
          isDark ? "rotate-0 scale-100" : "rotate-90 scale-0"
        }`}
      />
    </button>
  );
}
