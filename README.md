# 🐜 Rebel Ants Sticker & GIF Hub

A production-ready, mobile-first platform for browsing, previewing, and downloading Rebel Ants sticker packs and GIFs.

**Live:** `https://stickers.rebelants.io` (configure in Vercel)

---

## Tech Stack

- **Framework:** Next.js 15 (App Router) + TypeScript
- **Styling:** Tailwind CSS v4 — dark theme, purple/blue glow
- **Backend:** Supabase (Auth + PostgreSQL + Storage)
- **Deployment:** Vercel
- **PWA:** Manifest + Service Worker (installable on mobile)

---

## Quick Start (5 Steps)

### Step 1 — Clone the repo

```bash
git clone https://github.com/D1stknight/rebel-ants-sticker-hub.git
cd rebel-ants-sticker-hub
npm install
```

### Step 2 — Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → New Project
2. Name it `rebel-ants-sticker-hub`
3. Choose a strong database password (save it)
4. Region: `US East` (closest to your Vercel region `iad1`)

### Step 3 — Set up the database

1. In your Supabase project → **SQL Editor**
2. Paste the entire contents of `supabase/schema.sql`
3. Click **Run**

This creates all tables, RLS policies, and storage buckets automatically.

### Step 4 — Set environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in the values from **Supabase → Project Settings → API**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Step 5 — Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Creating Your Admin Account

You need to create an admin user in Supabase Auth before you can log in:

1. Supabase Dashboard → **Authentication → Users**
2. Click **Invite user** or **Add user**
3. Enter your email + password
4. Go to `/admin/login` and sign in

---

## Deploying to Vercel

### Option A — Connect GitHub (recommended)

1. Push this repo to GitHub as `D1stknight/rebel-ants-sticker-hub`
2. Go to [vercel.com](https://vercel.com) → **New Project**
3. Import the `rebel-ants-sticker-hub` repo
4. Add environment variables (same as `.env.local` but with your live URL)
5. Deploy

### Option B — Vercel CLI

```bash
npx vercel --prod
```

### Environment variables in Vercel

Set these in **Vercel → Project → Settings → Environment Variables**:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key |
| `NEXT_PUBLIC_SITE_URL` | `https://stickers.rebelants.io` |

### Custom domain

In Vercel → Project → Settings → Domains → Add `stickers.rebelants.io`

---

## How to Add Content

### Upload a sticker

1. Go to `/admin/login` → sign in
2. Click **Upload Sticker** in the sidebar
3. Drop your PNG file
4. Fill in title, tags, category
5. Toggle **Published** → Save

### Upload a GIF

1. Click **Upload GIF** in the sidebar
2. Drop your `.gif` file
3. Optionally drop a PNG thumbnail (faster loading)
4. Fill in details → Save

### Create a pack

1. Click **Create Pack**
2. Fill in title, type (sticker/gif), description
3. Upload a cover image
4. Upload a `.zip` file of all assets in the pack
5. Select which individual assets belong in this pack
6. Toggle **Published** → Create

---

## App Structure

```
/app
  /(public)         # Public-facing pages
    page.tsx        # Home
    /stickers       # Browse sticker packs
    /gifs           # Browse GIF packs
    /packs/[slug]   # Individual pack page
    /search         # Full search
    /category/[slug]
    /about
    /how-to-use
  /admin            # Protected admin panel
    /login
    /packs
    /assets
    /stickers/new
    /gifs/new
    /categories
  /api
    /track-download
    /admin/upload

/components
  /layout           # Navbar, Footer, PublicLayout
  /ui               # PackCard, AssetCard, AssetModal, SearchBar, FilterBar, SkeletonGrid
  /admin            # AdminNav, UploadDropzone

/lib
  /supabase         # client.ts, server.ts, middleware.ts
  db.ts             # All DB queries
  storage.ts        # Storage helpers
  analytics.ts      # Download tracking
  utils.ts          # Helpers

/types
  index.ts          # All TypeScript types

/supabase
  schema.sql        # Full DB schema — run this in Supabase

/public
  manifest.json     # PWA manifest
  sw.js             # Service worker
  /icons            # Add your app icons here (192px, 512px, 180px)
```

---

## PWA — Install on Mobile

The app is installable as a native-feeling mobile app:

1. Visit the site on iOS Safari → Share → **Add to Home Screen**
2. On Android Chrome → browser menu → **Install App**

Required icons (add to `/public/icons/`):
- `icon-192.png` (192×192)
- `icon-512.png` (512×512)
- `apple-touch-icon.png` (180×180)

---

## Database Schema

| Table | Purpose |
|---|---|
| `categories` | Sticker/GIF/Both categories |
| `packs` | Pack metadata, cover, ZIP link |
| `assets` | Individual stickers and GIFs |
| `asset_tags` | Tag system for search |
| `pack_items` | Links assets to packs with sort order |
| `downloads` | Analytics — tracks every download |

---

## Storage Buckets

All buckets are **public read**, authenticated upload only:

| Bucket | Contents |
|---|---|
| `stickers` | PNG sticker files |
| `gifs` | Animated GIF files |
| `covers` | Pack cover images |
| `zips` | Downloadable pack ZIP files |
| `thumbnails` | Static thumbnails for GIFs |

---

## Version 2 Roadmap

Already scaffolded, just needs enabling:

- [ ] Favorites system (Supabase table + auth)
- [ ] Trending packs (downloads count query)
- [ ] Share buttons + QR codes
- [ ] Copy GIF link (already in AssetModal)
- [ ] Dark/light mode toggle
- [ ] GIPHY integration via `external_url`

---

Built with 🐜 by Rebel Ants
