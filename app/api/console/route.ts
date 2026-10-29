// The Rebel Console runs the Sticker Hub admin from here (economy.rebelants.io/admin/hub), server to server.
// Every request carries a one-time console ticket in x-admin-ticket (scope "hub.console", owners/admins),
// checked with the economy using REBEL_BADGES_KEY. Writes use the service role (the hub tables are locked
// to hub_admins for browser sessions). Files go straight from the admin's browser to Supabase Storage with a
// signed upload link from action "upload_url", so big GIFs and ZIPs never pass through a server.
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { REBEL_ECONOMY_URL } from '@/lib/rebel'
import { slugify } from '@/lib/utils'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const BUCKETS = ['stickers', 'gifs', 'covers', 'zips', 'thumbnails'] as const
type Bucket = (typeof BUCKETS)[number]
const EXT: Record<Bucket, string[]> = {
  stickers: ['png', 'webp'],
  gifs: ['gif'],
  covers: ['png', 'jpg', 'jpeg', 'webp', 'gif'],
  zips: ['zip'],
  thumbnails: ['png', 'jpg', 'jpeg', 'webp'],
}
const ASSET_FIELDS = ['title', 'slug', 'description', 'type', 'file_url', 'thumbnail_url', 'preview_url', 'external_url', 'category_id', 'featured', 'is_published'] as const
const PACK_FIELDS = ['title', 'slug', 'description', 'type', 'cover_image_url', 'zip_file_url', 'category_id', 'featured', 'is_published'] as const

const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } })

async function consoleAdmin(req: Request): Promise<string | null> {
  const ticket = String(req.headers.get('x-admin-ticket') || '').trim()
  const key = process.env.REBEL_BADGES_KEY || ''
  if (!key || !/^rat_[A-Za-z0-9_-]{20,96}$/.test(ticket)) return null
  try {
    const r = await fetch(REBEL_ECONOMY_URL + '/api/internal/admin-ticket', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer ' + key },
      body: JSON.stringify({ ticket, scope: 'hub.console' }),
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    })
    const j = await r.json().catch(() => null)
    return r.ok && j?.ok === true && (j.role === 'owner' || j.role === 'admin') ? String(j.adminId || 'admin') : null
  } catch {
    return null
  }
}

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const sk = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!url || !sk) throw new Error('The hub is missing its Supabase settings.')
  return createClient(url, sk, { auth: { persistSession: false } })
}

const str = (v: unknown, max: number) => (v === null || v === undefined ? null : String(v).trim().slice(0, max) || null)
const url = (v: unknown) => {
  const s = str(v, 600)
  return s && /^https:\/\//.test(s) ? s : null
}
function pick(src: Record<string, unknown>, fields: readonly string[]) {
  const out: Record<string, unknown> = {}
  for (const f of fields) {
    if (!(f in src)) continue
    const v = src[f]
    if (f === 'featured' || f === 'is_published') out[f] = v === true
    else if (f === 'type') out[f] = v === 'gif' ? 'gif' : 'sticker'
    else if (f === 'category_id') out[f] = typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v) ? v : null
    else if (f.endsWith('_url')) out[f] = url(v)
    else if (f === 'slug') out[f] = v ? slugify(String(v)).slice(0, 120) : null
    else out[f] = str(v, f === 'description' ? 2000 : 200)
  }
  return out
}
const storagePath = (u: string | null | undefined) => {
  const m = String(u || '').match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/)
  return m ? { bucket: m[1], path: decodeURIComponent(m[2]) } : null
}
const cleanTags = (t: unknown) =>
  Array.from(new Set((Array.isArray(t) ? t : []).map((x) => String(x).trim().toLowerCase().slice(0, 40)).filter(Boolean))).slice(0, 30)
const uuids = (v: unknown) => (Array.isArray(v) ? v : []).map(String).filter((x) => /^[0-9a-f-]{36}$/i.test(x)).slice(0, 500)

