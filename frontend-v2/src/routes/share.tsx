import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Upload, X } from "lucide-react";
import { getShareDraft, clearShareDraft } from "@/lib/share-store";
import { createArtwork } from "@/lib/artworks";
import { makeThumbnail } from "@/lib/palettes";
import { useAuth } from "@/lib/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/share")({
  component: SharePage,
  head: () => ({ meta: [{ title: "Share to Community — Palette" }] }),
});

function SharePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [draft] = useState(() => getShareDraft());
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [medium, setMedium] = useState("");
  const [mood, setMood] = useState("");
  const [paintedFile, setPaintedFile] = useState<File | null>(null);
  const [paintedPreview, setPaintedPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!draft) navigate({ to: "/" });
  }, [draft, navigate]);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const onPainted = (file: File) => {
    setPaintedFile(file);
    if (paintedPreview) URL.revokeObjectURL(paintedPreview);
    setPaintedPreview(URL.createObjectURL(file));
  };

  const submit = async () => {
    if (!draft) return;
    if (!title.trim()) { toast.error("Give your board a title."); return; }
    setSaving(true);
    try {
      const [origThumb, finalThumb, paintedThumb] = await Promise.all([
        draft.originalDataUrl ? makeThumbnail(draft.originalDataUrl, 900) : Promise.resolve(null),
        draft.finalDataUrl ? makeThumbnail(draft.finalDataUrl, 900) : Promise.resolve(null),
        paintedFile ? makeThumbnail(paintedFile, 900) : Promise.resolve(null),
      ]);
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 8);
      const row = await createArtwork({
        title: title.trim(),
        description: description.trim(),
        style: draft.style,
        medium: medium.trim() || null,
        mood: mood.trim() || null,
        tags,
        original_image_url: origThumb,
        final_image_url: finalThumb,
        painted_photo_url: paintedThumb,
        palette: draft.palette,
        is_public: true,
      });
      clearShareDraft();
      toast.success("Shared to Community!");
      navigate({ to: "/community/$id", params: { id: row.id } });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (!draft) return null;

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-20 border-b border-navy/5 bg-canvas/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 text-sm font-medium text-navy/70 hover:text-navy transition">
            <ArrowLeft className="h-4 w-4" /> Cancel
          </Link>
          <h1 className="font-display text-xl text-navy">Share to Community</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
          <div className="space-y-4">
            <PreviewTile label="Original" src={draft.originalDataUrl} />
            <PreviewTile label="AI reimagined" src={draft.finalDataUrl} />
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                Painted photo (optional)
              </div>
              {paintedPreview ? (
                <div className="relative overflow-hidden rounded-2xl">
                  <img src={paintedPreview} alt="Painted" className="w-full object-cover" />
                  <button
                    onClick={() => { setPaintedFile(null); if (paintedPreview) URL.revokeObjectURL(paintedPreview); setPaintedPreview(null); }}
                    className="absolute right-3 top-3 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-navy/20 bg-white p-8 text-sm text-muted-foreground hover:border-navy/40">
                  <Upload className="h-5 w-5" />
                  Upload a photo of your finished painting
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onPainted(e.target.files[0])} />
                </label>
              )}
            </div>
            {draft.palette.length > 0 && (
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Palette</div>
                <div className="flex h-8 overflow-hidden rounded-lg">
                  {draft.palette.map((c, i) => <div key={i} className="flex-1" style={{ backgroundColor: c.hex }} />)}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-5">
            <Field label="Title">
              <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120}
                className="w-full rounded-xl border border-navy/15 bg-white px-4 py-2.5 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-coral/40" />
            </Field>
            <Field label="Description">
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} maxLength={2000}
                className="w-full rounded-xl border border-navy/15 bg-white px-4 py-2.5 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-coral/40" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Medium">
                <input value={medium} onChange={(e) => setMedium(e.target.value)} placeholder="Oil, gouache…" maxLength={40}
                  className="w-full rounded-xl border border-navy/15 bg-white px-4 py-2.5 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-coral/40" />
              </Field>
              <Field label="Mood">
                <input value={mood} onChange={(e) => setMood(e.target.value)} placeholder="Calm, moody…" maxLength={40}
                  className="w-full rounded-xl border border-navy/15 bg-white px-4 py-2.5 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-coral/40" />
              </Field>
            </div>
            <Field label="Tags (comma separated)">
              <input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="portrait, warm, watercolour"
                className="w-full rounded-xl border border-navy/15 bg-white px-4 py-2.5 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-coral/40" />
            </Field>
            <button onClick={submit} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-navy px-5 py-2.5 text-sm font-medium text-white hover:bg-navy/90 disabled:opacity-50">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Share to Community
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">{label}</div>
      {children}
    </label>
  );
}

function PreviewTile({ label, src }: { label: string; src: string | null }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">{label}</div>
      <div className="overflow-hidden rounded-2xl bg-white">
        {src ? <img src={src} alt={label} className="w-full object-cover" /> : (
          <div className="flex h-40 items-center justify-center text-xs text-muted-foreground">Not available</div>
        )}
      </div>
    </div>
  );
}
