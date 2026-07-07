import { useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Camera, Wand2, UploadCloud, ArrowRight } from "lucide-react";
import { setUpload } from "@/lib/upload-store";
import { cn } from "@/lib/utils";

export function VisualiseTab() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setUpload(file);
    navigate({ to: "/visualise" });
  };

  return (
    <div className="animate-fade-up">
      <div className="mb-6 sm:mb-8">
        <h2 className="font-display text-3xl sm:text-4xl text-navy">Visualise</h2>
        <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-lg">
          Start from a photo you love, or describe a scene from your imagination.
        </p>
      </div>

      <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
        {/* From photo */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const f = e.dataTransfer.files?.[0];
            if (f) handleFile(f);
          }}
          className={cn(
            "group relative flex flex-col items-start gap-4 rounded-3xl border-2 border-dashed border-navy/15 bg-white/60 p-6 sm:p-8 text-left transition-all",
            "hover:border-coral hover:bg-white active:scale-[0.99]",
            "min-h-[220px] sm:min-h-[280px]",
            dragging && "border-coral bg-white scale-[1.01]",
          )}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-coral/10 text-coral transition group-hover:bg-coral group-hover:text-white">
            <Camera className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="font-display text-2xl text-navy">From a photo</div>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Upload or drop a picture and see it reimagined across painting styles.
            </p>
          </div>
          <div className="mt-auto flex items-center gap-2 text-sm font-medium text-coral">
            <UploadCloud className="h-4 w-4" />
            <span className="hidden sm:inline">Drop a photo, or browse</span>
            <span className="sm:hidden">Choose a photo</span>
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </button>

        {/* From description */}
        <button
          type="button"
          onClick={() => navigate({ to: "/imagine" })}
          className={cn(
            "group relative flex flex-col items-start gap-4 rounded-3xl border-2 border-dashed border-navy/15 bg-white/60 p-6 sm:p-8 text-left transition-all",
            "hover:border-coral hover:bg-white active:scale-[0.99]",
            "min-h-[220px] sm:min-h-[280px]",
          )}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-coral/10 text-coral transition group-hover:bg-coral group-hover:text-white">
            <Wand2 className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="font-display text-2xl text-navy">From a description</div>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Describe a scene and pick a medium — we'll paint it for you.
            </p>
          </div>
          <div className="mt-auto flex items-center gap-2 text-sm font-medium text-coral">
            <span>Describe a scene</span>
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </div>
        </button>
      </div>
    </div>
  );
}
