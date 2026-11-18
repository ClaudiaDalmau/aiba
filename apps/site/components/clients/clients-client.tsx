"use client";
import { useEffect, useState } from "react";
import { Users, Search, ShieldAlert, Flag, Star, Loader2, X, Download } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { fmtEur, fmtDateTime } from "@/lib/format";
import { ClientNotesPanel } from "@/components/clients/client-notes-panel";

type ClientRow = {
  client_id: string; name: string; phone?: string | null;
  telegram_chat_id?: number | null; is_blacklisted: boolean;
  global_score?: number | null; bookings_count?: number;
};
type BlacklistItem = {
  client_id: string; client_name: string; reason: string; created_at: string;
};
type Detail = {
  client: ClientRow;
  aggregates: { avg_stars: number | null; ratings_count: number; top_tags: string[] };
  own_ratings: { stars: number; tags: string[]; private_notes?: string | null; created_at: string }[];
  bookings: { booking_id: string; service_name: string; scheduled_at: string; status: string; price_eur: number }[];
};

export default function ClientsClient({ isSensitiveVertical = false }: { isSensitiveVertical?: boolean }) {
  const [tab, setTab] = useState<"directory" | "blacklist">("directory");
  const [q, setQ] = useState("");
  const [list, setList] = useState<ClientRow[] | null>(null);
  const [blacklist, setBlacklist] = useState<BlacklistItem[] | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [flagOpen, setFlagOpen] = useState(false);
  const [flagReason, setFlagReason] = useState("");
  const [flagLoading, setFlagLoading] = useState(false);

  const loadList = () =>
    api<ClientRow[]>(`/clients/search?q=${encodeURIComponent(q)}`).then(setList).catch((e) => toast.error(e.message));
  const loadBlacklist = () =>
    api<BlacklistItem[]>("/blacklist/mine").then(setBlacklist).catch((e) => toast.error(e.message));

  useEffect(() => {
    loadList();
    // Solo cargar la verificación colaborativa si el vertical lo requiere
    if (isSensitiveVertical) loadBlacklist();
  }, [isSensitiveVertical]);

  // Search debounce
  useEffect(() => {
    const id = setTimeout(loadList, 300);
    return () => clearTimeout(id);
     
  }, [q]);

  const openDetail = async (cid: string) => {
    setDetail(null);
    setLoadingDetail(true);
    try { setDetail(await api<Detail>(`/clients/${cid}`)); }
    catch (e: any) { toast.error(e.message); }
    finally { setLoadingDetail(false); }
  };

  const submitFlag = async () => {
    if (!detail) return;
    if (flagReason.trim().length < 3) { toast.error("Escribe al menos 3 caracteres"); return; }
    setFlagLoading(true);
    try {
      const res = await api<{ status: string; distinct_pros: number; message?: string }>(
        "/blacklist/flag", { method: "POST", body: { client_id: detail.client.client_id, reason: flagReason.trim() } },
      );
      setFlagOpen(false); setFlagReason("");
      if (res.status === "blacklisted") {
        toast.success(`Cliente en blacklist global (${res.distinct_pros} pros)`);
      } else {
        toast.success(res.message || "Reporte registrado");
      }
      openDetail(detail.client.client_id);
      loadList(); loadBlacklist();
    } catch (e: any) { toast.error(e.message); }
    finally { setFlagLoading(false); }
  };

  const [downloading, setDownloading] = useState(false);
  const downloadCsv = async () => {
    setDownloading(true);
    try {
      const r = await fetch("/api/backend/exports/clients.csv", { cache: "no-store" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const blob = await r.blob();
      let filename = "clients.csv";
      const cd = r.headers.get("content-disposition");
      const m = cd && /filename="?([^"]+)"?/.exec(cd);
      if (m) filename = m[1];
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
      toast.success("CSV descargado");
    } catch (e: any) {
      toast.error(e.message || "Error al descargar");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-violet-700 uppercase tracking-wider">Módulo 6</p>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Clientes</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            {isSensitiveVertical
              ? "Directorio global, verificación colaborativa y reporte manual."
              : "Directorio global de clientes y sus reservas."}
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={downloadCsv}
          disabled={downloading}
          className="shrink-0"
        >
          {downloading
            ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            : <Download className="h-3.5 w-3.5 mr-1.5" />}
          Exportar CSV
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="directory"><Users className="h-3.5 w-3.5 mr-1" /> Directorio</TabsTrigger>
          {isSensitiveVertical && (
            <TabsTrigger value="blacklist">
              <ShieldAlert className="h-3.5 w-3.5 mr-1" /> Verificación colaborativa ({blacklist?.length ?? 0})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="directory" className="space-y-3 mt-4">
          <div className="relative max-w-md">
            <Search className="h-4 w-4 absolute left-3 top-3 text-neutral-400 dark:text-neutral-500" />
            <Input
              value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nombre o teléfono..." className="pl-9"
            />
          </div>
          {list === null ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
            </div>
          ) : list.length === 0 ? (
            <p className="text-center py-8 text-sm text-neutral-500 dark:text-neutral-400 dark:text-neutral-500">Sin resultados.</p>
          ) : (
            <div className="space-y-2">
              {list.map((c) => (
                <Card key={c.client_id} className="cursor-pointer hover:shadow-md transition" onClick={() => openDetail(c.client_id)}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold ${
                      c.is_blacklisted && isSensitiveVertical ? "bg-red-100 text-red-700" : "bg-violet-100 text-violet-800"
                    }`}>
                      {c.is_blacklisted && isSensitiveVertical ? "🚫" : (c.name?.[0]?.toUpperCase() || "?")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate">{c.name}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                        {c.phone || "—"}
                        {c.bookings_count ? ` · ${c.bookings_count} reservas` : ""}
                      </p>
                    </div>
                    {c.global_score !== null && c.global_score !== undefined && (
                      <Badge variant="outline" className="font-mono">
                        <Star className="h-3 w-3 mr-1 fill-current" /> {c.global_score.toFixed(1)}
                      </Badge>
                    )}
                    {c.is_blacklisted && isSensitiveVertical && <Badge className="bg-red-100 text-red-700">Bloqueado</Badge>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="blacklist" className="space-y-2 mt-4">
          {blacklist === null ? (
            <Skeleton className="h-24" />
          ) : blacklist.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <ShieldAlert className="h-8 w-8 mx-auto text-neutral-300" />
                <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">No hay clientes en tu lista de verificación colaborativa.</p>
              </CardContent>
            </Card>
          ) : blacklist.map((b) => (
            <Card key={b.client_id + b.created_at}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-red-100 flex items-center justify-center">
                  <ShieldAlert className="h-4 w-4 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate">{b.client_name}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 dark:text-neutral-500 truncate">{b.reason}</p>
                </div>
                <p className="text-[10px] text-neutral-400 dark:text-neutral-500 shrink-0">{fmtDateTime(b.created_at)}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Detail dialog */}
      <Dialog open={!!detail || loadingDetail} onOpenChange={(v) => !v && (setDetail(null), setLoadingDetail(false))}>
        <DialogContent className="max-w-lg">
          {loadingDetail ? (
            <div className="flex items-center gap-2 py-8 text-neutral-500 dark:text-neutral-400 dark:text-neutral-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando cliente...
            </div>
          ) : detail ? (
            <>
              <DialogHeader>
                <DialogTitle>{detail.client.name}</DialogTitle>
                <DialogDescription>
                  {detail.client.phone || "—"} · Telegram {detail.client.telegram_chat_id || "—"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid-cols-3 gap-2">
                  <MiniStat label="Media⭐" value={detail.aggregates.avg_stars?.toFixed(1) || "—"} />
                  <MiniStat label="Reseñas" value={String(detail.aggregates.ratings_count)} />
                  <MiniStat label="Tags" value={String(detail.aggregates.top_tags.length)} />
                </div>

                {!detail.client.is_blacklisted && (
                  <Button variant="outline" onClick={() => setFlagOpen(true)}
                    className="w-full text-red-600 border-red-200 hover:bg-red-50">
                    <Flag className="h-3.5 w-3.5 mr-1" /> Reportar cliente
                  </Button>
                )}

                {/* Iter85 — Private per-pro notes */}
                <ClientNotesPanel clientId={detail.client.client_id} />

                {detail.own_ratings.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 dark:text-neutral-500 uppercase tracking-wide mb-2">Tus reseñas</p>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {detail.own_ratings.map((r, i) => (
                        <div key={i} className="rounded-md bg-neutral-50 dark:bg-neutral-900 p-2">
                          <div className="flex items-center gap-2">
                            <span className="text-amber-500">{"⭐".repeat(r.stars)}</span>
                            <span className="text-[10px] text-neutral-500 dark:text-neutral-400 dark:text-neutral-500">{fmtDateTime(r.created_at)}</span>
                          </div>
                          {r.tags.length > 0 && <p className="text-xs text-neutral-600 dark:text-neutral-400 dark:text-neutral-500 mt-1">{r.tags.join(" · ")}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Flag dialog */}
      <Dialog open={flagOpen} onOpenChange={(v) => { if (!v) { setFlagOpen(false); setFlagReason(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <Flag className="h-4 w-4" /> Reportar cliente
            </DialogTitle>
            <DialogDescription>
              Cuando ≥2 profesionales distintos reporten al mismo cliente, se añadirá automáticamente a la blacklist global.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Motivo</Label>
            <textarea
              value={flagReason} onChange={(e) => setFlagReason(e.target.value)}
              placeholder="Comportamiento agresivo, robo, insultos..." rows={3} maxLength={500}
              className="flex w-full rounded-md border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => { setFlagOpen(false); setFlagReason(""); }} className="flex-1">Cancelar</Button>
              <Button onClick={submitFlag} disabled={flagLoading} className="flex-1 bg-red-600 hover:bg-red-700">
                {flagLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Enviar reporte
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
      <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400 dark:text-neutral-500 font-semibold">{label}</p>
    </div>
  );
}
