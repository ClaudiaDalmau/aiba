"use client";
/**
 * ProfileThemesCard — Iter56 P2 Fase 1.4.
 *
 * Per-profile theme editor. For every active profile the pro can pick:
 *   * preset colour (6 curated palettes + custom hex)
 *   * font (sans / serif / display)
 *   * mode (light / dark / auto)
 *
 * A live preview thumb renders on the right so pros see the impact in
 * real-time before hitting "Guardar" (PATCH /api/profiles/{id}).
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Palette, Check, ExternalLink, Save, Loader2, Undo2 } from "lucide-react";
import { toast } from "sonner";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api-client";
import {
  DEFAULT_THEME, PRESET_INFOS, FONT_INFOS, MODE_INFOS, resolveTheme,
  type ProfileTheme, type ThemePreset, type ThemeFont, type ThemeMode,
} from "@/lib/profile-themes";

type Profile = {
  profile_id: string;
  alias: string;
  city: string | null;
  is_default: boolean;
  is_active: boolean;
  theme: ProfileTheme | null;
  landing_slug: string | null;
  public_url: string | null;
};

type ProfilesResp = { items: Profile[]; active_profile_id: string | null };

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

export default function ProfileThemesCard() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Draft state — the theme the pro is about to save.
  const [draft, setDraft] = useState<ProfileTheme>(DEFAULT_THEME);
  const [customColor, setCustomColor] = useState("#7C3AED");
  const [saving, setSaving] = useState(false);

  const selected = useMemo(
    () => profiles.find((p) => p.profile_id === selectedId) || null,
    [profiles, selectedId],
  );

  const reload = useCallback(async () => {
    try {
      const res = await api<ProfilesResp>("/profiles");
      const active = res.items.filter((p) => p.is_active);
      setProfiles(active);
      if (active.length > 0 && !selectedId) {
        setSelectedId(active[0].profile_id);
      }
    } catch (err) {
      console.error("failed to load profiles", err);
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => { reload(); }, [reload]);

  // When the pro switches profile in the picker, reset the draft to that
  // profile's saved theme so "Descartar" always means "revert to server".
  useEffect(() => {
    if (!selected) return;
    const server = selected.theme || DEFAULT_THEME;
    setDraft({ ...DEFAULT_THEME, ...server });
    if (server.preset === "custom" && server.primary_color) {
      setCustomColor(server.primary_color);
    }
  }, [selected]);

  const dirty = useMemo(() => {
    if (!selected) return false;
    const s = { ...DEFAULT_THEME, ...(selected.theme || {}) };
    return (
      s.preset !== draft.preset ||
      s.font !== draft.font ||
      s.mode !== draft.mode ||
      (draft.preset === "custom" && s.primary_color !== draft.primary_color)
    );
  }, [selected, draft]);

  const canSaveCustom =
    draft.preset !== "custom" || HEX_RE.test(draft.primary_color || "");

  const onSave = async () => {
    if (!selected || saving) return;
    setSaving(true);
    try {
      // Only send the fields we actually care about to keep the PATCH minimal.
      const payload: ProfileTheme = {
        preset: draft.preset,
        font: draft.font,
        mode: draft.mode,
      };
      if (draft.preset === "custom") payload.primary_color = draft.primary_color;

      await api(`/profiles/${selected.profile_id}`, {
        method: "PATCH",
        body: { theme: payload },
      });
      toast.success("Tema del perfil actualizado", {
        description: `Tu landing pública ya aplica el nuevo estilo.`,
      });
      await reload();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`No se pudo guardar el tema: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const onRevert = () => {
    if (!selected) return;
    setDraft({ ...DEFAULT_THEME, ...(selected.theme || {}) });
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-violet-600" />
          <div>
            <CardTitle>Tema de la landing pública</CardTitle>
            <CardDescription>
              Elige color, tipografía y modo (claro/oscuro) para cada uno de tus perfiles. Se aplica automáticamente a{" "}
              <span className="font-mono text-xs">/p/{`{tu-slug}`}</span> en menos de 1 minuto.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <Skeleton className="h-40" />
        ) : profiles.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Profile picker chips — only shown when there's more than one */}
            {profiles.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {profiles.map((p) => (
                  <Button
                    key={p.profile_id}
                    size="sm"
                    variant={p.profile_id === selectedId ? "default" : "outline"}
                    onClick={() => setSelectedId(p.profile_id)}
                  >
                    {p.alias}
                    {p.is_default && (
                      <Badge variant="secondary" className="ml-1 text-[9px] uppercase h-4 px-1">
                        Principal
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            )}

            {selected && (
              <div className="grid gap-4 md:grid-cols-[1fr_260px]">
                <div className="space-y-4">
                  {/* Preset picker */}
                  <Section title="Paleta">
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                      {PRESET_INFOS.map((p) => (
                        <button
                          key={p.key}
                          onClick={() => setDraft((d) => ({ ...d, preset: p.key, primary_color: p.key === "custom" ? customColor : undefined }))}
                          className={`aspect-square rounded-md relative flex items-end p-1.5 transition ring-2 ${
                            draft.preset === p.key
                              ? "ring-violet-600 ring-offset-2 ring-offset-white dark:ring-offset-neutral-950"
                              : "ring-transparent hover:ring-neutral-300 dark:hover:ring-neutral-700"
                          }`}
                          style={{ background: p.swatch }}
                          data-testid={`preset-${p.key}`}
                          title={p.label}
                        >
                          {draft.preset === p.key && (
                            <div className="absolute top-1 right-1 bg-white dark:bg-neutral-950 rounded-full p-0.5">
                              <Check className="h-3 w-3 text-violet-600" />
                            </div>
                          )}
                          <span className="text-[9px] font-bold text-white drop-shadow uppercase tracking-wider">
                            {p.label.slice(0, 6)}
                          </span>
                        </button>
                      ))}
                    </div>
                    {draft.preset === "custom" && (
                      <div className="flex items-center gap-2 pt-2">
                        <label className="flex items-center gap-2 flex-1">
                          <input
                            type="color"
                            value={customColor}
                            onChange={(e) => {
                              const v = e.target.value;
                              setCustomColor(v);
                              setDraft((d) => ({ ...d, primary_color: v.toUpperCase() }));
                            }}
                            className="h-9 w-14 rounded cursor-pointer border border-neutral-200 dark:border-neutral-800"
                            data-testid="custom-color-picker"
                          />
                          <input
                            type="text"
                            value={draft.primary_color || customColor}
                            onChange={(e) => {
                              const v = e.target.value;
                              setDraft((d) => ({ ...d, primary_color: v }));
                              if (HEX_RE.test(v)) setCustomColor(v);
                            }}
                            maxLength={7}
                            placeholder="#RRGGBB"
                            className="flex-1 font-mono text-sm rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 h-9"
                          />
                        </label>
                      </div>
                    )}
                  </Section>

                  {/* Font picker */}
                  <Section title="Tipografía">
                    <div className="grid grid-cols-3 gap-2">
                      {FONT_INFOS.map((f) => (
                        <button
                          key={f.key}
                          onClick={() => setDraft((d) => ({ ...d, font: f.key }))}
                          className={`rounded-md border p-3 text-center transition ${
                            draft.font === f.key
                              ? "border-violet-600 bg-violet-50 dark:bg-violet-950/30 text-violet-900 dark:text-violet-100"
                              : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700"
                          }`}
                          data-testid={`font-${f.key}`}
                        >
                          <p className="text-3xl leading-none" style={{ fontFamily: f.family }}>
                            {f.preview}
                          </p>
                          <p className="text-xs mt-1 font-semibold">{f.label}</p>
                        </button>
                      ))}
                    </div>
                  </Section>

                  {/* Mode picker */}
                  <Section title="Modo">
                    <div className="grid grid-cols-3 gap-2">
                      {MODE_INFOS.map((m) => (
                        <button
                          key={m.key}
                          onClick={() => setDraft((d) => ({ ...d, mode: m.key }))}
                          className={`rounded-md border py-2 text-sm font-semibold transition ${
                            draft.mode === m.key
                              ? "border-violet-600 bg-violet-50 dark:bg-violet-950/30 text-violet-900 dark:text-violet-100"
                              : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700"
                          }`}
                          data-testid={`mode-${m.key}`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </Section>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      onClick={onSave}
                      disabled={!dirty || !canSaveCustom || saving}
                      data-testid="save-theme"
                    >
                      {saving ? (
                        <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                      ) : (
                        <Save className="h-3.5 w-3.5 mr-1" />
                      )}
                      Guardar tema
                    </Button>
                    {dirty && (
                      <Button variant="ghost" onClick={onRevert} disabled={saving}>
                        <Undo2 className="h-3.5 w-3.5 mr-1" />
                        Descartar
                      </Button>
                    )}
                    {!canSaveCustom && (
                      <span className="text-xs text-rose-600 dark:text-rose-400">
                        Introduce un color válido en formato #RRGGBB.
                      </span>
                    )}
                  </div>
                </div>

                {/* Live preview */}
                <LivePreview
                  alias={selected.alias}
                  city={selected.city}
                  draft={draft}
                  publicUrl={selected.public_url}
                />
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest font-bold text-neutral-500 dark:text-neutral-400 mb-2">
        {title}
      </p>
      {children}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-md border border-dashed border-neutral-200 dark:border-neutral-800 p-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
      Aún no tienes perfiles activos.
    </div>
  );
}

function LivePreview({
  alias, city, draft, publicUrl,
}: {
  alias: string;
  city: string | null;
  draft: ProfileTheme;
  publicUrl: string | null;
}) {
  const theme = resolveTheme(draft);
  return (
    <div className="space-y-2">
      <p className="text-[10px] uppercase tracking-widest font-bold text-neutral-500 dark:text-neutral-400">
        Vista previa
      </p>
      <div
        className="rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-sm"
        style={{
          background: `linear-gradient(180deg, ${theme.bg} 0%, ${theme.bgSoft} 60%)`,
        }}
      >
        <div
          className="p-4 space-y-2"
          style={{ color: theme.text, fontFamily: theme.fontFamily }}
        >
          <div
            className="rounded-lg p-4 text-center"
            style={{
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              fontFamily: theme.fontFamily,
            }}
          >
            <div
              className="mx-auto rounded-full flex items-center justify-center font-bold"
              style={{
                width: 48, height: 48, marginBottom: 8,
                background: theme.surfaceMuted, color: theme.primary,
                fontFamily: theme.fontFamilyDisplay,
              }}
            >
              {(alias[0] || "?").toUpperCase()}
            </div>
            <p
              className="font-bold text-base leading-tight"
              style={{ color: theme.text, fontFamily: theme.fontFamilyDisplay }}
            >
              {alias}
            </p>
            {city && (
              <p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>
                {city}
              </p>
            )}
            <div
              className="mt-3 rounded-md py-2 px-3 text-xs font-bold inline-block"
              style={{
                background: theme.primary,
                color: theme.primaryContrast,
                fontFamily: theme.fontFamilyDisplay,
              }}
            >
              ✈️ Reservar por Telegram
            </div>
          </div>
        </div>
      </div>
      {publicUrl && (
        <a
          href={publicUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-violet-700 dark:text-violet-300 hover:underline"
        >
          <ExternalLink className="h-3 w-3" />
          Ver landing pública
        </a>
      )}
    </div>
  );
}
