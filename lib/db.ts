import { createClient } from '@/lib/supabase/server'
import type { Pack, Asset, Category, SearchFilters } from '@/types'

// ─── PACKS ────────────────────────────────────────────────────────────────────

export async function getPacks(opts?: {
  type?: 'sticker' | 'gif'
  featured?: boolean
  limit?: number
  categorySlug?: string
}) {
  const supabase = await createClient()
  let q = supabase
    .from('packs')
    .select(`*, category:categories(*), item_count:pack_items(count)`)
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  if (opts?.type) q = q.eq('type', opts.type)
  if (opts?.featured) q = q.eq('featured', true)
  if (opts?.limit) q = q.limit(opts.limit)
  if (opts?.categorySlug) q = q.eq('categories.slug', opts.categorySlug)

  const { data, error } = await q
  if (error) throw error
  return (data as Pack[]) ?? []
}

export async function getPackBySlug(slug: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('packs')
    .select(`
      *,
      category:categories(*),
      items:pack_items(
        *,
        asset:assets(*, tags:asset_tags(*), category:categories(*))
      )
    `)
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (error) return null
  // Sort items by sort_order
  if (data?.items) {
    data.items = data.items.sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
  }
  return data as Pack
}

export async function getAllPacksAdmin() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('packs')
    .select(`*, category:categories(*), item_count:pack_items(count)`)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data as Pack[]) ?? []
}

// ─── ASSETS ──────────────────────────────────────────────────────────────────

export async function getAssets(opts?: {
  type?: 'sticker' | 'gif'
  featured?: boolean
  limit?: number
  categorySlug?: string
}) {
  const supabase = await createClient()
  let q = supabase
    .from('assets')
    .select(`*, tags:asset_tags(*), category:categories(*)`)
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  if (opts?.type) q = q.eq('type', opts.type)
  if (opts?.featured) q = q.eq('featured', true)
  if (opts?.limit) q = q.limit(opts.limit)

  const { data, error } = await q
  if (error) throw error
  return (data as Asset[]) ?? []
}

export async function searchAssets(filters: SearchFilters): Promise<Asset[]> {
  const supabase = await createClient()
  let q = supabase
    .from('assets')
    .select(`*, tags:asset_tags(*), category:categories(*)`)
    .eq('is_published', true)

  if (filters.type && filters.type !== 'all') q = q.eq('type', filters.type)
  if (filters.query) q = q.ilike('title', `%${filters.query}%`)

  const { data, error } = await q.order('created_at', { ascending: false }).limit(100)
  if (error) return []

  let results = (data as Asset[]) ?? []

  // Client-side tag filter if query not matched by title
  if (filters.query) {
    const q2 = filters.query.toLowerCase()
    results = results.filter(a =>
      a.title.toLowerCase().includes(q2) ||
      a.tags?.some(t => t.tag.toLowerCase().includes(q2))
    )
  }

  return results
}

export async function getAllAssetsAdmin() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('assets')
    .select(`*, tags:asset_tags(*), category:categories(*)`)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data as Asset[]) ?? []
}

// ─── CATEGORIES ──────────────────────────────────────────────────────────────

export async function getCategories(type?: 'sticker' | 'gif' | 'both') {
  const supabase = await createClient()
  let q = supabase.from('categories').select('*').order('name')
  if (type) q = q.in('type', [type, 'both'])

  const { data, error } = await q
  if (error) throw error
  return (data as Category[]) ?? []
}

export async function getCategoryBySlug(slug: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) return null
  return data as Category
}

// ─── DOWNLOAD TRACKING ──────────────────────────────────────────────────────

export async function recordDownload(opts: {
  assetId?: string
  packId?: string
  type: 'asset' | 'pack'
}) {
  const supabase = await createClient()
  await supabase.from('downloads').insert({
    asset_id: opts.assetId ?? null,
    pack_id: opts.packId ?? null,
    type: opts.type,
  })
}
