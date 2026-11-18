"use client";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Sparkles, Image as ImageIcon, Clock, Wallet, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api-client";
import type { Service } from "@/lib/types";
import { fmtEur, fmtDuration } from "@/lib/format";
import ServiceFormDialog from "./service-form-dialog";
import AvailabilityEditor from "./availability-editor";
import RecurringBlocksEditor from "./recurring-blocks-editor";

export default function ServicesClient() {
  const [items, setItems] = useState<Service[] | null>(null);
  const [editing, setEditing] = useState<Service | null>(null);
  const [creating, setCreating] = useState(false);

  const load = () => api<Service[]>("/services/mine").then(setItems).catch((e) => toast.error(e.message));
  useEffect(() => { load(); }, []);

  const onSaved = () => { load(); setEditing(null); setCreating(false); };

  const remove = async (s: Service) => {
    if (!confirm(`¿Eliminar el servicio “${s.name}”?`)) return;
    try {
      await api(`/services/mine/${s.service_id}`, { method: "DELETE" });
      toast.success("Servicio eliminado");
      load();
    } catch (e: any) { toast.error(e.message); }
  };

  const toggleActive = async (s: Service) => {
    try {
      const upd = await api<Service>(`/services/mine/${s.service_id}`, {
        method: "PATCH",
        body: { active: !s.active },
      });
      setItems((cur) => cur?.map((x) => (x.service_id === upd.service_id ? upd : x)) || null);
      toast.success(upd.active ? "Activado" : "Desactivado");
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-violet-700 uppercase tracking-wider">Módulos 2 + 9</p>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Servicios y disponibilidad</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 dark:text-neutral-500 mt-1">
            Gestiona precios, depósitos, extras y horario semanal.
          </p>
        </div>
        <Button onClick={() => setCreating(true)} className="self-start sm:self-auto">
          <Plus className="h-4 w-4 mr-1" /> Nuevo servicio
        </Button>
      </div>

      {items === null ? (
        <div className="grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-lg" />)}
        </div>
      ) : items.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <div className="h-12 w-12 rounded-full bg-violet-100 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="h-6 w-6 text-violet-600" />
            </div>
            <p className="font-semibold text-neutral-900 dark:text-neutral-100">Aún no tienes servicios</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 dark:text-neutral-500 mt-1">Crea el primero para que el bot pueda empezar a agendarlos.</p>
            <Button onClick={() => setCreating(true)} className="mt-4">
              <Plus className="h-4 w-4 mr-1" /> Crear servicio
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((s) => (
            <ServiceCard
              key={s.service_id}
              service={s}
              onEdit={() => setEditing(s)}
              onDelete={() => remove(s)}
              onToggleActive={() => toggleActive(s)}
            />
          ))}
        </div>
      )}

      <AvailabilityEditor />
      <RecurringBlocksEditor />

      <ServiceFormDialog
        open={creating || !!editing}
        initial={editing}
        onClose={() => { setCreating(false); setEditing(null); }}
        onSaved={onSaved}
      />
    </div>
  );
}

function ServiceCard({
  service, onEdit, onDelete, onToggleActive,
}: {
  service: Service; onEdit: () => void; onDelete: () => void; onToggleActive: () => void;
}) {
  const extrasSum = service.extras.reduce((s, e) => s + e.price_eur, 0);
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-3">
          <div className="h-16 w-16 rounded-md bg-neutral-100 dark:bg-neutral-800 overflow-hidden flex items-center justify-center shrink-0">
            {service.photo_url ? (
              <img src={service.photo_url} alt={service.name} className="h-full w-full object-cover" />
            ) : (
              <ImageIcon className="h-6 w-6 text-neutral-400 dark:text-neutral-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">{service.name}</h3>
              <Badge variant={service.active ? "default" : "secondary"} className={service.active ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : ""}>
                {service.active ? "Activo" : "Inactivo"}
              </Badge>
            </div>
            {service.description && <p className="text-xs text-neutral-500 dark:text-neutral-400 dark:text-neutral-500 line-clamp-2 mt-1">{service.description}</p>}
            <div className="flex-wrap gap-3 mt-2 text-xs text-neutral-600 dark:text-neutral-400 dark:text-neutral-500">
              <span className="inline-flex items-center gap-1"><Wallet className="h-3 w-3" /> {fmtEur(service.price_eur)}</span>
              <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {fmtDuration(service.duration_min)}</span>
              <span className="text-neutral-400 dark:text-neutral-500">Depósito {service.deposit_pct}%</span>
              {service.extras.length > 0 && (
                <span className="inline-flex items-center gap-1 text-violet-700 font-semibold">
                  <Sparkles className="h-3 w-3" /> {service.extras.length} extras (+{fmtEur(extrasSum)})
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800">
          <Button variant="outline" size="sm" onClick={onEdit} className="flex-1">
            <Pencil className="h-3 w-3 mr-1" /> Editar
          </Button>
          <Button variant="outline" size="sm" onClick={onToggleActive} className="flex-1">
            {service.active ? "Desactivar" : "Activar"}
          </Button>
          <Button variant="outline" size="sm" onClick={onDelete} className="text-red-600 hover:text-red-700">
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
