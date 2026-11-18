"use client";
import { useEffect, useState } from "react";
import { Wallet, Calendar, Hourglass, CheckCheck, Sparkles, CreditCard, RotateCcw, Undo2, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fmtEur, fmtDateTime } from "@/lib/format";

type Summary = {
  revenue_today_eur: number;
  revenue_month_eur: number;
  revenue_all_time_eur: number;
  refunds_month_eur: number;
  platform_fees_today_eur: number;
  platform_fees_month_eur: number;
  platform_fees_all_time_eur: number;
  net_payout_month_eur: number;
  ai_pay_rate: number;
  ai_pay_plan: string;
  pending_bookings: number;
  pending_deposits: number;
  completed_bookings: number;
  mock_mode: boolean;
};

type Payment = {
  payment_id: string;
  booking_id: string;
  kind: "deposit" | "final" | "refund" | "platform_fee";
  amount_eur: number;
  status: string;
  mangopay_ref?: string | null;
  reason?: string | null;
  fee_rate?: number | null;
  plan?: string | null;
  created_at: string;
};

const KIND_META: Record<Payment["kind"], { label: string; className: string; icon: any }> = {
  deposit:      { label: "Depósito",     className: "bg-violet-100 text-violet-700",  icon: Wallet },
  final:        { label: "Final",        className: "bg-emerald-100 text-emerald-700", icon: CreditCard },
  refund:       { label: "Reembolso",    className: "bg-amber-100 text-amber-700",    icon: Undo2 },
  platform_fee: { label: "AI Booking fee", className: "bg-fuchsia-100 text-fuchsia-700", icon: Sparkles },
};

export default function PaymentsClient() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [list, setList] = useState<Payment[] | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    api<Summary>("/payments/summary/mine").then(setSummary).catch((e) => toast.error(e.message));
    api<Payment[]>("/payments/mine").then(setList).catch((e) => toast.error(e.message));
  }, []);

  const downloadCsv = async () => {
    setDownloading(true);
    try {
      const r = await fetch("/api/backend/exports/payments.csv", { cache: "no-store" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const blob = await r.blob();
      let filename = "payments.csv";
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
          <p className="text-xs font-semibold text-violet-700 uppercase tracking-wider">Módulos 4 + 8</p>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Pagos</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 dark:text-neutral-500 mt-1">
            Ingresos, depósitos y capturas finales{summary?.mock_mode && " (Mangopay MOCK)"}.
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

      {/* KPI */}
      <div className="grid-cols-2 lg:grid-cols-4 gap-3">
        {summary === null ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)
        ) : (
          <>
            <Kpi label="Hoy" value={fmtEur(summary.revenue_today_eur)} icon={Calendar} accent="violet" />
            <Kpi label="Este mes" value={fmtEur(summary.revenue_month_eur)} icon={Wallet} accent="emerald" />
            <Kpi label="Pendientes" value={String(summary.pending_bookings)} sub={`+${summary.pending_deposits} sin depósito`} icon={Hourglass} accent="amber" />
            <Kpi label="Completadas" value={String(summary.completed_bookings)} icon={CheckCheck} accent="teal" />
          </>
        )}
      </div>

      {/* AI Pay band */}
      {summary && (
        <Card className="border-fuchsia-200 bg-gradient-to-br from-fuchsia-50 to-violet-50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-11 w-11 rounded-full bg-fuchsia-100 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 text-fuchsia-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-fuchsia-900">AI Booking fee · plan {summary.ai_pay_plan.toUpperCase()}</p>
              <p className="text-xs text-fuchsia-700">
                {(summary.ai_pay_rate * 100).toFixed(1)}% por cita completada · deducido automáticamente
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-fuchsia-700">−{fmtEur(summary.platform_fees_month_eur)}</p>
              <p className="text-xs text-fuchsia-700">Neto mes: {fmtEur(summary.net_payout_month_eur)}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transactions */}
      <div>
        <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Transacciones</h3>
        {list === null ? (
          <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
        ) : list.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center">
              <RotateCcw className="h-8 w-8 mx-auto text-neutral-300" />
              <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400 dark:text-neutral-500">Sin movimientos todavía.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {list.map((p) => <PaymentRow key={p.payment_id} p={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function Kpi({
  label, value, sub, icon: Icon, accent,
}: {
  label: string; value: string; sub?: string; icon: any; accent: "violet" | "emerald" | "amber" | "teal";
}) {
  const map = {
    violet: { bg: "bg-violet-100", text: "text-violet-700" },
    emerald: { bg: "bg-emerald-100", text: "text-emerald-700" },
    amber: { bg: "bg-amber-100", text: "text-amber-700" },
    teal: { bg: "bg-teal-100", text: "text-teal-700" },
  };
  const c = map[accent];
  return (
    <Card className="p-3 gap-1">
      <div className={`h-8 w-8 rounded-full ${c.bg} flex items-center justify-center`}>
        <Icon className={`h-4 w-4 ${c.text}`} />
      </div>
      <p className="text-xs text-neutral-500 dark:text-neutral-400 dark:text-neutral-500">{label}</p>
      <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{value}</p>
      {sub && <p className="text-[10px] text-neutral-400 dark:text-neutral-500">{sub}</p>}
    </Card>
  );
}

function PaymentRow({ p }: { p: Payment }) {
  const m = KIND_META[p.kind];
  const Icon = m.icon;
  const isDeduction = p.kind === "refund" || p.kind === "platform_fee";
  const feeLabel = p.kind === "platform_fee" && p.fee_rate
    ? `${(p.fee_rate * 100).toFixed(1)}%${p.plan ? ` · ${p.plan}` : ""}`
    : null;

  return (
    <Card>
      <CardContent className="p-3 flex items-center gap-3">
        <div className={`h-9 w-9 rounded-full flex items-center justify-center ${m.className}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">{m.label}</p>
            <Badge variant={p.status === "succeeded" || p.status === "refunded" ? "default" : "secondary"}
              className={`text-[10px] ${p.status === "succeeded" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : ""}`}>
              {p.status.toUpperCase()}
            </Badge>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 dark:text-neutral-500 truncate">
            {fmtDateTime(p.created_at)}
            {feeLabel ? ` · ${feeLabel}` : ""}
            {p.mangopay_ref ? ` · ${p.mangopay_ref}` : ""}
          </p>
        </div>
        <p className={`font-bold ${isDeduction ? (p.kind === "platform_fee" ? "text-fuchsia-700" : "text-amber-700") : "text-neutral-900 dark:text-neutral-100"}`}>
          {isDeduction ? "−" : "+"}{p.amount_eur.toFixed(2)}€
        </p>
      </CardContent>
    </Card>
  );
}
