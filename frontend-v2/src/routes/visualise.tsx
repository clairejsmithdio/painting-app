import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Download, Loader2, Printer, Beaker, Share2, ChevronDown } from "lucide-react";
import { getUpload, clearUpload } from "@/lib/upload-store";
import { setMixImage } from "@/lib/mix-store";
import { consumePaletteHint, type PaletteHint } from "@/lib/palette-apply-store";
import { setShareDraft } from "@/lib/share-store";
import { extractColors } from "@/lib/api";
import { STYLE_SWATCHES, type StyleId } from "@/lib/styles";
import { visualizePainting, type VisualizeStyle } from "@/lib/api";
import { getStyleVariations, type StyleConfig } from "@/lib/style-variations";
import { cn } from "@/lib/utils";
import { ProgressStages } from "@/components/ProgressStages";
import { ZoomableImage } from "@/components/ZoomableImage";


const VISUALISE_STAGES = [
  "Analysing composition",
  "Studying brushwork",
  "Mixing pigments on the palette",
  "Painting your canvas",
  "Adding finishing touches",
];

export const Route = createFileRoute("/visualise")({
  component: VisualisePage,
  head: () => ({
    meta: [
      { title: "Visualise — Palette" },
      { name: "description", content: "See your photo reimagined across painting styles." },
    ],
  }),
});

