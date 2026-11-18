import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/i18n/client";
import { getDictionary, getLocale, getT } from "@/i18n/server";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: { default: t("AIBA: book local services, answered by AI"), template: "%s · AIBA" },
    description: t("Discover and book local service businesses. Every business has its own AI assistant on WhatsApp and Telegram."),
  };
}

export const viewport: Viewport = { themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#0b1220" }, { color: "#7c3aed" }] };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} className={inter.variable}>
      <body className="min-h-dvh font-sans text-[15px] leading-relaxed">
        <I18nProvider locale={locale} dict={getDictionary(locale)}>{children}</I18nProvider>
      </body>
    </html>
  );
}
