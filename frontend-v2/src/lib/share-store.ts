// Carries visualise data into /share.
import type { PaletteColor } from "@/lib/palettes";

export type ShareDraft = {
  originalDataUrl: string | null;
  finalDataUrl: string | null;
  style: string | null;
  palette: PaletteColor[];
};

let draft: ShareDraft | null = null;

export function setShareDraft(d: ShareDraft) {
  draft = d;
}
export function getShareDraft(): ShareDraft | null {
  return draft;
}
export function clearShareDraft() {
  draft = null;
}
