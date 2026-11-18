"use client";
/**
 * ProfilePicturesCard — Iter56 (P2 Fase 1.2)
 *
 * Section for the /settings page that lists every account profile of
 * the current pro and lets them upload + CROP a profile picture using
 * react-easy-crop.
 *
 * Design notes:
 *  - Uses the shared /api/profiles + PATCH endpoint (already supports
 *    `photo_base64` since Iter40).
 *  - We always produce a 512×512 JPEG so uploads stay compact and the
 *    landing page has a predictable ratio.
 *  - Dialog exposes zoom + 90° rotation + preview. Reset button clears
 *    the crop back to the source image.
 *  - Photo uploads default to a data URL under ~100 KB (well below the
 *    Mongo 450 KB per-field limit the backend enforces).
 */
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Cropper, { Area, Point } from "react-easy-crop";
import { Camera, Loader2, RotateCw, Trash2, User, ImagePlus, Check, X } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api-client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { getCroppedImg, estimateBase64Bytes } from "@/lib/image-crop";

type Profile = {
  profile_id: string;
  alias: string;
  city: string | null;
  is_default: boolean;
  is_active: boolean;
  photo_base64: string | null;
  landing_slug: string | null;
  public_url: string | null;
};

type ProfilesResp = { items: Profile[]; active_profile_id: string | null };

const MAX_BYTES = 400_000; // 400 KB safety net (backend allows ~600 KB base64)
const OUTPUT_SIZE = 512;

