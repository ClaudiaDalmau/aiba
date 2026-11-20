import Constants from "expo-constants";
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || "http://localhost:3200").replace(/\/$/, "");
export const POLL_INTERVAL_MS = 20_000;


/** Which of the two apps this build is (app.config.ts → extra.variant). */
export const VARIANT: "ordinaria" | "sensible" = Constants.expoConfig?.extra?.variant === "sensible" ? "sensible" : "ordinaria";
export const APP_NAME = VARIANT === "sensible" ? "AIBA" : "AIBA Business";

/** Each app only shows the businesses of its own platform. */
export const belongsHere = (platform?: string) => (VARIANT === "sensible" ? platform === "sensitive" : platform !== "sensitive");
