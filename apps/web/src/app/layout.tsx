import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: { default: "AIBA: book local services, answered by AI", template: "%s · AIBA" },
  description: "Discover and book local service businesses. Every business has its own AI assistant on WhatsApp and Telegram.",
};

export const viewport: Viewport = { themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#0b1220" }, { color: "#7c3aed" }] };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-dvh font-sans text-[15px] leading-relaxed">{children}</body>
    </html>
  );
}
