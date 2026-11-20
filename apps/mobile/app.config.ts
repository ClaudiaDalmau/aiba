import type { ConfigContext, ExpoConfig } from "expo/config";

/**
 * Dos apps desde el mismo código:
 *  - APP_VARIANT=ordinaria (por defecto): «AIBA Business», App Store y Google Play.
 *  - APP_VARIANT=sensible: app aparte para la plataforma Sensible, distribuida fuera de las
 *    tiendas (APK en Android, Web Distribution UE en iOS). Nombre e identificadores neutros
 *    para que nada en el móvil revele de qué es; icono con corazón en lugar de estrella.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const sensible = process.env.APP_VARIANT === "sensible";
  if (!sensible) return { ...config, name: config.name ?? "AIBA Business", slug: config.slug ?? "aiba-business", extra: { ...config.extra, variant: "ordinaria" } };
  const a = "./assets/sensible";
  return {
    ...config,
    name: "AIBA",
    slug: "aiba-agenda",
    owner: "aiba-app",
    scheme: "aibaagenda",
    icon: `${a}/icon.png`,
    ios: { ...config.ios, supportsTablet: false, bundleIdentifier: "app.aiba.agenda" },
    android: {
      ...config.android,
      package: "app.aiba.agenda",
      adaptiveIcon: {
        backgroundColor: "#7c3aed",
        foregroundImage: `${a}/android-icon-foreground.png`,
        backgroundImage: `${a}/android-icon-background.png`,
        monochromeImage: `${a}/android-icon-monochrome.png`,
      },
    },
    web: { ...config.web, favicon: `${a}/favicon.png` },
    extra: { ...config.extra, variant: "sensible", eas: { projectId: "4c9a1f77-220d-4c3a-a3a4-53c245e32fd6" } },
  };
};
