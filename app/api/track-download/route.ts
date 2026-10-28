import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { readRebel, badgeEvent, easternParts, type AwardedBadge, type CounterOp } from '@/lib/rebel'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const BADGE_BUDGET_MS = 4000

function optId(v: unknown): string | null | undefined {
  if (v === undefined || v === null) return null
  return typeof v === 'string' && UUID.test(v) ? v : undefined // undefined = invalid
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const assetId = optId(body?.assetId)
    const packId = optId(body?.packId)
    const type = body?.type
    if ((type !== 'asset' && type !== 'pack') || assetId === undefined || packId === undefined) {
      return NextResponse.json({ ok: false, error: 'bad_body' }, { status: 400 })
    }

    const supabase = await createClient()
    const { error } = await supabase.from('downloads').insert({
      asset_id: assetId ?? null,
      pack_id: packId ?? null,
      type,
    })

    // Rebel badges: only for a signed-in Rebel, only after the download was recorded, never slow.
    let awarded: AwardedBadge[] = []
    if (!error) {
      awarded = await Promise.race([
        downloadBadges(supabase, type, assetId, packId).catch(() => [] as AwardedBadge[]),
        new Promise<AwardedBadge[]>(r => setTimeout(() => r([]), BADGE_BUDGET_MS)),
      ])
    }

    return NextResponse.json({ ok: true, awarded })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

type Supa = Awaited<ReturnType<typeof createClient>>

const isGoodMorning = (s: string | null | undefined) =>
  !!s && s.toLowerCase().replace(/[-_]+/g, ' ').includes('good morning')

async function downloadBadges(
  supabase: Supa, type: 'asset' | 'pack', assetId: string | null, packId: string | null,
): Promise<AwardedBadge[]> {
  const me = await readRebel(await cookies())
  if (!me) return []
  const { day, hour } = easternParts()
  const counters: CounterOp[] = []
  const award: string[] = []
  let context: Record<string, string>
  let totalPacks = 0

  if (type === 'asset') {
    if (!assetId) return []
    const [{ data: asset }, { data: inPacks }] = await Promise.all([
      supabase.from('assets').select('id, type, category_id').eq('id', assetId).maybeSingle(),
      supabase.from('pack_items').select('pack:packs(title, slug)').eq('asset_id', assetId),
    ])
    if (!asset) return []
    counters.push(
      { key: 'items', op: 'distinct', item: asset.id },
      { key: 'itemsday', op: 'dayDistinct', item: asset.id },
      { key: asset.type === 'gif' ? 'gifs' : 'stickers', op: 'distinct', item: asset.id },
    )
    if (asset.category_id) counters.push({ key: 'cats', op: 'distinct', item: asset.category_id })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const packs = (inPacks ?? []).flatMap((r: any) => (Array.isArray(r.pack) ? r.pack : r.pack ? [r.pack] : []))
    if (hour < 8 && packs.some((p: { title?: string; slug?: string }) => isGoodMorning(p.title) || isGoodMorning(p.slug))) {
      award.push('hubsecret.morning')
    }
    context = { assetId: asset.id }
  } else {
    if (!packId) return []
    const [{ data: pack }, { count }] = await Promise.all([
      supabase.from('packs').select('id, title, slug, created_at').eq('id', packId).maybeSingle(),
      supabase.from('packs').select('id', { count: 'exact', head: true }).eq('is_published', true),
    ])
    if (!pack) return []
    totalPacks = count ?? 0
    counters.push({ key: 'packs', op: 'distinct', item: pack.id })
    if (pack.created_at && easternParts(new Date(pack.created_at)).day === day) {
      counters.push({ key: 'fresh', op: 'distinct', item: pack.id })
    }
    if (hour < 8 && (isGoodMorning(pack.title) || isGoodMorning(pack.slug))) award.push('hubsecret.morning')
    context = { packId: pack.id }
  }

  counters.push({ key: 'days', op: 'dayCount' }, { key: 'streak', op: 'day' })
  if (hour === 2 || hour === 3) award.push('hubsecret.night')

  const out = await badgeEvent({ userId: me.userId, counters, award: award.length ? award : undefined, context })
  if (!out) return []
  const awarded = [...out.awarded]

  // Every published pack downloaded → The Complete Set.
  if (type === 'pack' && totalPacks > 0 && (out.counters.packs ?? 0) >= totalPacks) {
    const more = await badgeEvent({ userId: me.userId, award: ['hub.allpacks'], context })
    if (more) awarded.push(...more.awarded)
  }
  return awarded
}
