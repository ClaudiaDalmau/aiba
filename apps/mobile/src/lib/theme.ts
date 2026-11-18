import { useColorScheme } from "react-native";

const light = {
  bg: "#F7F8FA",
  surface: "#FFFFFF",
  surfaceAlt: "#EEF1F4",
  border: "#E2E8F0",
  text: "#0B1220",
  textMuted: "#475569",
  textFaint: "#94A3B8",
  accent: "#7C3AED",
  accentText: "#FFFFFF",
  positive: "#1E8E5A",
  positiveBg: "#E7F5EE",
  warning: "#B26A00",
  warningBg: "#FFF3DF",
  danger: "#C2362B",
  dangerBg: "#FCEAE8",
  info: "#7C3AED",
  infoBg: "#EDE9FE",
  bubbleCustomer: "#FFFFFF",
  bubbleAgent: "#7C3AED",
  bubbleAgentText: "#FFFFFF",
  bubbleOwner: "#5B21B6",
  bubbleOwnerText: "#FFFFFF",
};

const dark: typeof light = {
  bg: "#0B1220",
  surface: "#111827",
  surfaceAlt: "#1A2232",
  border: "#273244",
  text: "#F8FAFC",
  textMuted: "#A3AEBF",
  textFaint: "#6B7689",
  accent: "#A78BFA",
  accentText: "#0B1220",
  positive: "#4ACB8B",
  positiveBg: "#12261C",
  warning: "#F0A63A",
  warningBg: "#2A1F0E",
  danger: "#FF6B5E",
  dangerBg: "#2C1311",
  info: "#A78BFA",
  infoBg: "#1E1638",
  bubbleCustomer: "#1A2232",
  bubbleAgent: "#A78BFA",
  bubbleAgentText: "#0B1220",
  bubbleOwner: "#7C3AED",
  bubbleOwnerText: "#FFFFFF",
};

export type Theme = typeof light;

export function useTheme(): Theme {
  return useColorScheme() === "dark" ? dark : light;
}

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 8, md: 12, lg: 16, xl: 22, pill: 999 };
