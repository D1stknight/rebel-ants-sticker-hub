-- Sticker Hub: only listed admins can change packs, stickers and files (Oct 28, 2026).
-- Before this, ANY signed-in Supabase account counted as an admin (policies checked only
-- auth.role() = 'authenticated'), so anyone who could create an account could edit or delete
-- the site's content straight through the public API.
-- After: a hub_admins list (seeded with the one existing account), and every write policy asks
-- is_hub_admin(). Public reading and public download counting are unchanged.

CREATE TABLE IF NOT EXISTS public.hub_admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  added_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.hub_admins ENABLE ROW LEVEL SECURITY;  -- no policies: nobody reads it through the API

CREATE OR REPLACE FUNCTION public.is_hub_admin() RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$ SELECT EXISTS (SELECT 1 FROM public.hub_admins WHERE user_id = auth.uid()) $$;
REVOKE ALL ON FUNCTION public.is_hub_admin() FROM public;
GRANT EXECUTE ON FUNCTION public.is_hub_admin() TO anon, authenticated;

-- the account that exists today (created Apr 12, the only one) stays an admin
INSERT INTO public.hub_admins (user_id) SELECT id FROM auth.users ON CONFLICT DO NOTHING;

-- tables
DROP POLICY IF EXISTS "Admin full access categories" ON public.categories;
CREATE POLICY "Admin full access categories" ON public.categories FOR ALL USING (public.is_hub_admin()) WITH CHECK (public.is_hub_admin());
DROP POLICY IF EXISTS "Admin full access packs" ON public.packs;
CREATE POLICY "Admin full access packs" ON public.packs FOR ALL USING (public.is_hub_admin()) WITH CHECK (public.is_hub_admin());
DROP POLICY IF EXISTS "Admin full access assets" ON public.assets;
CREATE POLICY "Admin full access assets" ON public.assets FOR ALL USING (public.is_hub_admin()) WITH CHECK (public.is_hub_admin());
DROP POLICY IF EXISTS "Admin full access asset_tags" ON public.asset_tags;
CREATE POLICY "Admin full access asset_tags" ON public.asset_tags FOR ALL USING (public.is_hub_admin()) WITH CHECK (public.is_hub_admin());
DROP POLICY IF EXISTS "Admin full access pack_items" ON public.pack_items;
CREATE POLICY "Admin full access pack_items" ON public.pack_items FOR ALL USING (public.is_hub_admin()) WITH CHECK (public.is_hub_admin());
DROP POLICY IF EXISTS "Admin read downloads" ON public.downloads;
CREATE POLICY "Admin read downloads" ON public.downloads FOR SELECT USING (public.is_hub_admin());

-- storage (upload + delete per bucket)
DO $$
DECLARE b text;
BEGIN
  FOREACH b IN ARRAY ARRAY['stickers','gifs','covers','zips','thumbnails'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', 'Auth upload ' || b);
    EXECUTE format('CREATE POLICY %I ON storage.objects FOR INSERT WITH CHECK (bucket_id = %L AND public.is_hub_admin())', 'Auth upload ' || b, b);
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', 'Auth delete ' || b);
    EXECUTE format('CREATE POLICY %I ON storage.objects FOR DELETE USING (bucket_id = %L AND public.is_hub_admin())', 'Auth delete ' || b, b);
  END LOOP;
END $$;
