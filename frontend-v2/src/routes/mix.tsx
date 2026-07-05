import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Beaker, Loader2, BookmarkPlus, LogIn, LibraryBig, Lock, Globe } from "lucide-react";
import { getMixImage, clearMixImage } from "@/lib/mix-store";
import {
  extractColors,
  getPaintBrands,
  mixColors,
  type ExtractedColor,
  type PaintBrand,
  type PigmentRecipe,
} from "@/lib/api";
import { colorsFromExtracted, makeThumbnail, savePalette } from "@/lib/palettes";
import { useAuth } from "@/lib/use-auth";
import { toast } from "sonner";
import { ProgressStages } from "@/components/ProgressStages";

const EXTRACT_STAGES = [
  "Reading pixels",
  "Grouping similar tones",
  "Ranking dominant colours",
  "Building your palette",
];

const FALLBACK_BRANDS: PaintBrand[] = [
  { id: "winsor-newton", name: "Winsor & Newton" },
  { id: "gamblin", name: "Gamblin" },
  { id: "golden", name: "Golden" },
];

export const Route = createFileRoute("/mix")({
  component: MixPage,
  head: () => ({
    meta: [
      { title: "Mix — Palette" },
      { name: "description", content: "Extract colours and get precise pigment recipes." },
    ],
  }),
});

function MixPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [image] = useState(() => getMixImage());

  const [file] = useState<File | null>(image?.file ?? null);
  const [preview] = useState<string | null>(image?.preview ?? null);

  const [colors, setColors] = useState<ExtractedColor[] | null>(null);
  const [selectedHex, setSelectedHex] = useState<string | null>(null);
  const [brands, setBrands] = useState<PaintBrand[]>(FALLBACK_BRANDS);
  const [brand, setBrand] = useState<string>(FALLBACK_BRANDS[0].id);
  const [recipe, setRecipe] = useState<PigmentRecipe | null>(null);
  const [recipes, setRecipes] = useState<Record<string, { recipe: PigmentRecipe; brand: string }>>({});
  const [extracting, setExtracting] = useState(false);
  const [mixing, setMixing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showSave, setShowSave] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [savePublic, setSavePublic] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!image) navigate({ to: "/" });
  }, [image, navigate]);

  useEffect(() => {
    getPaintBrands()
      .then((r) => {
        if (r.brands?.length) {
          setBrands(r.brands);
          setBrand(r.brands[0].id);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    setExtracting(true);
    setError(null);
    setColors(null);
    setSelectedHex(null);
    setRecipe(null);
    extractColors(file)
      .then((r) => {
        if (cancelled) return;
        setColors(r.colors);
        if (r.colors?.[0]) setSelectedHex(r.colors[0].hex);
      })
      .catch((e) => !cancelled && setError(e.message ?? "Failed to extract colors"))
      .finally(() => !cancelled && setExtracting(false));
    return () => {
      cancelled = true;
    };
  }, [file]);

  useEffect(() => {
    if (!selectedHex || !brand) return;
    let cancelled = false;
    setMixing(true);
    setRecipe(null);
    mixColors({ targetHex: selectedHex, brand })
      .then((r) => {
        if (cancelled) return;
        setRecipe(r);
        setRecipes((prev) => ({ ...prev, [selectedHex]: { recipe: r, brand } }));
      })
      .catch((e) => !cancelled && setError(e.message ?? "Failed to mix"))
      .finally(() => !cancelled && setMixing(false));
    return () => {
      cancelled = true;
    };
  }, [selectedHex, brand]);

  const back = () => {
    clearMixImage();
    navigate({ to: "/" });
  };


  const openSave = () => {
    if (!user) {
      toast.info("Sign in to save palettes to your library.");
      navigate({ to: "/auth" });
      return;
    }
    if (!colors || colors.length === 0) {
      toast.error("Nothing to save yet.");
      return;
    }
    setSaveName(`Palette ${new Date().toLocaleDateString()}`);
    setShowSave(true);
  };

  const doSave = async () => {
    if (!saveName.trim()) {
      toast.error("Give the palette a name.");
      return;
    }
    setSaving(true);
    try {
      const thumb = preview ? await makeThumbnail(preview) : null;
      await savePalette({
        name: saveName.trim(),
        isPublic: savePublic,
        imageDataUrl: thumb,
        colors: colorsFromExtracted(colors ?? [], recipes),
      });
      toast.success(savePublic ? "Saved to the public library." : "Saved to your library.");
      setShowSave(false);
      navigate({ to: "/library" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (!image) return null;

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-20 border-b border-navy/5 bg-canvas/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <button
            onClick={back}
            className="flex items-center gap-2 text-sm font-medium text-navy/70 hover:text-navy transition"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <h1 className="font-display text-xl text-navy">Mix</h1>
          <div className="flex items-center gap-3">
            <Link to="/library" className="inline-flex items-center gap-1.5 text-sm text-navy/70 hover:text-navy">
              <LibraryBig className="h-4 w-4" /> Library
            </Link>
            <button
              onClick={openSave}
              className="inline-flex items-center gap-1.5 rounded-xl bg-navy px-3 py-1.5 text-sm font-medium text-white hover:bg-navy/90 transition"
            >
              <BookmarkPlus className="h-4 w-4" /> Save
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 space-y-10">
        <div>
          <h2 className="font-display text-4xl text-navy">Mix</h2>
          <p className="mt-3 text-muted-foreground max-w-2xl">
            Extract dominant colours from your reference and get an exact pigment recipe with
            proportions and mixing notes. Save the finished palette to your library.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Swatches (left) + Image (right) */}
        <section className="grid gap-6 lg:grid-cols-[132px_minmax(0,1fr)] items-start">
          <div className="order-2 lg:order-1">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Palette
            </div>
            {extracting ? (
              <div className="flex flex-row lg:flex-col gap-2.5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-16 w-16 lg:h-20 lg:w-full rounded-2xl shimmer" />
                ))}
              </div>
            ) : colors && colors.length > 0 ? (
              <div className="flex flex-row lg:flex-col gap-2.5 flex-wrap lg:flex-nowrap">
                {colors.map((c) => {
                  const active = selectedHex === c.hex;
                  return (
                    <button
                      key={c.hex}
                      onClick={() => setSelectedHex(c.hex)}
                      className={`group relative flex-none overflow-hidden rounded-2xl shadow-sm ring-1 transition
                        ${active
                          ? "ring-2 ring-navy scale-[1.03] shadow-md"
                          : "ring-navy/10 hover:ring-navy/40 hover:-translate-y-0.5"}
                        h-16 w-16 lg:h-20 lg:w-full`}
                      style={{ backgroundColor: c.hex }}
                      aria-label={`Select ${c.hex}`}
                    >
                      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/55 to-transparent px-2 py-1.5 text-[10px] font-medium text-white">
                        <span className="tracking-wide">{c.hex.toUpperCase()}</span>
                        {c.percentage != null && (
                          <span className="opacity-80">{Math.round(c.percentage)}%</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="h-20 w-full rounded-2xl bg-canvas" />
            )}
          </div>

          <div className="order-1 lg:order-2 relative overflow-hidden rounded-3xl bg-card shadow-sm aspect-[4/3]">
            {preview && (
              <img src={preview} alt="Reference" className="h-full w-full object-cover" />
            )}
            {extracting && (
              <div className="absolute inset-0 flex items-center justify-center bg-canvas/60 backdrop-blur-sm p-8">
                <ProgressStages
                  active
                  stages={EXTRACT_STAGES}
                  title="Extracting colours…"
                  stageDuration={1100}
                />
              </div>
            )}
          </div>
        </section>


        {selectedHex && (
          <section className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
            <div className="card-elevated p-6">
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Paint brand
              </label>
              <div className="mt-3 space-y-2">
                {brands.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setBrand(b.id)}
                    className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                      brand === b.id
                        ? "border-coral bg-coral/5 text-navy"
                        : "border-transparent bg-canvas hover:border-navy/15"
                    }`}
                  >
                    <span className="font-medium">{b.name}</span>
                  </button>
                ))}
              </div>
              <div className="mt-6 flex items-center gap-3 rounded-xl bg-canvas p-4">
                <div className="h-14 w-14 rounded-lg shadow-inner" style={{ backgroundColor: selectedHex }} />
                <div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">Target</div>
                  <div className="font-display text-xl text-navy">{selectedHex.toUpperCase()}</div>
                </div>
              </div>
            </div>

            <div className="card-elevated p-6 min-h-[280px]">
              <div className="mb-4 flex items-center gap-2 text-navy">
                <Beaker className="h-5 w-5 text-teal" />
                <h3 className="font-display text-2xl">Pigment recipe</h3>
              </div>

              {mixing && (
                <ProgressStages
                  active
                  stages={[
                    "Matching target hue",
                    "Selecting pigments",
                    "Calculating proportions",
                    "Writing mixing notes",
                  ]}
                  title="Mixing recipe…"
                  stageDuration={900}
                />
              )}

              {recipe && !mixing && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    {recipe.pigments.map((p) => (
                      <div key={p.name} className="flex items-center gap-3">
                        <div
                          className="h-8 w-8 flex-none rounded-md ring-1 ring-navy/10"
                          style={{ backgroundColor: p.hex }}
                        />
                        <div className="flex-1">
                          <div className="flex items-baseline justify-between">
                            <span className="text-sm font-medium text-navy">{p.name}</span>
                            <span className="text-sm font-semibold text-coral">{p.percentage}%</span>
                          </div>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-canvas">
                            <div className="h-full rounded-full bg-navy transition-all" style={{ width: `${p.percentage}%` }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl bg-canvas p-4 text-sm text-navy/80 leading-relaxed">
                    {recipe.instructions}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {showSave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4" onClick={() => !saving && setShowSave(false)}>
          <div className="w-full max-w-md card-elevated p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-2xl text-navy">Save palette</h3>
            {!user ? (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">Sign in to save palettes to your library.</p>
                <Link to="/auth" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-navy px-4 py-2 text-sm text-white">
                  <LogIn className="h-4 w-4" /> Sign in
                </Link>
              </div>
            ) : (
              <>
                <label className="mt-4 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">Name</label>
                <input
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  maxLength={80}
                  className="mt-1 w-full rounded-xl border border-navy/15 bg-white px-4 py-2.5 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-coral/40"
                />

                <div className="mt-5">
                  <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Visibility</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSavePublic(false)}
                      className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                        !savePublic ? "border-coral bg-coral/5 text-navy" : "border-navy/10 hover:border-navy/20"
                      }`}
                    >
                      <div className="font-semibold flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> Personal</div>
                      <div className="text-xs text-muted-foreground mt-1">Only you can see it</div>
                    </button>
                    <button
                      onClick={() => setSavePublic(true)}
                      className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                        savePublic ? "border-coral bg-coral/5 text-navy" : "border-navy/10 hover:border-navy/20"
                      }`}
                    >
                      <div className="font-semibold flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" /> Public</div>
                      <div className="text-xs text-muted-foreground mt-1">Anyone can browse</div>
                    </button>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-2">
                  <button
                    onClick={() => setShowSave(false)}
                    disabled={saving}
                    className="rounded-xl px-4 py-2 text-sm text-navy hover:bg-navy/5"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={doSave}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy/90 disabled:opacity-50"
                  >
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    Save palette
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

