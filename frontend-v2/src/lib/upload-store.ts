// Simple in-memory store for a pending upload passed between routes.
let currentFile: File | null = null;
let currentPreview: string | null = null;

export function setUpload(file: File) {
  if (currentPreview) URL.revokeObjectURL(currentPreview);
  currentFile = file;
  currentPreview = URL.createObjectURL(file);
}

export function getUpload(): { file: File; preview: string } | null {
  if (!currentFile || !currentPreview) return null;
  return { file: currentFile, preview: currentPreview };
}

export function clearUpload() {
  if (currentPreview) URL.revokeObjectURL(currentPreview);
  currentFile = null;
  currentPreview = null;
}
