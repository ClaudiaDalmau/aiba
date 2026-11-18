/**
 * Dynamic Open Graph image for the whole site.
 *
 * Next.js picks this file up automatically for every marketing route and
 * generates a 1200×630 PNG per request (edge-cached). No static asset
 * needed — the file below IS the image. See:
 * https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image
 */
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "AIBA — Reservas con IA para profesionales independientes";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F766E 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
          padding: 80,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            marginBottom: 40,
          }}
        >
          <div
            style={{
              fontSize: 100,
              lineHeight: 1,
            }}
          >
            📅
          </div>
          <div
            style={{
              fontSize: 64,
              fontWeight: 800,
              color: "white",
              letterSpacing: -1,
            }}
          >
            AIBA
          </div>
        </div>
        <div
          style={{
            fontSize: 40,
            color: "rgba(255,255,255,0.9)",
            textAlign: "center",
            maxWidth: 900,
            lineHeight: 1.3,
            fontWeight: 500,
          }}
        >
          Reservas automáticas con IA + Telegram para profesionales independientes
        </div>
        <div
          style={{
            marginTop: 60,
            display: "flex",
            gap: 20,
            fontSize: 28,
            color: "rgba(255,255,255,0.75)",
            fontWeight: 600,
          }}
        >
          <span>🤖 Chatbot 24/7</span>
          <span>·</span>
          <span>💳 Depósito</span>
          <span>·</span>
          <span>🌐 7 idiomas</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
