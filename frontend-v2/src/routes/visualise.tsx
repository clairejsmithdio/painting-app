import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Download, Loader2, Printer, Beaker, Share2 } from "lucide-react";
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
    () => (selected !== "Original" ? getStyleVariations(selected) : undefined),
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

  const pickStyle = (id: StyleId) => {
    if (id === "Original") return;
    setSelected(id);
    setError(null);
    setStyleParams({});
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
    if (!activeImage || selected === "Original" || !upload) return;
    try {
      // For generated images from Together AI, fetch and create a File
      const res = await fetch(activeImage);
      if (!res.ok) throw new Error('Failed to fetch image');
      const blob = await res.blob();
      const ext = blob.type === "image/png" ? "png" : "jpg";
      const file = new File([blob], `palette-${selected.toLowerCase()}.${ext}`, { type: blob.type });
      setMixImage(file, activeImage);
    } catch (err) {
      // Fallback to original upload if fetch fails
      console.error('Failed to fetch generated image for mix:', err);
      setMixImage(upload.file, activeImage);
    }
    navigate({ to: "/mix" });
  };

  if (!upload) return null;

  const allParamsSelected = useMemo(() => {
    if (!styleConfig) return false;
    return styleConfig.variations.every((v) => styleParams[v.id]);
  }, [styleConfig, styleParams]);

  const backToStyles = () => {
    setSelected("Original");
    setStyleParams({});
  };

  const generateImage = async () => {
    if (selected === "Original" || !styleConfig || !allParamsSelected || !upload) return;
    setLoading(true);
    try {
      const res = await visualizePainting(upload.file, selected, hint?.colors, styleParams);
      const match =
        res.styles.find((s) => s.label?.toLowerCase() === selected.toLowerCase()) ?? res.styles[0];
      if (match) setResults((prev) => ({ ...prev, [selected]: match }));
    } catch (err) {
      setError((err as Error).message ?? "Failed to generate style");
    } finally {
      setLoading(false);
    }
  };

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
          {/* Left: style swatches or parameter selection */}
          <aside className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
            {selected === "Original" ? (
              <>
                <h2 className="font-display text-2xl text-navy mb-1">Choose a style</h2>
                <p className="text-sm text-muted-foreground mb-5">
                  Tap a swatch to select your medium.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {STYLE_SWATCHES.map((s) => {
                    const active = selected === s.id;
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
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={backToStyles}
                  className="flex items-center gap-2 text-sm font-medium text-navy/70 hover:text-navy transition mb-6"
                >
                  <ArrowLeft className="h-4 w-4" /> Back to styles
                </button>
                <h2 className="font-display text-2xl text-navy mb-1">Refine {selected}</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Choose your options, then generate.
                </p>

                {/* Style Parameters as Swatches */}
                {styleConfig && (
                  <div className="space-y-8">
                    {styleConfig.variations.map((variation) => {
                      const isSelected = !!styleParams[variation.id];
                      return (
                      <div key={variation.id} className="space-y-3">
                        <h3 className="font-display text-sm text-navy font-semibold flex items-center gap-2">
                          {variation.name}
                          {isSelected ? (
                            <span className="text-xs font-normal text-coral">✓</span>
                          ) : (
                            <span className="text-xs font-normal text-navy/40">required</span>
                          )}
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                          {variation.options.map((option) => {
                            const isSelected = styleParams[variation.id] === option.id;
                            return (
                              <button
                                key={option.id}
                                onClick={() => {
                                  setStyleParams((prev) => ({
                                    ...prev,
                                    [variation.id]: option.id,
                                  }));
                                }}
                                disabled={loading}
                                title={option.description}
                                className={cn(
                                  "group relative overflow-hidden rounded-lg border text-left transition p-3 disabled:cursor-not-allowed",
                                  isSelected
                                    ? "border-navy shadow-md ring-2 ring-navy/20 bg-navy/5"
                                    : "border-navy/10 hover:border-navy/30 hover:-translate-y-0.5 bg-white"
                                )}
                              >
                                <div className="font-medium text-xs text-navy">
                                  {option.label}
                                </div>
                                <div className="text-[10px] text-navy/60 mt-1">
                                  {option.description}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                    }))}

                    {/* Generate Button */}
                    <button
                      onClick={generateImage}
                      disabled={!allParamsSelected || loading}
                      className={cn(
                        "w-full py-3 rounded-lg font-medium transition mt-6",
                        allParamsSelected && !loading
                          ? "bg-coral text-white hover:bg-coral/90 shadow-sm"
                          : "bg-navy/10 text-navy/40 cursor-not-allowed"
                      )}
                    >
                      {loading ? "Generating…" : "Generate Image"}
                    </button>
                  </div>
                )}
              </>
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
                ) : loading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-canvas/60 backdrop-blur-sm p-8">
                    <ProgressStages
                      active={true}
                      stages={VISUALISE_STAGES}
                      title={`Painting in ${selected}…`}
                    />
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-canvas/60 backdrop-blur-sm p-8 text-center">
                    <div className="text-navy/40">
                      <p className="text-sm">Select your options above,</p>
                      <p className="text-sm">then click Generate Image</p>
                    </div>
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
