import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { assetId, packId, type } = body

    const supabase = await createClient()
    await supabase.from('downloads').insert({
      asset_id: assetId ?? null,
      pack_id: packId ?? null,
      type,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
