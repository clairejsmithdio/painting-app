import sharp from 'sharp';
import paintsData from '../data/paints.json';

// Shape of paints.json. Cast the import so an empty `colors: []` (the stubbed
// "full" range) doesn't get inferred as never[].
interface PaintColor { name: string; hex: string; pigment?: string }
interface PaintRange {
  id: string;
  label: string;
  kind: 'mixing' | 'matching';
  blurb?: string;
  available?: boolean;
  colors: PaintColor[];
}
interface PaintBrandData { id: string; label: string; ranges: PaintRange[] }
const paints = paintsData as unknown as { brands: PaintBrandData[] };

function rangeIsAvailable(r: PaintRange): boolean {
  return r.available !== false && r.colors.length > 0;
}

export interface ExtractedColor {
  hex: string;
  rgb: { r: number; g: number; b: number };
  percentage?: number;
}

export interface PigmentRecipe {
  pigments: Array<{
    name: string;
    hex: string;
    percentage: number;
  }>;
  resultColor: string;
  mixing_notes: string;
}

// Simple hex to RGB conversion
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

// RGB to hex conversion
function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
      .toUpperCase()
  );
}

type RGB = { r: number; g: number; b: number };
type Lab = { L: number; a: number; b: number };
interface Pigment {
  name: string;
  hex: string;
  rgb: RGB;
}
interface Candidate {
  pigments: Pigment[];
  weights: number[]; // parallel to pigments, sum to 1
  error: number;     // perceptual ΔE between the mixed colour and the target
  mixedRgb: RGB;     // the colour this mix actually produces
}

