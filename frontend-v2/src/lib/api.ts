// API base — configure via VITE_API_URL (e.g. http://localhost:3001).
// Defaults to same-origin so a dev proxy or reverse proxy can forward /api.
export const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";

const RETRIABLE_STATUS = new Set([502, 503, 504]);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// The free-tier backend spins down when idle and can restart mid-request, which
// surfaces as a dropped connection ("Failed to fetch") or a 502/503/504. Those
// mean the request never produced a result, so retrying is safe (and doesn't
// double-charge generation). Real errors (4xx, 500) are passed straight through.
async function fetchWithRetry(
  path: string,
  init: RequestInit,
  opts: { retries?: number; onWaking?: () => void } = {},
): Promise<Response> {
  const retries = opts.retries ?? 3;
  const backoff = [3000, 6000, 10000];
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(`${API_BASE}${path}`, init);
      if (RETRIABLE_STATUS.has(res.status) && attempt < retries) {
        opts.onWaking?.();
        await sleep(backoff[Math.min(attempt, backoff.length - 1)]);
        continue;
      }
      return res;
    } catch (err) {
      if (attempt < retries) {
        opts.onWaking?.();
        await sleep(backoff[Math.min(attempt, backoff.length - 1)]);
        continue;
      }
      throw err;
    }
  }
}

async function request<T>(
  path: string,
  init?: RequestInit,
  opts?: { onWaking?: () => void },
): Promise<T> {
  const res = await fetchWithRetry(path, init ?? {}, opts);
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

export type PaintRange = {
  id: string;
  label: string;
  kind: "mixing" | "matching";
  blurb?: string;
  available: boolean;
  colorCount: number;
};
export type PaintBrand = {
  id: string;
  name: string;
  ranges?: PaintRange[];
  colorCount?: number;
};

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
  onWaking?: () => void,
): Promise<{ styles: VisualizeStyle[] }> {
  const image = await toBase64(file);
  return request(
    "/api/painting/visualize",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image,
        style,
        styles: style ? [style] : undefined,
        palette: paletteHex && paletteHex.length ? paletteHex : undefined,
        styleParams: styleParams && Object.keys(styleParams).length ? styleParams : undefined,
      }),
    },
    { onWaking },
  );
}

export async function imaginePaint(
  payload: { prompt: string; style: string; styleParams: Record<string, string> },
  onWaking?: () => void,
): Promise<{ imageUrl: string }> {
  return request(
    "/api/imagine",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    },
    { onWaking },
  );
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
  range?: string;
}): Promise<PigmentRecipe> {
  return request("/api/painting/mix-colors", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      targetColor: payload.targetHex,
      brandId: payload.brand,
      rangeId: payload.range,
    }),
  });
}
