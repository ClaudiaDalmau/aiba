"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Search, ChevronDown, ChevronRight, Sparkles, Calendar, Users,
  CreditCard, MessageCircle, ShieldCheck, Zap, Book, Mail, Rocket,
  Phone, HelpCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type FAQ = {
  id: string;
  category: string;
  q: string;
  a: string;
  links?: { label: string; href: string }[];
};

const CATEGORIES = [
  { key: "getting_started", label: "Empezar", icon: Rocket, color: "text-violet-600" },
  { key: "bookings",         label: "Reservas", icon: Calendar, color: "text-emerald-600" },
  { key: "clients",          label: "Clientes", icon: Users, color: "text-blue-600" },
  { key: "payments",         label: "Pagos", icon: CreditCard, color: "text-fuchsia-600" },
  { key: "telegram",         label: "Bot Telegram", icon: MessageCircle, color: "text-sky-600" },
  { key: "phone",            label: "Bot Teléfono (IA)", icon: Phone, color: "text-amber-600" },
  { key: "security",         label: "Seguridad y RGPD", icon: ShieldCheck, color: "text-teal-600" },
  { key: "plans",            label: "Planes y facturación", icon: Sparkles, color: "text-rose-600" },
];

const FAQS: FAQ[] = [
  // ── Empezar ────────────────────────────────────────────────────────
  {
    id: "gs_1",
    category: "getting_started",
    q: "¿Por dónde empiezo cuando entro por primera vez?",
    a: "Ve al asistente de configuración inicial: te guía en 5 pasos (bienvenida, negocio, primer servicio, horario y canales). Al terminar tu página pública y tu bot de Telegram quedan operativos.",
    links: [{ label: "Abrir asistente", href: "/onboarding" }],
  },
  {
    id: "gs_2",
    category: "getting_started",
    q: "¿Cómo comparto mi página con clientes?",
    a: "En el Dashboard tienes el widget «Compartir mi página» con enlace directo, QR descargable y accesos rápidos a WhatsApp, X e Instagram.",
    links: [{ label: "Ir al Dashboard", href: "/dashboard" }],
  },
  {
    id: "gs_3",
    category: "getting_started",
    q: "¿Puedo tener varias sedes o perfiles en una misma cuenta?",
    a: "Sí. En Ajustes → Perfiles puedes crear múltiples perfiles (p. ej. «Estudio Centro» y «Estudio Norte»), cada uno con su agenda, servicios y página pública.",
    links: [{ label: "Ajustes", href: "/settings" }],
  },

  // ── Reservas ───────────────────────────────────────────────────────
  {
    id: "bk_1",
    category: "bookings",
    q: "¿Cómo confirmo una reserva pendiente?",
    a: "Desde la Agenda o desde el detalle de la reserva pulsa «Confirmar». Si la reserva requiere depósito, se creará el enlace de pago automáticamente.",
    links: [{ label: "Agenda", href: "/agenda" }],
  },
  {
    id: "bk_2",
    category: "bookings",
    q: "¿Cómo evito los no-shows (clientes que no acuden)?",
    a: "Activa el depósito obligatorio en tus servicios y usa los recordatorios T-24h por email + Telegram. Estadísticamente reduce los no-shows en más del 60%.",
    links: [{ label: "Servicios", href: "/services" }],
  },
  {
    id: "bk_3",
    category: "bookings",
    q: "Un cliente quiere cambiar la hora. ¿Cómo lo hago?",
    a: "Abre la reserva desde la agenda y pulsa «Reprogramar». Elige el nuevo hueco disponible y el cliente recibirá una notificación con el cambio.",
  },
  {
    id: "bk_4",
    category: "bookings",
    q: "¿Puedo bloquear horas para descanso o formación?",
    a: "Sí, en Agenda → «Bloquear franja». Los bloques respetan tu horario habitual y evitan que se reserven encima.",
    links: [{ label: "Agenda", href: "/agenda" }],
  },

  // ── Clientes ───────────────────────────────────────────────────────
  {
    id: "cl_1",
    category: "clients",
    q: "¿Cómo importo mi lista de clientes desde otra plataforma?",
    a: "En Clientes → Importar CSV. Aceptamos formatos de Booksy, Fresha y Timely (columnas: nombre, teléfono, email, notas). Coincide por teléfono/email y evita duplicados.",
    links: [{ label: "Clientes", href: "/clients" }],
  },
  {
    id: "cl_2",
    category: "clients",
    q: "¿Qué es la verificación colaborativa?",
    a: "Cuando 2 profesionales verificadas reportan al mismo cliente por comportamiento problemático, el cliente entra automáticamente en una blacklist compartida (respetando el RGPD). Solo aparece en verticales sensibles.",
  },
  {
    id: "cl_3",
    category: "clients",
    q: "¿Cómo veo el histórico de un cliente?",
    a: "En Clientes, pulsa sobre cualquier cliente para ver sus reservas, tus reseñas privadas y su score global.",
    links: [{ label: "Clientes", href: "/clients" }],
  },

  // ── Pagos ──────────────────────────────────────────────────────────
  {
    id: "pay_1",
    category: "payments",
    q: "¿Qué proveedor de pagos usáis?",
    a: "Mangopay para verticales de estética/masaje/coaching. Estamos añadiendo Vendo Services y opciones adicionales según categoría de negocio.",
  },
  {
    id: "pay_2",
    category: "payments",
    q: "¿Cuál es la comisión de la plataforma?",
    a: "La comisión depende de tu plan: Basic no permite cobro online, Pro aplica ~1.9% y Premium ~1.4%. La comisión se deduce automáticamente de cada cita completada.",
    links: [{ label: "Pagos", href: "/payments" }],
  },
  {
    id: "pay_3",
    category: "payments",
    q: "¿Cómo hago un reembolso a un cliente?",
    a: "Abre el pago desde /payments y pulsa «Reembolsar». El importe se devuelve a la tarjeta original en 3-7 días laborables.",
    links: [{ label: "Pagos", href: "/payments" }],
  },

  // ── Telegram ───────────────────────────────────────────────────────
  {
    id: "tg_1",
    category: "telegram",
    q: "¿Cómo activo el bot de Telegram?",
    a: "El bot ya está activo. Comparte el enlace de tu página con clientes y verán un botón «Reservar por Telegram». Puedes personalizar mensajes en Ajustes → Bot.",
    links: [{ label: "Ajustes", href: "/settings" }],
  },
  {
    id: "tg_2",
    category: "telegram",
    q: "¿Puedo tomar el control de la conversación manualmente?",
    a: "Sí. Envía el comando /takeover al bot mientras habla con un cliente para pausar la IA. Cuando termines, /endtakeover reactiva al bot.",
  },

  // ── Bot Teléfono ────────────────────────────────────────────────────
  {
    id: "ph_1",
    category: "phone",
    q: "¿Qué es AI Phone Support?",
    a: "Un bot de voz que responde a llamadas en tu número comercial 24/7. Reconoce voz, entiende peticiones y agenda reservas o transfiere a un humano cuando lo pides.",
    links: [{ label: "Configurar bot de voz", href: "/settings/ai-phone" }],
  },
  {
    id: "ph_2",
    category: "phone",
    q: "¿Qué necesito para activarlo?",
    a: "Una cuenta Twilio con un número comprado, el Account SID y el Auth Token. Los apuntas al webhook que aparece en /settings/ai-phone y listo.",
    links: [{ label: "Configurar", href: "/settings/ai-phone" }],
  },
  {
    id: "ph_3",
    category: "phone",
    q: "¿En qué idiomas responde?",
    a: "Español, catalán e inglés. El idioma por defecto se define en la configuración del bot y puede cambiarse por llamada.",
  },

  // ── Seguridad y RGPD ─────────────────────────────────────────────
  {
    id: "sec_1",
    category: "security",
    q: "¿Cómo descargo todos mis datos (RGPD art. 20)?",
    a: "En Exportar datos puedes descargar un ZIP completo con reservas, clientes, pagos, servicios, reseñas y métricas de crecimiento en un solo clic.",
    links: [{ label: "Exportar mis datos", href: "/exports" }],
  },
  {
    id: "sec_2",
    category: "security",
    q: "¿Cómo elimino mi cuenta?",
    a: "Ajustes → Zona peligrosa → Eliminar cuenta. El borrado es definitivo y se completa en 30 días máximo. Antes de borrar exporta tus datos si los necesitas.",
    links: [{ label: "Ajustes", href: "/settings" }],
  },
  {
    id: "sec_3",
    category: "security",
    q: "¿Dónde se almacenan mis datos?",
    a: "En servidores dentro de la Unión Europea. Todo el tráfico va cifrado con TLS 1.3 y las contraseñas se guardan con bcrypt. Hacemos backups automáticos diarios.",
  },

  // ── Planes ─────────────────────────────────────────────────────────
  {
    id: "pl_1",
    category: "plans",
    q: "¿Qué diferencia hay entre Basic, Pro y Premium?",
    a: "Basic: agenda + bot Telegram sin cobro online. Pro: cobros online, recordatorios T-24h/T-1h, alertas de rating. Premium: todo lo anterior + resúmenes diarios, analíticas VIP y foro premium.",
  },
  {
    id: "pl_2",
    category: "plans",
    q: "¿Puedo cambiar de plan en cualquier momento?",
    a: "Sí, en Ajustes → Plan. El prorrateo se calcula automáticamente y el cambio surte efecto inmediato.",
    links: [{ label: "Ajustes", href: "/settings" }],
  },
  {
    id: "pl_3",
    category: "plans",
    q: "¿Cómo gano crédito con el programa de referidos?",
    a: "Comparte tu código único desde la sección Referidos. Cuando una profesional invitada pague su primera mensualidad, tú recibes 20€ de crédito automáticamente.",
    links: [{ label: "Referidos", href: "/referrals" }],
  },
];

