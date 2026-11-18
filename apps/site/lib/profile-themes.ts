/**
 * Profile theme registry — Iter56 P2 Fase 1.4.
 *
 * Themes power the /p/{slug} public landing page. Each preset defines a
 * cohesive palette (primary, background, surface, text, muted, and a
 * subtle accent for badges/CTAs) so pros don't have to pick 6 colours.
 *
 * The registry MUST stay in lockstep with the backend list in
 * `backend/services/profiles.py::THEME_PRESETS`. Adding a preset requires
 * touching both files.
 */
export type ThemePreset =
  | "forest" | "violet" | "rose" | "ocean" | "sunset" | "slate" | "custom";

export type ThemeFont = "sans" | "serif" | "display";

export type ThemeMode = "light" | "dark" | "auto";

export type ProfileTheme = {
  preset: ThemePreset;
  primary_color?: string;      // Only when preset === "custom"
  font: ThemeFont;
  mode: ThemeMode;
};

/** Palette a theme resolves to. Consumed by the landing page. */
export type ResolvedTheme = {
  primary: string;             // CTA + heading accents
  primaryContrast: string;     // Text on top of primary (readable)
  bg: string;                  // Page background top (gradient start)
  bgSoft: string;              // Page background bottom (gradient end)
  surface: string;             // Card background
  surfaceMuted: string;        // Inner card sections (QR wrap, badges)
  text: string;                // Primary heading + body text
  textMuted: string;           // Secondary text
  border: string;              // Card border
  fontFamily: string;
  fontFamilyDisplay: string;   // Heading font family (may equal fontFamily)
};

/** Default theme applied when a profile hasn't customised. Matches the
 *  historical forest-green palette that existed pre-Iter56. */
export const DEFAULT_THEME: ProfileTheme = {
  preset: "forest",
  font: "sans",
  mode: "light",
};

/** Palettes for every non-custom preset, in both light & dark flavours. */
const PALETTES: Record<Exclude<ThemePreset, "custom">, {
  primary: string; primaryContrast: string;
  light: Omit<ResolvedTheme, "primary" | "primaryContrast" | "fontFamily" | "fontFamilyDisplay">;
  dark: Omit<ResolvedTheme, "primary" | "primaryContrast" | "fontFamily" | "fontFamilyDisplay">;
}> = {
  forest: {
    primary: "#4F7942",
    primaryContrast: "#FFFFFF",
    light: {
      bg: "#F2F6F2", bgSoft: "#FFFFFF",
      surface: "#FFFFFF", surfaceMuted: "#F7F8FA",
      text: "#0B1220", textMuted: "#64748B", border: "#E7ECE7",
    },
    dark: {
      bg: "#0F1A0F", bgSoft: "#0B140B",
      surface: "#152315", surfaceMuted: "#1B2E1B",
      text: "#E7ECE7", textMuted: "#9BAA9B", border: "#2A3E2A",
    },
  },
  violet: {
    primary: "#7C3AED",
    primaryContrast: "#FFFFFF",
    light: {
      bg: "#F5F3FF", bgSoft: "#FFFFFF",
      surface: "#FFFFFF", surfaceMuted: "#FAF5FF",
      text: "#0B1220", textMuted: "#6B7280", border: "#EDE9FE",
    },
    dark: {
      bg: "#1A0F2E", bgSoft: "#130A22",
      surface: "#22163A", surfaceMuted: "#2C1D48",
      text: "#EDE9FE", textMuted: "#A5A2B8", border: "#3B285A",
    },
  },
  rose: {
    primary: "#E11D48",
    primaryContrast: "#FFFFFF",
    light: {
      bg: "#FFF1F2", bgSoft: "#FFFFFF",
      surface: "#FFFFFF", surfaceMuted: "#FFF5F6",
      text: "#0B1220", textMuted: "#78716C", border: "#FECDD3",
    },
    dark: {
      bg: "#2A0F14", bgSoft: "#1E0A0E",
      surface: "#3A1620", surfaceMuted: "#4D1C2A",
      text: "#FCE7E9", textMuted: "#B29397", border: "#5A2632",
    },
  },
  ocean: {
    primary: "#0284C7",
    primaryContrast: "#FFFFFF",
    light: {
      bg: "#F0F9FF", bgSoft: "#FFFFFF",
      surface: "#FFFFFF", surfaceMuted: "#F5FAFF",
      text: "#0B1220", textMuted: "#64748B", border: "#BAE6FD",
    },
    dark: {
      bg: "#0A1B2A", bgSoft: "#06121E",
      surface: "#0F2438", surfaceMuted: "#152F49",
      text: "#DBEAFE", textMuted: "#94ADC4", border: "#1E3A5F",
    },
  },
  sunset: {
    primary: "#EA580C",
    primaryContrast: "#FFFFFF",
    light: {
      bg: "#FFF7ED", bgSoft: "#FFFFFF",
      surface: "#FFFFFF", surfaceMuted: "#FFFAF3",
      text: "#0B1220", textMuted: "#78716C", border: "#FED7AA",
    },
    dark: {
      bg: "#2A150A", bgSoft: "#1E0E06",
      surface: "#3A1E11", surfaceMuted: "#4D2717",
      text: "#FDE4CE", textMuted: "#C9AA92", border: "#5A331F",
    },
  },
  slate: {
    primary: "#1E293B",
    primaryContrast: "#FFFFFF",
    light: {
      bg: "#F8FAFC", bgSoft: "#FFFFFF",
      surface: "#FFFFFF", surfaceMuted: "#F1F5F9",
      text: "#0F172A", textMuted: "#64748B", border: "#E2E8F0",
    },
    dark: {
      bg: "#0F172A", bgSoft: "#020617",
      surface: "#1E293B", surfaceMuted: "#293548",
      text: "#F1F5F9", textMuted: "#94A3B8", border: "#334155",
    },
  },
};