function VisualisePage() {
  const navigate = useNavigate();
  const [upload] = useState(() => getUpload());
  const [hint] = useState<PaletteHint | null>(() => consumePaletteHint());
  const [selected, setSelected] = useState<StyleId>("Original");
  const [results, setResults] = useState<Record<string, VisualizeStyle>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [styleParams, setStyleParams] = useState<Record<string, string>>({});

  const styleConfig = useMemo(
    () => {
      if (selected === "Original") {
        console.log('[visualise] styleConfig: Original selected, returning undefined');
        return undefined;
      }
      const config = getStyleVariations(selected);
      console.log('[visualise] styleConfig for selected="' + selected + '":', config);
      return config;
    },
    [selected]
  );

  useEffect(() => {
    if (!upload) navigate({ to: "/" });
  }, [upload, navigate]);

  const activeImage = useMemo(() => {
    if (!upload) return null;
    if (selected === "Original") return upload.preview;
    return results[selected]?.imageUrl ?? null;
  }, [selected, results, upload]);

  const pickStyle = async (id: StyleId) => {
    setSelected(id);
    setError(null);
    // Clear parameters when switching styles
    setStyleParams({});
    if (id === "Original" || results[id] || !upload) return;
    setLoading(true);
    try {
      const res = await visualizePainting(upload.file, id, hint?.colors, styleParams);
      const match =
        res.styles.find((s) => s.label?.toLowerCase() === id.toLowerCase()) ?? res.styles[0];
      if (match) setResults((prev) => ({ ...prev, [id]: match }));
    } catch (err) {
      setError((err as Error).message ?? "Failed to generate style");
    } finally {
      setLoading(false);
    }
  };

  const handleVariationChange = async (variationId: string, optionId: string) => {
    const newParams = { ...styleParams, [variationId]: optionId };
    setStyleParams(newParams);
    
    // Regenerate the image with new parameters
    if (selected !== "Original" && upload) {
      setLoading(true);
      setError(null);
      try {
        const res = await visualizePainting(upload.file, selected, hint?.colors, newParams);
        const match =
          res.styles.find((s) => s.label?.toLowerCase() === selected.toLowerCase()) ?? res.styles[0];
        if (match) setResults((prev) => ({ ...prev, [selected]: match }));
      } catch (err) {
        setError((err as Error).message ?? "Failed to generate style");
      } finally {
        setLoading(false);
      }
    }
  };

  const shareToCommunity = async () => {
    if (!upload) return;
    let finalDataUrl: string | null = null;
    if (activeImage && selected !== "Original") {
      try {
        const res = await fetch(activeImage);
        const blob = await res.blob();
        finalDataUrl = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result as string);
          r.onerror = reject;
          r.readAsDataURL(blob);
        });
      } catch { /* ignore */ }
    }
    const originalDataUrl = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(upload.file);
    });
    // Try to extract colours for the palette snapshot; non-fatal.
    let palette: { hex: string; percentage?: number | null }[] = [];
    try {
      const source = finalDataUrl
        ? await (await fetch(finalDataUrl)).blob().then((b) => new File([b], "final.jpg", { type: b.type }))
        : upload.file;
      const ex = await extractColors(source);
      palette = ex.colors.map((c) => ({ hex: c.hex, percentage: c.percentage ?? null }));
    } catch { /* ignore */ }
    setShareDraft({
      originalDataUrl,
      finalDataUrl,
      style: selected === "Original" ? null : selected,
      palette,
    });
    navigate({ to: "/share" });
  };


  const back = () => {
    clearUpload();
    navigate({ to: "/" });
  };

  const download = async (url: string, name: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `palette-${name.toLowerCase()}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      window.open(url, "_blank");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const goToMix = async () => {
    if (!activeImage) return;
    try {
      const res = await fetch(activeImage);
      const blob = await res.blob();
      const ext = blob.type === "image/png" ? "png" : "jpg";
      const file = new File([blob], `palette-mix.${ext}`, { type: blob.type });
      setMixImage(file, activeImage);
    } catch {
      // Fallback to original upload if fetching the styled image fails
      if (upload) {
        setMixImage(upload.file, upload.preview);
      }
    }
    navigate({ to: "/mix" });
  };

  if (!upload) return null;

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-20 border-b border-navy/5 bg-canvas/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <button
            onClick={back}
            className="flex items-center gap-2 text-sm font-medium text-navy/70 hover:text-navy transition"
          >
            <ArrowLeft className="h-4 w-4" /> New photo
          </button>
          <h1 className="font-display text-xl text-navy">Visualise</h1>
          <div className="w-24" />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)] items-start">
          {/* Left: style swatches */}
          <aside className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
            <h2 className="font-display text-2xl text-navy mb-1">Choose a style</h2>
            <p className="text-sm text-muted-foreground mb-5">
              Tap a swatch to see your photo in that medium.
            </p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {STYLE_SWATCHES.map((s) => {
                const active = selected === s.id;
                const isLoading = loading && selected === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => pickStyle(s.id)}
                    disabled={loading}
                    className={cn(
                      "group relative overflow-hidden rounded-xl border text-left transition disabled:cursor-not-allowed",
                      active
                        ? "border-navy shadow-md ring-2 ring-navy/20"
                        : "border-navy/10 hover:border-navy/30 hover:-translate-y-0.5",
                    )}
                  >
                    <div
                      className="aspect-square w-full"
                      style={
                        s.id === "Original"
                          ? {
                              backgroundImage: `url(${upload.preview})`,
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                            }
                          : { background: s.background }
                      }
                    />
                    <div className="px-3 py-2 bg-white">
                      <div className="font-display text-sm text-navy leading-tight">
                        {s.label}
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate">
                        {s.hint}
                      </div>
                    </div>
                    {isLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-navy/40">
                        <Loader2 className="h-5 w-5 animate-spin text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Style Parameters */}
            {selected !== "Original" && (
              <div className="space-y-4 border-t border-navy/10 pt-6">
                <h3 className="font-display text-sm text-navy font-semibold">Style Options{!styleConfig && ' (no config found)'}</h3>
                {!styleConfig && <p className="text-xs text-destructive">DEBUG: styleConfig is undefined for "{selected}"</p>}
                {styleConfig && styleConfig.variations.map((variation) => (
                  <div key={variation.id} className="space-y-2">
                    <label className="block text-xs font-medium text-navy/70">
                      {variation.name}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {variation.options.map((option) => {
                        const isSelected = styleParams[variation.id] === option.id;
                        return (
                          <button
                            key={option.id}
                            onClick={() => handleVariationChange(variation.id, option.id)}
                            disabled={loading}
                            title={option.description}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-xs font-medium transition disabled:opacity-50 disabled:cursor-not-allowed",
                              isSelected
                                ? "bg-navy text-white shadow-sm"
                                : "bg-navy/5 text-navy hover:bg-navy/10 border border-navy/20"
                            )}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </aside>

          {/* Right: canvas */}
          <section>
            <div className="card-elevated overflow-hidden">
              <div className="relative aspect-[4/3] bg-muted">
                {activeImage && !loading ? (
                  <ZoomableImage
                    key={activeImage}
                    src={activeImage}
                    alt={selected}
                    className="animate-fade-up"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-canvas/60 backdrop-blur-sm p-8">
                    <ProgressStages
                      active={loading || !activeImage}
                      stages={VISUALISE_STAGES}
                      title={`Painting in ${selected}…`}
                    />
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between px-6 py-4">
                <div>
                  <div className="font-display text-2xl text-navy">{selected}</div>
                  {error && <div className="text-xs text-destructive mt-1">{error}</div>}
                </div>
              {activeImage && selected !== "Original" && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => download(activeImage, selected)}
                    className="flex items-center gap-2 rounded-full bg-navy px-4 py-2 text-sm font-medium text-white transition hover:bg-navy/90"
                  >
                    <Download className="h-4 w-4" /> Download
                  </button>
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 rounded-full border border-navy/20 bg-white px-4 py-2 text-sm font-medium text-navy transition hover:bg-navy/5"
                  >
                    <Printer className="h-4 w-4" /> Print
                  </button>
                  <button
                    onClick={goToMix}
                    className="flex items-center gap-2 rounded-full bg-coral px-4 py-2 text-sm font-medium text-white transition hover:bg-coral/90"
                  >
                    <Beaker className="h-4 w-4" /> Mix
                  </button>
                  <button
                    onClick={shareToCommunity}
                    className="flex items-center gap-2 rounded-full border border-navy/20 bg-white px-4 py-2 text-sm font-medium text-navy transition hover:bg-navy/5"
                  >
                    <Share2 className="h-4 w-4" /> Share
                  </button>
                </div>
              )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
