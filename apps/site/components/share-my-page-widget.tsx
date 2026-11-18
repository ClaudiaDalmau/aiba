"use client";
import { useState } from "react";
import { Copy, Share2, Check, QrCode, Download, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Props = {
  publicUrl: string;
  bookingSlug?: string | null;
  businessName?: string | null;
};

/**
 * Iter67 — ShareMyPageWidget (Delight).
 * Compact card in the dashboard that lets pros grab their public booking
 * link, copy it, share natively, or print a QR poster (uses the free
 * `api.qrserver.com` endpoint, no npm dependency).
 */
export default function ShareMyPageWidget({ publicUrl, bookingSlug, businessName }: Props) {
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrLoading, setQrLoading] = useState(true);

  async function copy() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast.success("Enlace copiado");
      setTimeout(() => setCopied(false), 2200);
    } catch {
      toast.error("No se pudo copiar. Selecciona y usa Ctrl/Cmd+C.");
    }
  }

  async function share() {
    const text = `Reserva tu cita conmigo en ${businessName || "AIBA"}: ${publicUrl}`;
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try { await (navigator as any).share({ url: publicUrl, text, title: businessName || "Reservar cita" }); }
      catch { /* user cancelled */ }
    } else {
      await copy();
    }
  }

  const qrSrc =
    `https://api.qrserver.com/v1/create-qr-code/?size=520x520&margin=8&data=${encodeURIComponent(publicUrl)}`;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-4 w-4 text-primary" />
            Comparte tu página
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {bookingSlug ? (
            <>
              <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 px-3 py-2">
                <p className="text-[10px] uppercase tracking-wide text-primary font-semibold">
                  Tu enlace público
                </p>
                <p className="font-mono text-xs mt-0.5 break-all">{publicUrl}</p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Button size="sm" variant="outline" onClick={copy} className="w-full">
                  {copied ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                  Copiar
                </Button>
                <Button size="sm" variant="outline" onClick={share} className="w-full">
                  <Share2 className="h-3.5 w-3.5 mr-1" /> Compartir
                </Button>
                <Button size="sm" onClick={() => setQrOpen(true)} className="w-full">
                  <QrCode className="h-3.5 w-3.5 mr-1" /> QR
                </Button>
              </div>

              <div className="flex gap-1.5 flex-wrap pt-1">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Reserva conmigo en ${businessName || "mi negocio"}: ${publicUrl}`)}`}
                  target="_blank" rel="noreferrer"
                  className="text-[11px] rounded-full bg-[#25D366] text-white px-2.5 py-1 font-medium hover:opacity-90"
                >💬 WhatsApp</a>
                <a
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(publicUrl)}&text=${encodeURIComponent(`Reserva conmigo online`)}`}
                  target="_blank" rel="noreferrer"
                  className="text-[11px] rounded-full bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 px-2.5 py-1 font-medium hover:opacity-90"
                >𝕏 Twitter</a>
                <a
                  href={`https://www.instagram.com/`}
                  target="_blank" rel="noreferrer"
                  onClick={copy}
                  className="text-[11px] rounded-full bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 text-white px-2.5 py-1 font-medium hover:opacity-90"
                  title="Copio el enlace y abro Instagram para que lo pegues en tu bio"
                >📷 Instagram</a>
              </div>
            </>
          ) : (
            <div className="text-xs text-neutral-500 py-2">
              Aún no has publicado tu página. Ve a{" "}
              <a href="/settings" className="text-primary underline">Ajustes → Slug público</a>{" "}
              para activarla.
            </div>
          )}
        </CardContent>
      </Card>

      {/* QR modal */}
      {qrOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setQrOpen(false)}
        >
          <div
            className="bg-white dark:bg-neutral-900 rounded-2xl p-6 max-w-sm w-full space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="text-lg font-bold">QR para tu local</h3>
              <p className="text-xs text-neutral-500 mt-1">
                Imprímelo y colócalo en recepción o compártelo desde el móvil.
              </p>
            </div>

            <div className="relative aspect-square rounded-lg bg-white flex items-center justify-center border border-neutral-200 overflow-hidden">
              {qrLoading && (
                <Loader2 className="h-8 w-8 animate-spin text-neutral-300 absolute" />
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrSrc}
                alt="QR"
                onLoad={() => setQrLoading(false)}
                className="w-full h-full object-contain"
              />
            </div>

            <p className="text-center font-mono text-xs text-neutral-500 break-all">
              {publicUrl}
            </p>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setQrOpen(false)}
              >
                Cerrar
              </Button>
              <a
                href={qrSrc}
                download={`qr-${bookingSlug}.png`}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-primary text-white text-sm font-medium h-9 hover:bg-primary/90"
              >
                <Download className="h-3.5 w-3.5" /> Descargar
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
