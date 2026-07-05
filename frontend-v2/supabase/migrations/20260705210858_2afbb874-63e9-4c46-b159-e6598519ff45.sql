
CREATE TABLE public.palettes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT false,
  image_data_url TEXT,
  colors JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.palettes TO authenticated;
GRANT SELECT ON public.palettes TO anon;
GRANT ALL ON public.palettes TO service_role;

ALTER TABLE public.palettes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public palettes are viewable by everyone"
  ON public.palettes FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can view their own palettes"
  ON public.palettes FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own palettes"
  ON public.palettes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own palettes"
  ON public.palettes FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own palettes"
  ON public.palettes FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX palettes_user_id_idx ON public.palettes(user_id);
CREATE INDEX palettes_public_created_idx ON public.palettes(is_public, created_at DESC);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_palettes_updated_at
  BEFORE UPDATE ON public.palettes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
