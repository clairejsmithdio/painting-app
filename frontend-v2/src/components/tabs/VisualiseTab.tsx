import { useNavigate } from "@tanstack/react-router";
import { ImageDropzone } from "@/components/ImageDropzone";
import { setUpload } from "@/lib/upload-store";

export function VisualiseTab() {
  const navigate = useNavigate();

  const handleFile = (file: File) => {
    setUpload(file);
    navigate({ to: "/visualise" });
  };

  return (
    <div className="space-y-10 animate-fade-up">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_1.2fr] items-start">
        <div>
          <h2 className="font-display text-4xl text-navy">Visualise</h2>
          <p className="mt-3 text-muted-foreground max-w-md">
            Upload a photo, then pick a painting style — from delicate watercolour to
            expressive charcoal — and see your image reimagined.
          </p>
        </div>
        <ImageDropzone
          className="aspect-[4/3]"
          onFile={handleFile}
          preview={null}
          onClear={() => {}}
          label="Drop a photo to visualise"
        />
      </div>
    </div>
  );
}
