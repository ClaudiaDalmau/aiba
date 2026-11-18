"use client";
import { useEffect, useState } from "react";
import {
  Download, FileSpreadsheet, Users, CreditCard, Wrench, Star,
  TrendingUp, Archive, ShieldCheck, RefreshCw, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

type Dataset = {
  key: string;
  label: string;
  count: number | null;
  format: "csv" | "zip";
};

type SummaryResp = {
  generated_at: string;
  datasets: Dataset[];
};

const ICONS: Record<string, any> = {
  bookings: FileSpreadsheet,
  clients: Users,
  payments: CreditCard,
  services: Wrench,
  reviews: Star,
  growth: TrendingUp,
  all: Archive,
};

const DESCRIPTIONS: Record<string, string> = {
  bookings: "Todas tus reservas con cliente, servicio, precio y estado.",
  clients: "Directorio de clientes con total gastado y última visita.",
  payments: "Depósitos, cobros finales, reembolsos y comisiones.",
  services: "Catálogo de servicios con duración, precio y estado activo.",
  reviews: "Reseñas públicas recibidas en tu página de reservas.",
  growth: "MRR mensual, funnel de conversión y top clientes en un archivo.",
  all: "Un ZIP con todo lo anterior + metadata (RGPD art. 20).",
};

async function downloadFile(path: string, defaultName: string) {
  const res = await fetch(`/api/backend${path}`, { cache: "no-store" });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(t || `HTTP ${res.status}`);
  }
  // Extract filename from Content-Disposition if backend supplied one
  let filename = defaultName;
  const cd = res.headers.get("content-disposition");
  const m = cd && /filename="?([^"]+)"?/.exec(cd);
  if (m) filename = m[1];

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function ExportsClient() {
  const [summary, setSummary] = useState<SummaryResp | null>(null);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    try {
      const r = await fetch("/api/backend/exports/summary", { cache: "no-store" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setSummary(await r.json());
    } catch (e: any) {
      toast.error(e.message || "No se pudo cargar el resumen");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const handleDownload = async (ds: Dataset) => {
    const suffix = ds.format === "zip" ? "all.zip" : `${ds.key}.csv`;
    const path = `/exports/${suffix}`;
    setLoading((s) => ({ ...s, [ds.key]: true }));
    try {
      await downloadFile(path, suffix);
      toast.success(`${ds.label} descargado`);
    } catch (e: any) {
      toast.error(e.message || "Error al descargar");
    } finally {
      setLoading((s) => ({ ...s, [ds.key]: false }));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold text-violet-700 uppercase tracking-wider">Datos y portabilidad</p>
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Exportar mis datos</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Descarga tu información en CSV (compatible con Excel y Google Sheets) o
          un ZIP completo con todos los datos. Cumple el derecho de portabilidad del RGPD.
        </p>
      </div>

      <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-900">
        <CardContent className="p-4 flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
          </div>
          <div className="flex-1 text-sm">
            <p className="font-semibold text-emerald-900 dark:text-emerald-100">
              Tus datos son tuyos
            </p>
            <p className="text-emerald-800/80 dark:text-emerald-200/80 mt-0.5">
              Ningún archivo sale del navegador sin tu clic. Los CSV llevan
              codificación UTF-8 con BOM para que Excel abra bien los acentos.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={refresh}
            disabled={refreshing}
            className="shrink-0"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
        </CardContent>
      </Card>

      {summary === null ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {summary.datasets.map((ds) => {
            const Icon = ICONS[ds.key] || FileSpreadsheet;
            const isZip = ds.format === "zip";
            const isLoading = !!loading[ds.key];
            return (
              <Card
                key={ds.key}
                className={
                  isZip
                    ? "border-violet-300 dark:border-violet-800 bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-violet-950/20 dark:to-fuchsia-950/20"
                    : ""
                }
              >
                <CardContent className="p-4 flex items-start gap-3">
                  <div
                    className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                      isZip
                        ? "bg-violet-600 text-white"
                        : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {ds.label}
                      </p>
                      <Badge variant="outline" className="text-[10px] uppercase">
                        {ds.format}
                      </Badge>
                      {typeof ds.count === "number" && (
                        <Badge variant="secondary" className="text-[10px]">
                          {ds.count.toLocaleString("es-ES")} filas
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">
                      {DESCRIPTIONS[ds.key] || ""}
                    </p>
                    <Button
                      onClick={() => handleDownload(ds)}
                      disabled={isLoading || (typeof ds.count === "number" && ds.count === 0)}
                      size="sm"
                      className="mt-3"
                      variant={isZip ? "default" : "outline"}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-1.5" />
                      )}
                      {isZip ? "Descargar todo" : "Descargar CSV"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="border-dashed">
        <CardContent className="p-4 text-xs text-neutral-600 dark:text-neutral-400 space-y-1">
          <p className="font-semibold text-neutral-800 dark:text-neutral-200">
            Nota técnica
          </p>
          <p>• Los archivos se generan en el momento del clic (sin cachés previas).</p>
          <p>• Formato CSV UTF-8 con BOM · separador coma · comillas dobles.</p>
          <p>• El ZIP incluye metadata.json con la fecha de exportación y tu email.</p>
        </CardContent>
      </Card>
    </div>
  );
}