export default function HelpClient() {
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return FAQS.filter((f) => {
      if (activeCategory && f.category !== activeCategory) return false;
      if (!query) return true;
      return (
        f.q.toLowerCase().includes(query) ||
        f.a.toLowerCase().includes(query) ||
        f.category.toLowerCase().includes(query)
      );
    });
  }, [q, activeCategory]);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    FAQS.forEach((f) => { map[f.category] = (map[f.category] || 0) + 1; });
    return map;
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold text-violet-700 uppercase tracking-wider flex items-center gap-1.5">
          <HelpCircle className="h-3.5 w-3.5" /> Centro de ayuda
        </p>
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Preguntas frecuentes</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Respuestas rápidas a las dudas más habituales. Si no encuentras lo que buscas, escríbenos.
        </p>
      </div>

      <div className="relative">
        <Search className="h-4 w-4 absolute left-3 top-3 text-neutral-400 dark:text-neutral-500 pointer-events-none" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar en la ayuda…"
          className="pl-9"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={activeCategory === null ? "default" : "outline"}
          onClick={() => setActiveCategory(null)}
        >
          Todos
          <Badge variant="secondary" className="ml-1.5 text-[10px]">{FAQS.length}</Badge>
        </Button>
        {CATEGORIES.map((c) => {
          const Icon = c.icon;
          const active = activeCategory === c.key;
          return (
            <Button
              key={c.key}
              size="sm"
              variant={active ? "default" : "outline"}
              onClick={() => setActiveCategory(active ? null : c.key)}
              className="gap-1.5"
            >
              <Icon className={`h-3.5 w-3.5 ${active ? "" : c.color}`} />
              {c.label}
              <Badge variant="secondary" className="ml-1 text-[10px]">
                {counts[c.key] || 0}
              </Badge>
            </Button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center space-y-2">
            <Book className="h-8 w-8 mx-auto text-neutral-300" />
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              No hay resultados para «{q}». Prueba con otra palabra.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((f) => {
            const isOpen = openId === f.id;
            const cat = CATEGORIES.find((c) => c.key === f.category);
            const Icon = cat?.icon || Sparkles;
            return (
              <Card key={f.id}>
                <CardContent className="p-0">
                  <button
                    onClick={() => setOpenId(isOpen ? null : f.id)}
                    className="w-full flex items-start gap-3 p-4 text-left hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors"
                    aria-expanded={isOpen}
                  >
                    <div className={`h-8 w-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0 ${cat?.color || ""}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-neutral-900 dark:text-neutral-100">{f.q}</p>
                      {isOpen && (
                        <div className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                          <p>{f.a}</p>
                          {f.links && f.links.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {f.links.map((l) => (
                                <Link
                                  key={l.href}
                                  href={l.href}
                                  className="inline-flex items-center gap-1 text-xs font-medium text-violet-700 dark:text-violet-300 hover:underline"
                                >
                                  <Zap className="h-3 w-3" /> {l.label}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4 text-neutral-400 dark:text-neutral-500 shrink-0 mt-1" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-neutral-400 dark:text-neutral-500 shrink-0 mt-1" />
                    )}
                  </button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-violet-950/30 dark:to-fuchsia-950/30 border-violet-200 dark:border-violet-900">
        <CardContent className="p-4 flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-violet-600 text-white flex items-center justify-center shrink-0">
            <Mail className="h-5 w-5" />
          </div>
          <div className="flex-1 text-sm">
            <p className="font-semibold text-violet-900 dark:text-violet-100">
              ¿No encuentras respuesta?
            </p>
            <p className="text-violet-800/80 dark:text-violet-200/80 mt-0.5">
              Escríbenos y te respondemos en menos de 24h (menos de 4h en plan Premium).
            </p>
            <a
              href="mailto:info@aibookingassistant.app"
              className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-violet-700 dark:text-violet-300 hover:underline"
            >
              <Mail className="h-3 w-3" /> info@aibookingassistant.app
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
