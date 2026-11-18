import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { CookieConsentProvider } from "@/components/cookie-consent/cookie-consent-provider";
import { AnalyticsGate } from "@/components/cookie-consent/analytics-gate";
import { CookieBanner } from "@/components/cookie-consent/cookie-banner";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    (process.env.NEXT_PUBLIC_SITE_URL || "https://aibookingassistant.app").replace(/\/$/, "")
  ),
  title: "AI Booking · Dashboard",
  description: "Dashboard profesional para gestionar reservas, servicios y pagos con AI Booking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <CookieConsentProvider>
            {children}
            <CookieBanner />
            <Toaster position="top-right" richColors />
          </CookieConsentProvider>
        </ThemeProvider>
        <AnalyticsGate />
      </body>
    </html>
  );
}
