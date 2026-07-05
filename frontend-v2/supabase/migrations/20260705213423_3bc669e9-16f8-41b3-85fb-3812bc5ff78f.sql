
-- PROFILES
CREATE TABLE public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);
CREATE POLICY "Users insert their own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update their own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ARTWORKS (community boards)
CREATE TABLE public.artworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  style TEXT,
  medium TEXT,
  mood TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  original_image_url TEXT,
  final_image_url TEXT,
  painted_photo_url TEXT,
  palette JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX artworks_public_created_idx ON public.artworks (is_public, created_at DESC);
CREATE INDEX artworks_user_idx ON public.artworks (user_id, created_at DESC);
GRANT SELECT ON public.artworks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.artworks TO authenticated;
GRANT ALL ON public.artworks TO service_role;
ALTER TABLE public.artworks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public artworks viewable by everyone" ON public.artworks
  FOR SELECT USING (is_public = true);
CREATE POLICY "Users view their own artworks" ON public.artworks
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert their own artworks" ON public.artworks
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update their own artworks" ON public.artworks
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete their own artworks" ON public.artworks
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER artworks_updated_at BEFORE UPDATE ON public.artworks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ARTWORK LIKES
CREATE TABLE public.artwork_likes (
  artwork_id UUID NOT NULL REFERENCES public.artworks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (artwork_id, user_id)
);
CREATE INDEX artwork_likes_artwork_idx ON public.artwork_likes (artwork_id);
GRANT SELECT ON public.artwork_likes TO anon;
GRANT SELECT, INSERT, DELETE ON public.artwork_likes TO authenticated;
GRANT ALL ON public.artwork_likes TO service_role;
ALTER TABLE public.artwork_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Artwork likes are viewable by everyone" ON public.artwork_likes
  FOR SELECT USING (true);
CREATE POLICY "Users like artworks as themselves" ON public.artwork_likes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users remove their own artwork likes" ON public.artwork_likes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ARTWORK COMMENTS
CREATE TABLE public.artwork_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artwork_id UUID NOT NULL REFERENCES public.artworks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX artwork_comments_artwork_idx ON public.artwork_comments (artwork_id, created_at DESC);
GRANT SELECT ON public.artwork_comments TO anon;
GRANT SELECT, INSERT, DELETE ON public.artwork_comments TO authenticated;
GRANT ALL ON public.artwork_comments TO service_role;
ALTER TABLE public.artwork_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Artwork comments are viewable by everyone" ON public.artwork_comments
  FOR SELECT USING (true);
CREATE POLICY "Users comment as themselves" ON public.artwork_comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete their own comments" ON public.artwork_comments
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- PALETTE LIKES
CREATE TABLE public.palette_likes (
  palette_id UUID NOT NULL REFERENCES public.palettes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (palette_id, user_id)
);
CREATE INDEX palette_likes_palette_idx ON public.palette_likes (palette_id);
GRANT SELECT ON public.palette_likes TO anon;
GRANT SELECT, INSERT, DELETE ON public.palette_likes TO authenticated;
GRANT ALL ON public.palette_likes TO service_role;
ALTER TABLE public.palette_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Palette likes are viewable by everyone" ON public.palette_likes
  FOR SELECT USING (true);
CREATE POLICY "Users like palettes as themselves" ON public.palette_likes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users remove their own palette likes" ON public.palette_likes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