/** Font-family stacks per `font` option. Uses web-safe fallbacks so we
 *  don't require loading Google Fonts on the landing (would slow it down). */
const FONT_STACKS: Record<ThemeFont, { body: string; display: string }> = {
  sans: {
    body: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
    display: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
  },
  serif: {
    body: "'Cormorant Garamond', 'Playfair Display', Georgia, 'Times New Roman', serif",
    display: "'Playfair Display', 'Cormorant Garamond', Georgia, 'Times New Roman', serif",
  },
  display: {
    body: "'Space Grotesk', 'Poppins', -apple-system, system-ui, sans-serif",
    display: "'Space Grotesk', 'Poppins', -apple-system, system-ui, sans-serif",
  },
};

/**
 * Given a stored theme + optional visitor mode preference (dark/light),
 * return the concrete palette to render the landing with.
 *
 * `mode==="auto"` behaviour: on the SERVER we cannot detect the visitor's
 * OS setting, so we default to `light`. The landing page can add a
 * `prefers-color-scheme` media query CSS override to swap at runtime for
 * clients that opt-in.
 */
export function resolveTheme(theme: ProfileTheme | null | undefined): ResolvedTheme {
  const t = { ...DEFAULT_THEME, ...(theme || {}) };
  const isDark = t.mode === "dark"; // auto & light default to light on SSR
  if (t.preset === "custom" && t.primary_color) {
    // For custom colours we reuse the slate neutrals for the rest of the
    // palette — it's the most versatile background regardless of hue.
    const base = PALETTES.slate;
    const flavour = isDark ? base.dark : base.light;
    return {
      primary: t.primary_color,
      primaryContrast: contrastOn(t.primary_color),
      ...flavour,
      fontFamily: FONT_STACKS[t.font].body,
      fontFamilyDisplay: FONT_STACKS[t.font].display,
    };
  }
  const preset = (t.preset in PALETTES ? t.preset : "forest") as Exclude<ThemePreset, "custom">;
  const palette = PALETTES[preset];
  const flavour = isDark ? palette.dark : palette.light;
  return {
    primary: palette.primary,
    primaryContrast: palette.primaryContrast,
    ...flavour,
    fontFamily: FONT_STACKS[t.font].body,
    fontFamilyDisplay: FONT_STACKS[t.font].display,
  };
}

/**
 * WCAG-ish helper: given a hex color, return "#FFFFFF" or "#0B1220"
 * whichever offers the better contrast on top. Used for custom colours.
 */
export function contrastOn(hex: string): string {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return "#FFFFFF";
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  // Perceived luminance (Y709 approximation).
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.6 ? "#0B1220" : "#FFFFFF";
}

/** Metadata (label + swatches) surfaced in the Settings preset picker. */
export type PresetInfo = { key: ThemePreset; label: string; swatch: string };

export const PRESET_INFOS: PresetInfo[] = [
  { key: "forest", label: "Bosque",     swatch: "#4F7942" },
  { key: "violet", label: "Violeta",    swatch: "#7C3AED" },
  { key: "rose",   label: "Rosa",       swatch: "#E11D48" },
  { key: "ocean",  label: "Océano",     swatch: "#0284C7" },
  { key: "sunset", label: "Atardecer",  swatch: "#EA580C" },
  { key: "slate",  label: "Pizarra",    swatch: "#1E293B" },
  { key: "custom", label: "Personalizado", swatch: "linear-gradient(90deg,#EF4444,#F59E0B,#10B981,#3B82F6,#8B5CF6)" },
];

export const FONT_INFOS: { key: ThemeFont; label: string; preview: string; family: string }[] = [
  { key: "sans",    label: "Moderna",  preview: "Aa",      family: FONT_STACKS.sans.display },
  { key: "serif",   label: "Elegante", preview: "Aa",      family: FONT_STACKS.serif.display },
  { key: "display", label: "Impacto",  preview: "Aa",      family: FONT_STACKS.display.display },
];

export const MODE_INFOS: { key: ThemeMode; label: string }[] = [
  { key: "light", label: "Claro" },
  { key: "dark",  label: "Oscuro" },
  { key: "auto",  label: "Automático" },
];
