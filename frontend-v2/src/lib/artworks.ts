import { supabase } from "@/integrations/supabase/client";
import type { PaletteColor } from "@/lib/palettes";

export interface ArtworkRow {
  id: string;
  user_id: string;
  title: string;
  description: string;
  style: string | null;
  medium: string | null;
  mood: string | null;
  tags: string[];
  original_image_url: string | null;
  final_image_url: string | null;
  painted_photo_url: string | null;
  palette: PaletteColor[];
  is_public: boolean;
  created_at: string;
}

export interface CommentRow {
  id: string;
  artwork_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export async function createArtwork(input: {
  title: string;
  description: string;
  style?: string | null;
  medium?: string | null;
  mood?: string | null;
  tags: string[];
  original_image_url: string | null;
  final_image_url: string | null;
  painted_photo_url: string | null;
  palette: PaletteColor[];
  is_public: boolean;
}): Promise<ArtworkRow> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("You must be signed in to share.");
  const { data, error } = await supabase
    .from("artworks")
    .insert({
      user_id: userData.user.id,
      title: input.title,
      description: input.description,
      style: input.style ?? null,
      medium: input.medium ?? null,
      mood: input.mood ?? null,
      tags: input.tags,
      original_image_url: input.original_image_url,
      final_image_url: input.final_image_url,
      painted_photo_url: input.painted_photo_url,
      palette: input.palette as unknown as never,
      is_public: input.is_public,
    })
    .select()
    .single();
  if (error) throw error;
  return data as unknown as ArtworkRow;
}

export async function listPublicArtworks(limit = 60): Promise<ArtworkRow[]> {
  const { data, error } = await supabase
    .from("artworks")
    .select("*")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as unknown as ArtworkRow[]) ?? [];
}

export async function getArtwork(id: string): Promise<ArtworkRow | null> {
  const { data } = await supabase.from("artworks").select("*").eq("id", id).maybeSingle();
  return (data as unknown as ArtworkRow | null) ?? null;
}

// ---- likes ----
export async function getArtworkLikeCounts(ids: string[]): Promise<Record<string, number>> {
  if (ids.length === 0) return {};
  const { data } = await supabase
    .from("artwork_likes")
    .select("artwork_id")
    .in("artwork_id", ids);
  const counts: Record<string, number> = {};
  for (const row of (data ?? []) as { artwork_id: string }[]) {
    counts[row.artwork_id] = (counts[row.artwork_id] ?? 0) + 1;
  }
  return counts;
}

export async function getMyArtworkLikes(ids: string[]): Promise<Set<string>> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user || ids.length === 0) return new Set();
  const { data } = await supabase
    .from("artwork_likes")
    .select("artwork_id")
    .eq("user_id", userData.user.id)
    .in("artwork_id", ids);
  return new Set(((data ?? []) as { artwork_id: string }[]).map((r) => r.artwork_id));
}

export async function toggleArtworkLike(artworkId: string, liked: boolean) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Sign in to love a board.");
  if (liked) {
    await supabase
      .from("artwork_likes")
      .delete()
      .eq("artwork_id", artworkId)
      .eq("user_id", userData.user.id);
  } else {
    await supabase
      .from("artwork_likes")
      .insert({ artwork_id: artworkId, user_id: userData.user.id });
  }
}

// ---- palette likes ----
export async function getPaletteLikeCounts(ids: string[]): Promise<Record<string, number>> {
  if (ids.length === 0) return {};
  const { data } = await supabase
    .from("palette_likes")
    .select("palette_id")
    .in("palette_id", ids);
  const counts: Record<string, number> = {};
  for (const row of (data ?? []) as { palette_id: string }[]) {
    counts[row.palette_id] = (counts[row.palette_id] ?? 0) + 1;
  }
  return counts;
}

export async function getMyPaletteLikes(ids: string[]): Promise<Set<string>> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user || ids.length === 0) return new Set();
  const { data } = await supabase
    .from("palette_likes")
    .select("palette_id")
    .eq("user_id", userData.user.id)
    .in("palette_id", ids);
  return new Set(((data ?? []) as { palette_id: string }[]).map((r) => r.palette_id));
}

export async function togglePaletteLike(paletteId: string, liked: boolean) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Sign in to love a palette.");
  if (liked) {
    await supabase
      .from("palette_likes")
      .delete()
      .eq("palette_id", paletteId)
      .eq("user_id", userData.user.id);
  } else {
    await supabase
      .from("palette_likes")
      .insert({ palette_id: paletteId, user_id: userData.user.id });
  }
}

// ---- comments ----
export async function listComments(artworkId: string): Promise<CommentRow[]> {
  const { data } = await supabase
    .from("artwork_comments")
    .select("*")
    .eq("artwork_id", artworkId)
    .order("created_at", { ascending: true });
  return (data as unknown as CommentRow[]) ?? [];
}

export async function addComment(artworkId: string, content: string): Promise<CommentRow> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Sign in to comment.");
  const trimmed = content.trim();
  if (!trimmed) throw new Error("Comment cannot be empty.");
  const { data, error } = await supabase
    .from("artwork_comments")
    .insert({ artwork_id: artworkId, user_id: userData.user.id, content: trimmed })
    .select()
    .single();
  if (error) throw error;
  return data as unknown as CommentRow;
}

export async function deleteComment(id: string) {
  await supabase.from("artwork_comments").delete().eq("id", id);
}
