import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  user_id: string;
  display_name: string;
  bio: string;
  avatar_url: string | null;
};

export async function getMyProfile(): Promise<Profile | null> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("user_id, display_name, bio, avatar_url")
    .eq("user_id", userData.user.id)
    .maybeSingle();
  return (data as Profile | null) ?? null;
}

export async function ensureMyProfile(): Promise<Profile | null> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return null;
  const existing = await getMyProfile();
  if (existing) return existing;
  const meta = (user.user_metadata ?? {}) as Record<string, string | undefined>;
  const guess =
    meta.name || meta.full_name || (user.email ? user.email.split("@")[0] : "Artist");
  const { data, error } = await supabase
    .from("profiles")
    .insert({
      user_id: user.id,
      display_name: guess,
      bio: "",
      avatar_url: meta.avatar_url ?? null,
    })
    .select()
    .single();
  if (error) return null;
  return data as Profile;
}

export async function updateMyProfile(input: {
  display_name: string;
  bio: string;
  avatar_url?: string | null;
}) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Sign in required.");
  const { data, error } = await supabase
    .from("profiles")
    .upsert({
      user_id: userData.user.id,
      display_name: input.display_name,
      bio: input.bio,
      avatar_url: input.avatar_url ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function getProfilesByUserIds(ids: string[]): Promise<Record<string, Profile>> {
  if (ids.length === 0) return {};
  const { data } = await supabase
    .from("profiles")
    .select("user_id, display_name, bio, avatar_url")
    .in("user_id", ids);
  const map: Record<string, Profile> = {};
  for (const p of (data ?? []) as Profile[]) map[p.user_id] = p;
  return map;
}