export async function GET(req: Request) {
  if (!(await consoleAdmin(req))) return json({ ok: false, error: 'unauthorized' }, 401)
  try {
    const s = db()
    const view = new URL(req.url).searchParams.get('view') || 'overview'
    if (view === 'overview') {
      const [packs, assets, downloads, cats, recent, week] = await Promise.all([
        s.from('packs').select('id, is_published', { count: 'exact' }),
        s.from('assets').select('id, is_published, type', { count: 'exact' }),
        s.from('downloads').select('id', { count: 'exact', head: true }),
        s.from('categories').select('id', { count: 'exact', head: true }),
        s.from('downloads').select('asset_id, pack_id, type, downloaded_at').order('downloaded_at', { ascending: false }).limit(1),
        s.from('downloads').select('id', { count: 'exact', head: true }).gte('downloaded_at', new Date(Date.now() - 7 * 86400e3).toISOString()),
      ])
      const a = assets.data || []
      return json({
        ok: true,
        packs: packs.count || 0, packsLive: (packs.data || []).filter((p) => p.is_published).length,
        stickers: a.filter((x) => x.type === 'sticker').length, gifs: a.filter((x) => x.type === 'gif').length,
        assetsLive: a.filter((x) => x.is_published).length,
        downloads: downloads.count || 0, downloads7d: week.count || 0, categories: cats.count || 0,
        lastDownloadAt: recent.data?.[0]?.downloaded_at || null,
      })
    }
    if (view === 'library') {
      const [assets, packs, cats, items, dl] = await Promise.all([
        s.from('assets').select('*, tags:asset_tags(tag)').order('created_at', { ascending: false }).limit(1000),
        s.from('packs').select('*').order('created_at', { ascending: false }).limit(300),
        s.from('categories').select('*').order('name'),
        s.from('pack_items').select('pack_id, asset_id, sort_order').order('sort_order').limit(5000),
        s.from('downloads').select('asset_id, pack_id').limit(20000),
      ])
      const count: Record<string, number> = {}
      for (const d of dl.data || []) { const k = d.asset_id || d.pack_id; if (k) count[k] = (count[k] || 0) + 1 }
      return json({ ok: true, assets: assets.data || [], packs: packs.data || [], categories: cats.data || [], items: items.data || [], downloads: count })
    }
    return json({ ok: false, error: 'unknown view' }, 400)
  } catch (e) {
    return json({ ok: false, error: e instanceof Error ? e.message : 'Server error' }, 500)
  }
}

