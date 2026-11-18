"use client";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, Sparkles } from "lucide-react";
import type { SessionUser } from "@/lib/session";

export default function StepWelcome({
  user, onNext, saving,
}: {
  user: SessionUser;
  onNext: () => void;
  saving: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-primary/10 p-3">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            ¡Bienvenida{user.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}! 👋
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Vamos a configurar tu cuenta en 4 pasos rápidos (unos 3 minutos).
          </p>
        </div>
      </div>

      <ol className="grid gap-3">
        {[
          { title: "Tu negocio", desc: "Nombre público, zona horaria y moneda con la que cobras." },
          { title: "Primer servicio", desc: "Añade el servicio principal (duración y precio) para empezar a recibir reservas." },
          { title: "Horario semanal", desc: "Marca los días y horas en los que atiendes a clientes." },
          { title: "Canales de reserva", desc: "Conecta Telegram (imprescindible) y WhatsApp (opcional)." },
        ].map((s, i) => (
          <li
            key={i}
            className="flex items-start gap-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 px-4 py-3"
          >
            <span className="mt-0.5 h-6 w-6 flex items-center justify-center rounded-full bg-primary text-white text-xs font-bold">
              {i + 1}
            </span>
            <div className="min-w-0">
              <p className="font-medium">{s.title}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{s.desc}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
        <p className="font-medium">💡 Podrás cambiarlo todo después.</p>
        <p className="text-neutral-600 dark:text-neutral-400 text-xs mt-1">
          Esta configuración es solo para empezar. Añade más servicios,
          horarios o ajustes desde el dashboard cuando quieras.
        </p>
      </div>

      <div className="flex justify-end">
        <Button onClick={onNext} disabled={saving} size="lg">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Preparando…
            </>
          ) : (
            <>
              Empezar <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
