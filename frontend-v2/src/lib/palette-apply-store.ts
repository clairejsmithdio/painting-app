// Carries a palette from Inspire/Community into a fresh Visualise run.
export type PaletteHint = {
  colors: string[]; // hex list
  source?: string;  // "palette:<id>" or "artwork:<id>"
  style?: string | null;
};

let pending: PaletteHint | null = null;

export function setPaletteHint(hint: PaletteHint | null) {
  pending = hint;
}

export function consumePaletteHint(): PaletteHint | null {
  const h = pending;
  pending = null;
  return h;
}

export function peekPaletteHint(): PaletteHint | null {
  return pending;
}
