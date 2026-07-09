import sharp from 'sharp';
import paints from '../data/paints.json';

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

// Calculate color distance (simple Euclidean distance in RGB space)
function colorDistance(
  color1: { r: number; g: number; b: number },
  color2: { r: number; g: number; b: number }
): number {
  const dr = color1.r - color2.r;
  const dg = color1.g - color2.g;
  const db = color1.b - color2.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

type RGB = { r: number; g: number; b: number };
interface Pigment {
  name: string;
  hex: string;
  rgb: RGB;
}
interface Candidate {
  pigments: Pigment[];
  weights: number[]; // parallel to pigments, sum to 1
  error: number; // distance of the blended colour from the target
}

// Model a paint mix as a weighted linear blend of pigment RGBs. This is a
// rough approximation (real paint mixing is subtractive), but good enough to
// judge which combination of pigments lands closest to the target colour.
function blend(pigments: Pigment[], weights: number[]): RGB {
  let r = 0, g = 0, b = 0;
  for (let i = 0; i < pigments.length; i++) {
    r += weights[i] * pigments[i].rgb.r;
    g += weights[i] * pigments[i].rgb.g;
    b += weights[i] * pigments[i].rgb.b;
  }
  return { r, g, b };
}

function bestSingle(pigs: Pigment[], target: RGB): Candidate | null {
  let best: Candidate | null = null;
  for (const p of pigs) {
    const error = colorDistance(p.rgb, target);
    if (!best || error < best.error) best = { pigments: [p], weights: [1], error };
  }
  return best;
}

// Best 2-pigment blend, using the closed-form optimal mix ratio for each pair.
function bestPair(pigs: Pigment[], target: RGB): Candidate | null {
  let best: Candidate | null = null;
  for (let i = 0; i < pigs.length; i++) {
    for (let j = i + 1; j < pigs.length; j++) {
      const a = pigs[i].rgb, b = pigs[j].rgb;
      const dx = a.r - b.r, dy = a.g - b.g, dz = a.b - b.b;
      const denom = dx * dx + dy * dy + dz * dz;
      // t = weight of pigment a that minimises distance to target, clamped to [0,1]
      let t = denom === 0 ? 0.5 : ((target.r - b.r) * dx + (target.g - b.g) * dy + (target.b - b.b) * dz) / denom;
      t = Math.max(0, Math.min(1, t));
      const weights = [t, 1 - t];
      const error = colorDistance(blend([pigs[i], pigs[j]], weights), target);
      if (!best || error < best.error) best = { pigments: [pigs[i], pigs[j]], weights, error };
    }
  }
  return best;
}

// Best 3-pigment blend over a coarse weight grid (each pigment at least 10%).
function bestTriple(pigs: Pigment[], target: RGB): Candidate | null {
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
            const weights = [w1, w2, w3];
            const error = colorDistance(blend(tri, weights), target);
            if (!best || error < best.error) best = { pigments: tri, weights, error };
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

function buildNotes(rows: { p: Pigment; pct: number }[], close: boolean): string {
  if (rows.length === 1) {
    return close
      ? `${rows[0].p.name} matches this colour closely on its own — use it straight, no mixing needed.`
      : `${rows[0].p.name} is the nearest single pigment for this colour — use it as your base; mixing the others in this set won't get noticeably closer.`;
  }
  if (rows.length === 2) {
    return `Mix ${rows[0].p.name} and ${rows[1].p.name} — mostly ${rows[0].p.name} (${rows[0].pct}%), adjusted with ${rows[1].p.name} (${rows[1].pct}%). Blend thoroughly and tweak the ratio to taste.`;
  }
  return `Start with ${rows[0].p.name} as the base, then work in ${rows
    .slice(1)
    .map((r) => r.p.name)
    .join(" and ")} a little at a time until the tone matches. Add the smaller amounts gradually.`;
}

// Pick the fewest pigments that get close enough: one if a single pigment
// already matches, two if a pair lands meaningfully closer, three only if the
// third still helps. Percentages come from the actual blend that best matches.
export function mixColors(targetHex: string, brandId: string): PigmentRecipe | null {
  const brand = paints.brands.find((b) => b.id === brandId);
  if (!brand) return null;

  const targetRgb = hexToRgb(targetHex);
  // Consider the nearest handful of pigments so the combinations stay relevant.
  const nearest: Pigment[] = brand.colors
    .map((color) => ({ name: color.name, hex: color.hex, rgb: hexToRgb(color.hex) }))
    .sort((a, b) => colorDistance(a.rgb, targetRgb) - colorDistance(b.rgb, targetRgb))
    .slice(0, 6);

  if (nearest.length === 0) return null;

  const single = bestSingle(nearest, targetRgb);
  const pair = nearest.length >= 2 ? bestPair(nearest, targetRgb) : null;
  const triple = nearest.length >= 3 ? bestTriple(nearest, targetRgb) : null;

  // Only add another pigment when it cuts the colour error by a worthwhile margin.
  const IMPROVE_MIN = 8;
  let chosen = single!;
  if (pair && pair.error < chosen.error - IMPROVE_MIN) chosen = pair;
  if (triple && triple.error < chosen.error - IMPROVE_MIN) chosen = triple;

  const rows = toPercentages(chosen);
  const closeMatch = chosen.error <= 15; // RGB distance considered a tight match

  return {
    pigments: rows.map((row) => ({ name: row.p.name, hex: row.p.hex, percentage: row.pct })),
    resultColor: targetHex,
    mixing_notes: buildNotes(rows, closeMatch),
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

// Get list of available paint brands
export function getAvailableBrands() {
  return paints.brands.map((b) => ({
    id: b.id,
    name: b.label,
    colorCount: b.colors.length,
  }));
}
