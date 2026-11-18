"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Check, Loader2, LogOut } from "lucide-react";
import type { SessionUser } from "@/lib/session";
import { toast } from "sonner";

import StepWelcome from "./onboarding/step-welcome";
import StepBusiness from "./onboarding/step-business";
import StepService from "./onboarding/step-service";
import StepSchedule from "./onboarding/step-schedule";
import StepChannels from "./onboarding/step-channels";

export type OnboardingStatus = {
  completed: boolean;
  step: number;
  data: Record<string, unknown>;
  meta: {
    telegram_bot_username?: string | null;
    telegram_invite_code?: string | null;
    telegram_deeplink?: string | null;
    pro_telegram_chat_id?: number | null;
    is_sensitive_vertical: boolean;
    supported_timezones: string[];
    supported_currencies: string[];
    business_name_hint: string;
    user_phone: string;
    whatsapp_number: string;
  };
};

type StepId = 1 | 2 | 3 | 4 | 5;

const STEPS: { id: StepId; title: string; short: string }[] = [
  { id: 1, title: "Bienvenida", short: "Bienvenida" },
  { id: 2, title: "Tu negocio", short: "Negocio" },
  { id: 3, title: "Primer servicio", short: "Servicio" },
  { id: 4, title: "Horario semanal", short: "Horario" },
  { id: 5, title: "Canales de reserva", short: "Canales" },
];

export default function OnboardingClient({ user }: { user: SessionUser }) {
  const router = useRouter();
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [currentStep, setCurrentStep] = useState<StepId>(1);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const s = await api<OnboardingStatus>("/onboarding/status");
        setStatus(s);
        setCurrentStep(Math.min(Math.max(s.step, 1), 5) as StepId);
      } catch (e: any) {
        toast.error(e?.message || "No se pudo cargar el onboarding");
      }
    })();
  }, []);

  async function saveStep(step: StepId, payload: Record<string, unknown>) {
    setSaving(true);
    try {
      const updated = await api<OnboardingStatus>("/onboarding/step", {
        method: "POST",
        body: { step, ...payload },
      });
      setStatus(updated);
      // Server tells us the next step; but cap at 5 so we render Channels
      // instead of jumping past it (server returns 6 after finishing #5).
      const next = Math.min(step + 1, 5) as StepId;
      setCurrentStep(next);
      return true;
    } catch (e: any) {
      toast.error(e?.message || "Error guardando el paso");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function complete() {
    setCompleting(true);
    try {
      await api("/onboarding/complete", { method: "POST" });
      toast.success("¡Todo listo! Bienvenida al dashboard 🎉");
      // Small delay so the toast is visible
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 700);
    } catch (e: any) {
      toast.error(e?.message || "No se pudo completar el onboarding");
      setCompleting(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  if (!status) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const total = STEPS.length;
  const progressPct = ((currentStep - 1) / total) * 100;

  return (
    <main className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary/5 dark:from-neutral-950 dark:via-neutral-950 dark:to-primary/5">
      {/* Top bar */}
      <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white/60 dark:bg-neutral-950/60 backdrop-blur sticky top-0 z-20">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary text-white flex items-center justify-center">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Configuración</p>
            <p className="text-sm font-semibold truncate">
              AIBA · {user.email}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4 mr-1.5" />
            <span className="hidden sm:inline">Cerrar sesión</span>
          </Button>
        </div>

        {/* Step indicator */}
        <div className="mx-auto max-w-3xl px-4 pb-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
              Paso {currentStep} de {total} · {STEPS[currentStep - 1].title}
            </p>
            <p className="text-xs text-neutral-400">
              {Math.round(progressPct)}%
            </p>
          </div>
          <div className="h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          {/* Step chips */}
          <div className="mt-3 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {STEPS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  // Allow going back to already-completed steps only
                  if (s.id <= currentStep) setCurrentStep(s.id);
                }}
                disabled={s.id > currentStep}
                className={`
                  inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium whitespace-nowrap transition-colors
                  ${s.id === currentStep
                    ? "bg-primary text-white"
                    : s.id < currentStep
                      ? "bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer"
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed"}
                `}
              >
                {s.id < currentStep && <Check className="h-3 w-3" />}
                <span>{s.short}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="mx-auto max-w-3xl px-4 py-6 md:py-10">
        <Card className="shadow-sm">
          <CardContent className="p-6 md:p-8">
            {currentStep === 1 && (
              <StepWelcome
                user={user}
                onNext={() => saveStep(1, {}).then(() => {})}
                saving={saving}
              />
            )}
            {currentStep === 2 && (
              <StepBusiness
                initial={{
                  business_name: (status.data as any)?.business?.business_name || status.meta.business_name_hint || user.business_name || "",
                  timezone: (status.data as any)?.business?.timezone || "Europe/Madrid",
                  currency: (status.data as any)?.business?.currency || "EUR",
                  phone: (status.data as any)?.business?.phone || status.meta.user_phone || "",
                }}
                meta={status.meta}
                onBack={() => setCurrentStep(1)}
                onNext={(v) => saveStep(2, { business: v }).then(() => {})}
                saving={saving}
              />
            )}
            {currentStep === 3 && (
              <StepService
                initial={(status.data as any)?.service || {}}
                onBack={() => setCurrentStep(2)}
                onNext={(v) => saveStep(3, { service: v }).then(() => {})}
                saving={saving}
              />
            )}
            {currentStep === 4 && (
              <StepSchedule
                initial={(status.data as any)?.schedule?.intervals || null}
                onBack={() => setCurrentStep(3)}
                onNext={(intervals) => saveStep(4, { schedule: { intervals } }).then(() => {})}
                saving={saving}
              />
            )}
            {currentStep === 5 && (
              <StepChannels
                meta={status.meta}
                initialWhatsapp={(status.data as any)?.channels?.whatsapp_number || status.meta.whatsapp_number || ""}
                onBack={() => setCurrentStep(4)}
                onFinish={async ({ whatsapp_number, telegram_opened }) => {
                  const saved = await saveStep(5, {
                    channels: { whatsapp_number, telegram_opened },
                  });
                  if (saved) await complete();
                }}
                saving={saving || completing}
              />
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-neutral-400 mt-4">
          Todo se guarda automáticamente. Puedes cerrar sesión y continuar desde otro dispositivo.
        </p>
      </div>
    </main>
  );
}
