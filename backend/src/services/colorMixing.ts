import paints from '../data/paints.json';

export interface ExtractedColor {
  hex: string;
  rgb: { r: number; g: number; b: number };
}

export interface PigmentRecipe {
  pigments: Array<{
    name: string;
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

// Extract dominant colors from image (simplified version)
export function extractDominantColors(
  imageBuffer: Buffer,
  colorCount: number = 5
): ExtractedColor[] {
  // For MVP, return a set of test colors
  // In production, this would use image processing library like jimp or sharp
  const testColors = [
    { hex: '#E74C3C', rgb: { r: 231, g: 76, b: 60 } },
    { hex: '#3498DB', rgb: { r: 52, g: 152, b: 219 } },
    { hex: '#F39C12', rgb: { r: 243, g: 156, b: 18 } },
    { hex: '#2ECC71', rgb: { r: 46, g: 204, b: 113 } },
    { hex: '#9B59B6', rgb: { r: 155, g: 89, b: 182 } },
  ];

  return testColors.slice(0, colorCount);
}

// Get list of available paint brands
export function getAvailableBrands() {
  return paints.brands.map((b) => ({
    id: b.id,
    label: b.label,
    colorCount: b.colors.length,
  }));
}
