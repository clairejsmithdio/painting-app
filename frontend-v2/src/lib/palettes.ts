import { supabase } from "@/integrations/supabase/client";
import type { ExtractedColor, PigmentRecipe } from "@/lib/api";

export interface PaletteColor {
  hex: string;
  percentage?: number | null;
  recipe?: PigmentRecipe | null;
  brand?: string | null;
}

export interface PaletteRow {
  id: string;
  user_id: string;
  name: string;
  is_public: boolean;
  image_data_url: string | null;
  colors: PaletteColor[];
  created_at: string;
}

// Downscale an image URL/File to a small JPEG data URL for thumbnail storage.
export async function makeThumbnail(source: string | File, maxDim = 480): Promise<string> {
  const src = typeof source === "string" ? source : URL.createObjectURL(source);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.crossOrigin = "anonymous";
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = src;
    });
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", 0.78);
  } finally {
    if (typeof source !== "string") URL.revokeObjectURL(src);
  }
}

export async function savePalette(input: {
  name: string;
  isPublic: boolean;
  imageDataUrl: string | null;
  colors: PaletteColor[];
}) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("You must be signed in to save a palette.");
  const { data, error } = await supabase
    .from("palettes")
    .insert({
      user_id: userData.user.id,
      name: input.name,
      is_public: input.isPublic,
      image_data_url: input.imageDataUrl,
      colors: input.colors as unknown as never,
    })
    .select()
    .single();
  if (error) throw error;
  return data as unknown as PaletteRow;
}

export async function listPublicPalettes(): Promise<PaletteRow[]> {
  const { data, error } = await supabase
    .from("palettes")
    .select("*")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(60);
  if (error) throw error;
  return (data as unknown as PaletteRow[]) ?? [];
}

export async function listMyPalettes(): Promise<PaletteRow[]> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];
  const { data, error } = await supabase
    .from("palettes")
    .select("*")
    .eq("user_id", userData.user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as PaletteRow[]) ?? [];
}

export function colorsFromExtracted(
  extracted: ExtractedColor[],
  recipes: Record<string, { recipe: PigmentRecipe; brand: string }>,
): PaletteColor[] {
  return extracted.map((c) => ({
    hex: c.hex,
    percentage: c.percentage ?? null,
    recipe: recipes[c.hex]?.recipe ?? null,
    brand: recipes[c.hex]?.brand ?? null,
  }));
}