// --- Perceptual colour space: sRGB -> CIELAB, difference as ΔE (CIE76) ---
// Straight-line RGB distance doesn't match how the eye sees colour. Comparing
// in CIELAB (where equal distances look roughly equally different) is what lets
// the matcher tell a dark maroon from a burnt orange.
function srgbToLinear(v: number): number {
  const u = v / 255;
  return u <= 0.04045 ? u / 12.92 : Math.pow((u + 0.055) / 1.055, 2.4);
}
function rgbToLab({ r, g, b }: RGB): Lab {
  const R = srgbToLinear(r), G = srgbToLinear(g), B = srgbToLinear(b);
  // linear sRGB -> XYZ (D65 white point), then XYZ -> Lab
  const x = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047;
  const y = R * 0.2126 + G * 0.7152 + B * 0.0722;
  const z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(x), fy = f(y), fz = f(z);
  return { L: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
}
function deltaE(a: Lab, b: Lab): number {
  return Math.hypot(a.L - b.L, a.a - b.a, a.b - b.b);
}

// --- Subtractive mixing: single-constant Kubelka-Munk per RGB channel ---
// Averaging RGB values mixes colours like light (blue + yellow -> grey), not
// like paint. Kubelka-Munk is the physical model for how pigments combine.
// The full version needs per-wavelength spectra; this approximation treats each
// channel's value as a reflectance, converts to the absorption/scatter ratio
// K/S, mixes K/S by concentration, then converts back — so mixes darken and
// shift hue the way real paint does (blue + yellow -> green).
function ksFromReflectance(reflectance: number): number {
  const R = Math.min(Math.max(reflectance, 0.004), 0.996);
  return ((1 - R) * (1 - R)) / (2 * R);
}
function reflectanceFromKs(ks: number): number {
  return 1 + ks - Math.sqrt(ks * ks + 2 * ks);
}
function mixPigments(pigments: Pigment[], weights: number[]): RGB {
  const channel = (key: 'r' | 'g' | 'b') => {
    let ks = 0;
    for (let i = 0; i < pigments.length; i++) {
      ks += weights[i] * ksFromReflectance(pigments[i].rgb[key] / 255);
    }
    return Math.round(reflectanceFromKs(ks) * 255);
  };
  return { r: channel('r'), g: channel('g'), b: channel('b') };
}

function evaluate(pigments: Pigment[], weights: number[], targetLab: Lab): Candidate {
  const mixedRgb = mixPigments(pigments, weights);
  return { pigments, weights, error: deltaE(rgbToLab(mixedRgb), targetLab), mixedRgb };
}

function bestSingle(pigs: Pigment[], targetLab: Lab): Candidate | null {
  let best: Candidate | null = null;
  for (const p of pigs) {
    const c = evaluate([p], [1], targetLab);
    if (!best || c.error < best.error) best = c;
  }
  return best;
}

// Best 2-pigment mix over a concentration grid (KM mixing is non-linear, so
// there's no closed-form ratio — we scan). The palette is small, so this is cheap.
function bestPair(pigs: Pigment[], targetLab: Lab): Candidate | null {
  let best: Candidate | null = null;
  const step = 0.05;
  for (let i = 0; i < pigs.length; i++) {
    for (let j = i + 1; j < pigs.length; j++) {
      for (let w = step; w < 1; w += step) {
        const c = evaluate([pigs[i], pigs[j]], [w, 1 - w], targetLab);
        if (!best || c.error < best.error) best = c;
      }
    }
  }
  return best;
}

// Best 3-pigment mix over a coarse concentration grid (each pigment at least 10%).
function bestTriple(pigs: Pigment[], targetLab: Lab): Candidate | null {
  let best: Candidate | null = null;
  const step = 0.1;
  for (let i = 0; i < pigs.length; i++) {
    for (let j = i + 1; j < pigs.length; j++) {
      for (let k = j + 1; k < pigs.length; k++) {
        const tri = [pigs[i], pigs[j], pigs[k]];
        for (let w1 = step; w1 < 1; w1 += step) {
          for (let w2 = step; w2 < 1 - w1 + 1e-9; w2 += step) {
            const w3 = 1 - w1 - w2;
            if (w3 < step - 1e-9) continue;
            const c = evaluate(tri, [w1, w2, w3], targetLab);
            if (!best || c.error < best.error) best = c;
          }
        }
      }
    }
  }
  return best;
}

// Turn blend weights into whole-number percentages that sum to exactly 100,
// sorted from most to least. Drops any pigment that rounds to 0%.
function toPercentages(cand: Candidate): { p: Pigment; pct: number }[] {
  const rows = cand.pigments
    .map((p, i) => ({ p, pct: Math.round(cand.weights[i] * 100) }))
    .filter((row) => row.pct > 0)
    .sort((a, b) => b.pct - a.pct);
  // Fix rounding drift so the percentages total 100.
  const sum = rows.reduce((s, r) => s + r.pct, 0);
  if (rows.length > 0 && sum !== 100) rows[0].pct += 100 - sum;
  return rows;
}

function buildNotes(rows: { p: Pigment; pct: number }[], chosen: Candidate, targetLab: Lab): string {
  const close = chosen.error <= 5; // ΔE ≤ ~5 reads as a good match
  let note: string;
  if (rows.length === 1) {
    note = close
      ? `${rows[0].p.name} matches this colour closely on its own — use it straight, no mixing needed.`
      : `${rows[0].p.name} is the nearest single pigment here — use it as your base; no mix of this set gets noticeably closer.`;
  } else if (rows.length === 2) {
    note = `Mix ${rows[0].p.name} and ${rows[1].p.name} — mostly ${rows[0].p.name} (${rows[0].pct}%), adjusted with ${rows[1].p.name} (${rows[1].pct}%). Blend thoroughly and tweak the ratio to taste.`;
  } else {
    note = `Start with ${rows[0].p.name} as the base, then work in ${rows
      .slice(1)
      .map((r) => r.p.name)
      .join(" and ")} a little at a time until the tone matches. Add the smaller amounts gradually.`;
  }

  // Palette honesty: when even the best mix is well off, say so and point the
  // way rather than implying the recipe is exact.
  if (chosen.error > 10) {
    const mixedL = rgbToLab(chosen.mixedRgb).L;
    let reach: string;
    if (targetLab.L < mixedL - 4) {
      reach = "it's darker than these tubes can reach — add a black or dark neutral (e.g. Payne's grey) to get there.";
    } else if (targetLab.L > mixedL + 4) {
      reach = "it's lighter than these tubes can reach — add white to get there.";
    } else {
      reach = "this hue sits outside what this set can mix cleanly.";
    }
    note += ` Note: this is the closest this palette can get — ${reach}`;
  }
  return note;
}

// Find the mix that best reproduces the target colour, using perceptual ΔE and
// subtractive (Kubelka-Munk) mixing. Picks the fewest pigments that get close
// enough: one if a single pigment already matches, two if a pair lands
// meaningfully closer, three only if the third still helps.
export function mixColors(
  targetHex: string,
  brandId: string,
  rangeId?: string
): PigmentRecipe | null {
  const brand = paints.brands.find((b) => b.id === brandId);
  if (!brand) return null;

  // Pick the requested range, falling back to the brand's first available one.
  const range =
    (rangeId ? brand.ranges.find((r) => r.id === rangeId && rangeIsAvailable(r)) : undefined) ||
    brand.ranges.find(rangeIsAvailable);
  if (!range) return null;

  const targetLab = rgbToLab(hexToRgb(targetHex));
  // The palette is small, so search all of it rather than pre-filtering by a
  // (potentially misleading) distance — the pigment needed to darken or shift a
  // colour is often not one of its nearest neighbours.
  const pigs: Pigment[] = range.colors.map((color) => ({
    name: color.name,
    hex: color.hex,
    rgb: hexToRgb(color.hex),
  }));
  if (pigs.length === 0) return null;

  const single = bestSingle(pigs, targetLab);
  const pair = pigs.length >= 2 ? bestPair(pigs, targetLab) : null;
  const triple = pigs.length >= 3 ? bestTriple(pigs, targetLab) : null;

  // Only add another pigment when it improves the match by a just-noticeable
  // amount (ΔE ≈ 2.5), so simple colours stay simple to mix.
  const IMPROVE_MIN = 2.5;
  let chosen = single!;
  if (pair && pair.error < chosen.error - IMPROVE_MIN) chosen = pair;
  if (triple && triple.error < chosen.error - IMPROVE_MIN) chosen = triple;

  const rows = toPercentages(chosen);

  return {
    pigments: rows.map((row) => ({ name: row.p.name, hex: row.p.hex, percentage: row.pct })),
    resultColor: rgbToHex(chosen.mixedRgb.r, chosen.mixedRgb.g, chosen.mixedRgb.b),
    mixing_notes: buildNotes(rows, chosen, targetLab),
  };
}

// Extract the dominant colours from an image using sharp.
// Downscales the image, buckets pixels by reduced colour depth, then greedily
// picks the most frequent buckets while skipping ones too similar to an
// already-chosen colour so the returned palette stays varied.
export async function extractDominantColors(
  imageBuffer: Buffer,
  colorCount: number = 5
): Promise<ExtractedColor[]> {
  const { data, info } = await sharp(imageBuffer)
    .resize(96, 96, { fit: 'inside' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = info.channels; // 3 (RGB) after removeAlpha
  type Bucket = { r: number; g: number; b: number; count: number };
  const buckets = new Map<number, Bucket>();

  for (let i = 0; i + 2 < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Reduce to 5 bits/channel (32 levels) so near-identical pixels group.
    const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.r += r;
      bucket.g += g;
      bucket.b += b;
      bucket.count++;
    } else {
      buckets.set(key, { r, g, b, count: 1 });
    }
  }

  const sorted = [...buckets.values()].sort((a, b) => b.count - a.count);
  const total = sorted.reduce((sum, b) => sum + b.count, 0) || 1;

  const avg = (bucket: Bucket) => ({
    r: Math.round(bucket.r / bucket.count),
    g: Math.round(bucket.g / bucket.count),
    b: Math.round(bucket.b / bucket.count),
  });

  const MIN_DISTANCE = 40; // Euclidean RGB distance between kept colours
  const chosen: Bucket[] = [];
  for (const bucket of sorted) {
    const c = avg(bucket);
    const tooClose = chosen.some((k) => {
      const kc = avg(k);
      return Math.hypot(c.r - kc.r, c.g - kc.g, c.b - kc.b) < MIN_DISTANCE;
    });
    if (!tooClose) chosen.push(bucket);
    if (chosen.length >= colorCount) break;
  }

  // Very flat image (everything merged) — fall back to the top buckets.
  const finalBuckets = chosen.length ? chosen : sorted.slice(0, colorCount);

  return finalBuckets.map((bucket) => {
    const c = avg(bucket);
    return {
      hex: rgbToHex(c.r, c.g, c.b),
      rgb: c,
      percentage: Math.round((bucket.count / total) * 100),
    };
  });
}

// Get list of available paint brands, each with its selectable ranges
// (Essentials mixing set, Full matching range, …).
export function getAvailableBrands() {
  return paints.brands.map((b) => ({
    id: b.id,
    name: b.label,
    ranges: b.ranges.map((r) => ({
      id: r.id,
      label: r.label,
      kind: r.kind,
      blurb: r.blurb ?? '',
      available: rangeIsAvailable(r),
      colorCount: r.colors.length,
    })),
    // Kept for backwards compatibility with older clients.
    colorCount: (b.ranges.find(rangeIsAvailable)?.colors.length) ?? 0,
  }));
}
