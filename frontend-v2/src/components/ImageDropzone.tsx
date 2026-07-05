import { useRef, useState, useCallback } from "react";
import { UploadCloud, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  onFile: (file: File) => void;
  preview?: string | null;
  onClear?: () => void;
  label?: string;
  className?: string;
};

export function ImageDropzone({ onFile, preview, onClear, label = "Upload an image", className }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (file && file.type.startsWith("image/")) onFile(file);
    },
    [onFile],
  );

  if (preview) {
    return (
      <div className={cn("relative overflow-hidden rounded-2xl bg-card shadow-sm", className)}>
        <img src={preview} alt="Uploaded" className="h-full w-full object-cover" />
        {onClear && (
          <button
            onClick={onClear}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-navy/80 text-white backdrop-blur transition hover:bg-navy"
            aria-label="Remove image"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  return (
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
        handleFiles(e.dataTransfer.files);
      }}
      className={cn(
        "group flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-navy/15 bg-white/50 px-8 py-16 transition-all",
        "hover:border-coral hover:bg-white",
        dragging && "border-coral bg-white scale-[1.01]",
        className,
      )}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-coral/10 text-coral transition group-hover:bg-coral group-hover:text-white">
        <UploadCloud className="h-6 w-6" />
      </div>
      <p className="font-display text-2xl text-navy">{label}</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Drop a photo here, or <span className="text-coral font-medium">browse</span>
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </button>
  );
}
