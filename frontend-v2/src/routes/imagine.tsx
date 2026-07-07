import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Download, Sparkles, Wand2, Beaker, Share2, Printer } from "lucide-react";
import { STYLE_SWATCHES, type StyleId } from "@/lib/styles";
import { setMixImage } from "@/lib/mix-store";
import { setShareDraft } from "@/lib/share-store";
import { cn } from "@/lib/utils";
import { ProgressStages } from "@/components/ProgressStages";
import { ZoomableImage } from "@/components/ZoomableImage";

const IMAGINE_STAGES = [
  "Reading your description",
  "Sketching the composition",
  "Mixing pigments on the palette",
  "Painting your canvas",
  "Adding finishing touches",
];

const SUGGESTIONS = [
  "A beautiful meadow at sunset, with buildings in the distance on a hill and picnickers in the background.",
  "A quiet harbour at dawn, wooden boats bobbing on soft mist, gulls circling overhead.",
  "A rainy Parisian street at night, glowing café windows reflecting on wet cobblestones.",
  "A cottage garden in full summer bloom, foxgloves and roses spilling over a stone wall.",
];

export const Route = createFileRoute("/imagine")({
  component: ImaginePage,
  head: () => ({
    meta: [
      { title: "Imagine — Palette" },
      {
        name: "description",
        content: "Describe a scene, pick a medium, and Palette will paint it for you.",
      },
    ],
  }),
});

function ImaginePage() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<StyleId>("Watercolor");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const paintableStyles = useMemo(
    () => STYLE_SWATCHES.filter((s) => s.id !== "Original"),
    [],
  );

  const suggestion = useMemo(
    () => SUGGESTIONS[Math.floor(Math.random() * SUGGESTIONS.length)],
    [],
  );

  const canGenerate = prompt.trim().length >= 6 && !loading;

  const generate = async () => {
    setError(null);
    setImageUrl(null);
    if (!prompt.trim() || !style) {
      setError("Please enter a description and select a style");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/imagine", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt, style }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed with status ${res.status}`);
      }
      const data = (await res.json()) as { imageUrl: string };
      if (!data.imageUrl) {
        throw new Error("No image URL in response");
      }
      setImageUrl(data.imageUrl);
    } catch (err) {
      console.error("Generate error:", err);
      setError((err as Error).message || "Failed to generate image");
    } finally {
      setLoading(false);
    }
  };

  const download = async () => {
    if (!imageUrl) return;
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `palette-imagine-${style.toLowerCase()}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      window.open(imageUrl, "_blank");
    }
  };

  const goToMix = async () => {
    if (!imageUrl) return;
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const ext = blob.type === "image/png" ? "png" : "jpg";
      const file = new File([blob], `palette-imagine.${ext}`, { type: blob.type });
      setMixImage(file, imageUrl);
      navigate({ to: "/mix" });
    } catch {
      setError("Couldn't hand off to Mix.");
    }
  };

  const shareToCommunity = async () => {
    if (!imageUrl) return;
    setShareDraft({
      originalDataUrl: null,
      finalDataUrl: imageUrl,
      style,
      palette: [],
    });
    navigate({ to: "/share" });
  };

  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-20 border-b border-navy/5 bg-canvas/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 sm:px-6 py-4">
          <button
            onClick={() => navigate({ to: "/" })}
            className="flex items-center gap-2 text-sm font-medium text-navy/70 hover:text-navy transition"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <h1 className="font-display text-xl text-navy">Imagine</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Description */}
        <section className="rounded-3xl bg-white p-4 sm:p-6 shadow-sm">
          <label className="flex items-center gap-2 text-sm font-medium text-navy mb-3">
            <Wand2 className="h-4 w-4 text-coral" />
            Describe your scene
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={suggestion}
            rows={5}
            className="w-full resize-none rounded-2xl border border-navy/10 bg-canvas/40 p-4 text-base text-navy placeholder:text-navy/30 focus:outline-none focus:ring-2 focus:ring-coral/40"
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setPrompt(suggestion)}
              className="inline-flex items-center gap-1.5 rounded-full border border-navy/10 bg-canvas/50 px-3 py-1.5 text-xs font-medium text-navy/70 hover:bg-white hover:text-navy transition"
            >
              <Sparkles className="h-3 w-3 text-coral" />
              Try an example
            </button>
            <span className="text-xs text-muted-foreground">
              Tip: mention setting, mood, time of day, and any details.
            </span>
          </div>
        </section>

        {/* Style */}
        <section className="rounded-3xl bg-white p-4 sm:p-6 shadow-sm">
          <div className="mb-3">
            <div className="text-sm font-medium text-navy">Pick a medium</div>
            <div className="text-xs text-muted-foreground">
              Choose the painting style you'd like.
            </div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
            {paintableStyles.map((s) => {
              const active = style === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStyle(s.id)}
                  className={cn(
                    "group relative overflow-hidden rounded-xl border text-left transition",
                    active
                      ? "border-navy shadow-md ring-2 ring-navy/20"
                      : "border-navy/10 hover:border-navy/30 active:scale-[0.98]",
                  )}
                >
                  <div className="aspect-square w-full" style={{ background: s.background }} />
                  <div className="px-2 py-1.5 bg-white">
                    <div className="font-display text-xs sm:text-sm text-navy leading-tight truncate">
                      {s.label}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Generate */}
        <div className="sticky bottom-4 z-10">
          <button
            onClick={generate}
            disabled={!canGenerate}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 text-base font-medium shadow-lg transition",
              canGenerate
                ? "bg-coral text-white hover:bg-coral/90"
                : "bg-navy/10 text-navy/40 cursor-not-allowed",
            )}
          >
            <Wand2 className="h-5 w-5" />
            {loading ? "Painting…" : `Paint in ${style}`}
          </button>
        </div>

        {/* Result / loading */}
        {(loading || imageUrl || error) && (
          <section className="card-elevated overflow-hidden">
            <div className="relative aspect-square sm:aspect-[4/3] bg-muted">
              {imageUrl && !loading ? (
                <ZoomableImage
                  key={imageUrl}
                  src={imageUrl}
                  alt={prompt}
                  className="animate-fade-up"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-canvas/60 backdrop-blur-sm p-6">
                  <ProgressStages
                    active={loading}
                    stages={IMAGINE_STAGES}
                    title={`Painting in ${style}…`}
                  />
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-4">
              <div className="min-w-0">
                <div className="font-display text-xl sm:text-2xl text-navy">{style}</div>
                {error && <div className="text-xs text-destructive mt-1">{error}</div>}
              </div>
              {imageUrl && !loading && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={download}
                    className="flex items-center gap-2 rounded-full bg-navy px-4 py-2 text-sm font-medium text-white transition hover:bg-navy/90"
                  >
                    <Download className="h-4 w-4" /> Download
                  </button>
                  <button
                    onClick={handlePrint}
                    className="hidden sm:flex items-center gap-2 rounded-full border border-navy/20 bg-white px-4 py-2 text-sm font-medium text-navy transition hover:bg-navy/5"
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
          </section>
        )}
      </main>
    </div>
  );
}
