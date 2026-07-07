// API base — configure via VITE_API_URL (e.g. http://localhost:3001).
// Defaults to same-origin so a dev proxy or reverse proxy can forward /api.
export const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, init);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

export type VisualizeStyle = {
  id: string;
  label: string;
  imageUrl: string;
  error?: string;
};

export type ExtractedColor = {
  hex: string;
  rgb?: [number, number, number];
  percentage?: number;
  name?: string;
};

export type PaintBrand = { id: string; name: string };

export type PigmentRecipe = {
  targetHex: string;
  brand: string;
  pigments: { name: string; hex: string; percentage: number }[];
  instructions: string;
};

async function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function visualizePainting(
  file: File,
  style?: string,
  paletteHex?: string[],
  styleParams?: Record<string, string>,
): Promise<{ styles: VisualizeStyle[] }> {
  const image = await toBase64(file);
  return request("/api/painting/visualize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image,
      style,
      styles: style ? [style] : undefined,
      palette: paletteHex && paletteHex.length ? paletteHex : undefined,
      styleParams: styleParams && Object.keys(styleParams).length ? styleParams : undefined,
    }),
  });
}

export async function extractColors(file: File): Promise<{ colors: ExtractedColor[] }> {
  const imageDataUri = await toBase64(file);
  const imageBase64 = imageDataUri.split(',')[1] || imageDataUri;
  return request("/api/painting/extract-colors", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64 }),
  });
}

export async function getPaintBrands(): Promise<{ brands: PaintBrand[] }> {
  return request("/api/painting/paint-brands");
}

export async function mixColors(payload: {
  targetHex: string;
  brand: string;
}): Promise<PigmentRecipe> {
  return request("/api/painting/mix-colors", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
