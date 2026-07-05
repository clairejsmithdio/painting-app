// Simple in-memory store to carry an image from Visualise → Mix.
let mixFile: File | null = null;
let mixPreview: string | null = null;

export function setMixImage(file: File, preview: string) {
  clearMixImage();
  mixFile = file;
  mixPreview = preview;
}

export function getMixImage(): { file: File; preview: string } | null {
  if (!mixFile || !mixPreview) return null;
  return { file: mixFile, preview: mixPreview };
}

export function clearMixImage() {
  if (mixPreview && mixPreview.startsWith("blob:")) {
    URL.revokeObjectURL(mixPreview);
  }
  mixFile = null;
  mixPreview = null;
}
