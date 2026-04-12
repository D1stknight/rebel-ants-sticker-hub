-- ============================================================
-- REBEL ANTS STICKER & GIF HUB — SUPABASE SCHEMA
-- Run this entire file in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── CATEGORIES ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  type        TEXT NOT NULL CHECK (type IN ('sticker', 'gif', 'both')) DEFAULT 'both',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── PACKS ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS packs (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title            TEXT NOT NULL,
  slug             TEXT NOT NULL UNIQUE,
  description      TEXT,
  type             TEXT NOT NULL CHECK (type IN ('sticker', 'gif')),
  cover_image_url  TEXT,
  zip_file_url     TEXT,
  category_id      UUID REFERENCES categories(id) ON DELETE SET NULL,
  featured         BOOLEAN NOT NULL DEFAULT FALSE,
  is_published     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── ASSETS ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS assets (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title            TEXT NOT NULL,
  slug             TEXT NOT NULL UNIQUE,
  description      TEXT,
  type             TEXT NOT NULL CHECK (type IN ('sticker', 'gif')),
  file_url         TEXT NOT NULL,
  thumbnail_url    TEXT,
  preview_url      TEXT,
  external_url     TEXT,
  category_id      UUID REFERENCES categories(id) ON DELETE SET NULL,
  featured         BOOLEAN NOT NULL DEFAULT FALSE,
  is_published     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── ASSET TAGS ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS asset_tags (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id  UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  tag       TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_asset_tags_asset_id ON asset_tags(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_tags_tag ON asset_tags(tag);

-- ─── PACK ITEMS ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pack_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pack_id     UUID NOT NULL REFERENCES packs(id) ON DELETE CASCADE,
  asset_id    UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  UNIQUE(pack_id, asset_id)
);

CREATE INDEX IF NOT EXISTS idx_pack_items_pack_id ON pack_items(pack_id);

-- ─── DOWNLOADS (Analytics) ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS downloads (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id       UUID REFERENCES assets(id) ON DELETE SET NULL,
  pack_id        UUID REFERENCES packs(id) ON DELETE SET NULL,
  type           TEXT NOT NULL CHECK (type IN ('asset', 'pack')),
  downloaded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_downloads_asset_id ON downloads(asset_id);
CREATE INDEX IF NOT EXISTS idx_downloads_pack_id ON downloads(pack_id);

-- ─── UPDATED_AT TRIGGERS ─────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER packs_updated_at
  BEFORE UPDATE ON packs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER assets_updated_at
  BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────────────────────

ALTER TABLE categories  ENABLE ROW LEVEL SECURITY;
ALTER TABLE packs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_tags  ENABLE ROW LEVEL SECURITY;
ALTER TABLE pack_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE downloads   ENABLE ROW LEVEL SECURITY;

-- PUBLIC: read published content
CREATE POLICY "Public read categories"
  ON categories FOR SELECT USING (TRUE);

CREATE POLICY "Public read published packs"
  ON packs FOR SELECT USING (is_published = TRUE);

CREATE POLICY "Public read published assets"
  ON assets FOR SELECT USING (is_published = TRUE);

CREATE POLICY "Public read asset_tags"
  ON asset_tags FOR SELECT USING (
    EXISTS (SELECT 1 FROM assets a WHERE a.id = asset_id AND a.is_published = TRUE)
  );

CREATE POLICY "Public read pack_items"
  ON pack_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM packs p WHERE p.id = pack_id AND p.is_published = TRUE)
  );

-- PUBLIC: insert downloads (analytics, no auth needed)
CREATE POLICY "Public insert downloads"
  ON downloads FOR INSERT WITH CHECK (TRUE);

-- AUTHENTICATED (admin): full access to everything
CREATE POLICY "Admin full access categories"
  ON categories FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin full access packs"
  ON packs FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin full access assets"
  ON assets FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin full access asset_tags"
  ON asset_tags FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin full access pack_items"
  ON pack_items FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin read downloads"
  ON downloads FOR SELECT USING (auth.role() = 'authenticated');

-- ─── STORAGE BUCKETS ─────────────────────────────────────────────────────────
-- Run these in Supabase Dashboard → Storage (or use the SQL below)

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('stickers',   'stickers',   TRUE),
  ('gifs',       'gifs',       TRUE),
  ('covers',     'covers',     TRUE),
  ('zips',       'zips',       TRUE),
  ('thumbnails', 'thumbnails', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: public read
CREATE POLICY "Public read stickers"   ON storage.objects FOR SELECT USING (bucket_id = 'stickers');
CREATE POLICY "Public read gifs"       ON storage.objects FOR SELECT USING (bucket_id = 'gifs');
CREATE POLICY "Public read covers"     ON storage.objects FOR SELECT USING (bucket_id = 'covers');
CREATE POLICY "Public read zips"       ON storage.objects FOR SELECT USING (bucket_id = 'zips');
CREATE POLICY "Public read thumbnails" ON storage.objects FOR SELECT USING (bucket_id = 'thumbnails');

-- Storage policies: authenticated upload
CREATE POLICY "Auth upload stickers"   ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'stickers'   AND auth.role() = 'authenticated');
CREATE POLICY "Auth upload gifs"       ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'gifs'       AND auth.role() = 'authenticated');
CREATE POLICY "Auth upload covers"     ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'covers'     AND auth.role() = 'authenticated');
CREATE POLICY "Auth upload zips"       ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'zips'       AND auth.role() = 'authenticated');
CREATE POLICY "Auth upload thumbnails" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'thumbnails' AND auth.role() = 'authenticated');

-- Storage policies: authenticated delete
CREATE POLICY "Auth delete stickers"   ON storage.objects FOR DELETE USING (bucket_id = 'stickers'   AND auth.role() = 'authenticated');
CREATE POLICY "Auth delete gifs"       ON storage.objects FOR DELETE USING (bucket_id = 'gifs'       AND auth.role() = 'authenticated');
CREATE POLICY "Auth delete covers"     ON storage.objects FOR DELETE USING (bucket_id = 'covers'     AND auth.role() = 'authenticated');
CREATE POLICY "Auth delete zips"       ON storage.objects FOR DELETE USING (bucket_id = 'zips'       AND auth.role() = 'authenticated');
CREATE POLICY "Auth delete thumbnails" ON storage.objects FOR DELETE USING (bucket_id = 'thumbnails' AND auth.role() = 'authenticated');