export async function POST(req: Request) {
  const adminId = await consoleAdmin(req)
  if (!adminId) return json({ ok: false, error: 'unauthorized' }, 401)
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>
  try {
    const s = db()
    const action = String(b.action || '')

    if (action === 'upload_url') {
      const bucket = String(b.bucket || '') as Bucket
      if (!BUCKETS.includes(bucket)) return json({ ok: false, error: 'Unknown folder.' }, 400)
      const ext = String(b.ext || '').toLowerCase().replace(/[^a-z0-9]/g, '')
      if (!EXT[bucket].includes(ext)) return json({ ok: false, error: 'That file type is not allowed here (' + EXT[bucket].join(', ') + ').' }, 400)
      const path = Date.now() + '-' + Math.random().toString(36).slice(2) + '.' + ext
      const { data, error } = await s.storage.from(bucket).createSignedUploadUrl(path)
      if (error || !data) throw error || new Error('No upload link')
      const pub = s.storage.from(bucket).getPublicUrl(path).data.publicUrl
      return json({ ok: true, signedUrl: data.signedUrl, path, publicUrl: pub })
    }

    if (action === 'asset_save') {
      const fields = pick((b.asset || {}) as Record<string, unknown>, ASSET_FIELDS)
      const id = typeof b.id === 'string' && /^[0-9a-f-]{36}$/i.test(b.id) ? b.id : null
      if (!id) {
        if (!fields.title || !fields.file_url) return json({ ok: false, error: 'A title and a file are needed.' }, 400)
        fields.slug = fields.slug || slugify(String(fields.title)) + '-' + Math.random().toString(36).slice(2, 6)
        fields.thumbnail_url = fields.thumbnail_url || fields.file_url
        if (fields.type === 'gif') fields.preview_url = fields.preview_url || fields.file_url
      }
      const res = id
        ? await s.from('assets').update({ ...fields, updated_at: new Date().toISOString() }).eq('id', id).select().single()
        : await s.from('assets').insert(fields).select().single()
      if (res.error) throw res.error
      const assetId = res.data.id as string
      if (Array.isArray(b.tags)) {
        await s.from('asset_tags').delete().eq('asset_id', assetId)
        const tags = cleanTags(b.tags)
        if (tags.length) await s.from('asset_tags').insert(tags.map((tag) => ({ asset_id: assetId, tag })))
      }
      return json({ ok: true, id: assetId })
    }

    if (action === 'asset_delete') {
      const id = String(b.id || '')
      const { data: a } = await s.from('assets').select('file_url, thumbnail_url').eq('id', id).single()
      if (!a) return json({ ok: false, error: 'Not found.' }, 404)
      for (const u of [a.file_url, a.thumbnail_url !== a.file_url ? a.thumbnail_url : null]) {
        const p = storagePath(u)
        if (p) await s.storage.from(p.bucket).remove([p.path])
      }
      await s.from('asset_tags').delete().eq('asset_id', id)
      await s.from('pack_items').delete().eq('asset_id', id)
      const { error } = await s.from('assets').delete().eq('id', id)
      if (error) throw error
      return json({ ok: true })
    }

    if (action === 'pack_save') {
      const fields = pick((b.pack || {}) as Record<string, unknown>, PACK_FIELDS)
      const id = typeof b.id === 'string' && /^[0-9a-f-]{36}$/i.test(b.id) ? b.id : null
      if (!id) {
        if (!fields.title) return json({ ok: false, error: 'A pack needs a title.' }, 400)
        fields.slug = fields.slug || slugify(String(fields.title)) + '-' + Math.random().toString(36).slice(2, 6)
      }
      const res = id
        ? await s.from('packs').update({ ...fields, updated_at: new Date().toISOString() }).eq('id', id).select().single()
        : await s.from('packs').insert(fields).select().single()
      if (res.error) throw res.error
      const packId = res.data.id as string
      if (Array.isArray(b.assetIds)) {
        await s.from('pack_items').delete().eq('pack_id', packId)
        const ids = uuids(b.assetIds)
        if (ids.length) {
          const { error } = await s.from('pack_items').insert(ids.map((asset_id, i) => ({ pack_id: packId, asset_id, sort_order: i })))
          if (error) throw error
        }
      }
      return json({ ok: true, id: packId })
    }

    if (action === 'pack_delete') {
      const id = String(b.id || '')
      await s.from('pack_items').delete().eq('pack_id', id)
      const { error } = await s.from('packs').delete().eq('id', id)
      if (error) throw error
      return json({ ok: true })
    }

    if (action === 'category_save') {
      const name = str(b.name, 60)
      if (!name) return json({ ok: false, error: 'A category needs a name.' }, 400)
      const type = b.type === 'sticker' || b.type === 'gif' ? b.type : 'both'
      const { error } = await s.from('categories').insert({ name, slug: slugify(name), type })
      if (error) throw error
      return json({ ok: true })
    }

    if (action === 'category_delete') {
      const { error } = await s.from('categories').delete().eq('id', String(b.id || ''))
      if (error) throw error
      return json({ ok: true })
    }

    return json({ ok: false, error: 'Unknown action.' }, 400)
  } catch (e) {
    const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Server error'
    console.error('[hub console]', adminId, msg)
    return json({ ok: false, error: /duplicate key/.test(msg) ? 'That name or link is already used.' : msg }, 500)
  }
}