export default function ProfilePicturesCard() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Profile | null>(null);

  const reload = useCallback(async () => {
    try {
      const res = await api<ProfilesResp>("/profiles");
      setProfiles(res.items.filter((p) => p.is_active));
    } catch (err) {
      // Non-fatal — settings page still renders the rest of the sections.
      console.error("failed to load profiles", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const onSaved = useCallback(async () => {
    setEditing(null);
    await reload();
  }, [reload]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-violet-600" />
          <div>
            <CardTitle>Fotos de perfil</CardTitle>
            <CardDescription>
              Se muestran en tu landing pública, en el QR y en el bot de Telegram.
              Sube una imagen cuadrada — nosotros te ayudamos a recortarla.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        ) : profiles.length === 0 ? (
          <div className="rounded-md border border-dashed border-neutral-200 dark:border-neutral-800 p-6 text-center">
            <User className="h-8 w-8 text-neutral-300 dark:text-neutral-700 mx-auto mb-2" />
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Aún no tienes perfiles activos.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {profiles.map((p) => (
              <li
                key={p.profile_id}
                className="flex items-center gap-3 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3"
              >
                <ProfileAvatar profile={p} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                    {p.alias}
                    {p.is_default && (
                      <span className="ml-2 text-[10px] uppercase tracking-wider rounded-sm bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 px-1.5 py-0.5">
                        Principal
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                    {p.city || "Sin ciudad"}
                    {p.public_url && (
                      <>
                        {" · "}
                        <a
                          href={p.public_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-violet-700 dark:text-violet-300 hover:underline"
                        >
                          Ver landing
                        </a>
                      </>
                    )}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={p.photo_base64 ? "outline" : "default"}
                  onClick={() => setEditing(p)}
                  data-testid={`edit-photo-${p.profile_id}`}
                >
                  {p.photo_base64 ? (
                    <>
                      <Camera className="h-3.5 w-3.5 mr-1" />
                      Cambiar foto
                    </>
                  ) : (
                    <>
                      <ImagePlus className="h-3.5 w-3.5 mr-1" />
                      Añadir foto
                    </>
                  )}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      {editing && (
        <CropperDialog profile={editing} onCancel={() => setEditing(null)} onSaved={onSaved} />
      )}
    </Card>
  );
}

// ────────────────────────────────────────────────────────────────────────
// Avatar preview — reused inside the list row and in the dialog header.
// ────────────────────────────────────────────────────────────────────────

function ProfileAvatar({ profile, large }: { profile: Profile; large?: boolean }) {
  const size = large ? "h-16 w-16" : "h-12 w-12";
  const initial = (profile.alias?.[0] || "?").toUpperCase();
  if (profile.photo_base64) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={profile.photo_base64}
        alt={profile.alias}
        className={`${size} rounded-full object-cover ring-1 ring-neutral-200 dark:ring-neutral-800`}
      />
    );
  }
  return (
    <div
      className={`${size} rounded-full bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 flex items-center justify-center font-bold`}
      aria-hidden
    >
      {initial}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// Crop dialog
// ────────────────────────────────────────────────────────────────────────

function CropperDialog({
  profile,
  onCancel,
  onSaved,
}: {
  profile: Profile;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  // Auto-open the file picker when the dialog mounts so pros don't have to
  // hunt for the button. If they cancel, they can still choose from the
  // "Elegir otra imagen" button.
  useEffect(() => {
    const t = window.setTimeout(() => fileInputRef.current?.click(), 200);
    return () => window.clearTimeout(t);
  }, []);

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\//.test(file.type)) {
      toast.error("El archivo no es una imagen válida.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result || "");
      setSourceUrl(url);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
    };
    reader.onerror = () => toast.error("No se pudo leer el archivo.");
    reader.readAsDataURL(file);
  };

  const onSave = async () => {
    if (!sourceUrl || !croppedAreaPixels) return;
    setSaving(true);
    try {
      const dataUrl = await getCroppedImg(
        sourceUrl,
        croppedAreaPixels,
        rotation,
        OUTPUT_SIZE,
      );
      const bytes = estimateBase64Bytes(dataUrl);
      if (bytes > MAX_BYTES) {
        toast.error(
          `La foto pesa demasiado (${(bytes / 1024).toFixed(0)} KB). Prueba a bajar el zoom o elegir otra imagen.`,
        );
        return;
      }
      await api(`/profiles/${profile.profile_id}`, {
        method: "PATCH",
        body: { photo_base64: dataUrl },
      });
      toast.success("Foto de perfil actualizada");
      onSaved();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      toast.error(`No se pudo guardar la foto: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const onRemove = async () => {
    if (!profile.photo_base64) return;
    setRemoving(true);
    try {
      // Empty string clears the field — see profiles service.
      await api(`/profiles/${profile.profile_id}`, {
        method: "PATCH",
        body: { photo_base64: "" },
      });
      toast.success("Foto eliminada");
      onSaved();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      toast.error(`No se pudo eliminar la foto: ${msg}`);
    } finally {
      setRemoving(false);
    }
  };

  const hasPhoto = !!profile.photo_base64;

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Recortar foto de {profile.alias}
          </DialogTitle>
        </DialogHeader>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onPick}
          data-testid="photo-file-input"
        />

        {!sourceUrl ? (
          <div className="rounded-md border border-dashed border-neutral-200 dark:border-neutral-800 p-8 text-center space-y-3">
            <ImagePlus className="h-10 w-10 text-neutral-300 dark:text-neutral-700 mx-auto" />
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Elige una imagen desde tu ordenador.
            </p>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              Buscar imagen…
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Cropper wrapper — fixed aspect 1:1 */}
            <div className="relative w-full h-72 bg-neutral-900 rounded-md overflow-hidden">
              <Cropper
                image={sourceUrl}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
                onCropComplete={onCropComplete}
              />
            </div>

            {/* Zoom slider */}
            <label className="block">
              <span className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400 font-semibold">
                Zoom
              </span>
              <input
                type="range"
                min={1}
                max={4}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-violet-600"
                data-testid="zoom-slider"
              />
            </label>

            {/* Rotate + reset row */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setRotation((r) => (r + 90) % 360)}
              >
                <RotateCw className="h-3.5 w-3.5 mr-1" />
                Rotar 90°
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setCrop({ x: 0, y: 0 });
                  setZoom(1);
                  setRotation(0);
                }}
              >
                Reset
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => fileInputRef.current?.click()}
                className="ml-auto"
              >
                Elegir otra imagen
              </Button>
            </div>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex items-center gap-2 sm:mr-auto">
            {hasPhoto && (
              <Button
                variant="outline"
                onClick={onRemove}
                disabled={removing || saving}
              >
                {removing ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                )}
                Quitar foto actual
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onCancel} disabled={saving || removing}>
              <X className="h-3.5 w-3.5 mr-1" />
              Cancelar
            </Button>
            <Button
              onClick={onSave}
              disabled={!sourceUrl || !croppedAreaPixels || saving}
              data-testid="save-crop"
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5 mr-1" />
              )}
              Guardar recorte
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
