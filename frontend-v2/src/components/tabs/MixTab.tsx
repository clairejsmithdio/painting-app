import { useNavigate } from "@tanstack/react-router";
import { ImageDropzone } from "@/components/ImageDropzone";
import { setMixImage } from "@/lib/mix-store";

export function MixTab() {
  const navigate = useNavigate();

  const handleFile = (file: File) => {
    const preview = URL.createObjectURL(file);
    setMixImage(file, preview);
    navigate({ to: "/mix" });
  };

  return (
    <div className="space-y-10 animate-fade-up">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_1.2fr] items-start">
        <div>
          <h2 className="font-display text-4xl text-navy">Mix</h2>
          <p className="mt-3 text-muted-foreground max-w-md">
            Upload a reference and we'll extract its dominant colours and hand you a precise
            pigment recipe. You can also reach Mix directly from a Visualise result.
          </p>
        </div>
        <ImageDropzone
          className="aspect-[4/3]"
          onFile={handleFile}
          preview={null}
          onClear={() => {}}
          label="Drop a reference to mix"
        />
      </div>
    </div>
  );
}
