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

// Find closest pigment color to a target RGB color
function findClosestPigment(
  targetColor: { r: number; g: number; b: number },
  brandId: string
): Array<{ name: string; hex: string; distance: number }> {
  const brand = paints.brands.find((b) => b.id === brandId);
  if (!brand) return [];

  return brand.colors
    .map((color) => ({
      name: color.name,
      hex: color.hex,
      distance: colorDistance(targetColor, hexToRgb(color.hex)),
    }))
    .sort((a, b) => a.distance - b.distance);
}

// Simple pigment mixer - creates a recipe based on closest matching pigments
export function mixColors(
  targetHex: string,
  brandId: string
): PigmentRecipe | null {
  const brand = paints.brands.find((b) => b.id === brandId);
  if (!brand) return null;

  const targetRgb = hexToRgb(targetHex);
  const closestColors = findClosestPigment(targetRgb, brandId);

  if (closestColors.length === 0) return null;

  // Simple recipe: use top 3 closest colors with weighted percentages
  const top3 = closestColors.slice(0, 3);
  const totalDistance = top3.reduce((sum, c) => sum + c.distance, 1);

  const recipe: PigmentRecipe = {
    pigments: top3.map((c) => ({
      name: c.name,
      hex: c.hex,
      percentage: Math.round(((totalDistance - c.distance) / totalDistance) * 100),
    })),
    resultColor: targetHex,
    mixing_notes: `Mix ${top3[0].name} as the base, then add ${top3[1].name} and ${top3[2].name} to adjust the tone. Start with small amounts of the secondary colors and mix thoroughly.`,
  };

  // Normalize percentages to 100
  const total = recipe.pigments.reduce((sum, p) => sum + p.percentage, 0);
  recipe.pigments = recipe.pigments.map((p) => ({
    ...p,
    percentage: Math.round((p.percentage / total) * 100),
  }));

  return recipe;
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
