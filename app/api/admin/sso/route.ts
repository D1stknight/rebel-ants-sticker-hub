// POST /api/admin/sso (form field: ticket) — opened by the Rebel Console (economy.rebelants.io/admin).
// The ticket is checked with the economy (REBEL_BADGES_KEY, scope "hub.admin"). If it is real, this
// signs the browser in to the hub's own admin account (one of the hub_admins list: the one with the
// console admin's email, or the only one when there is just one and the console admin is an owner)
// and lands on /admin. No password is typed and none is stored; Supabase makes a one-time sign-in
// token on the server and it is used straight away (no email is sent).
import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { REBEL_ECONOMY_URL } from '@/lib/rebel'

export const dynamic = 'force-dynamic'

function page(status: number, body: string) {
  return new NextResponse(
    "<!doctype html><meta charset=utf-8><meta name=viewport content='width=device-width,initial-scale=1'><title>Sticker Hub admin</title><body style='background:#15120e;color:#f3ead6;font:16px system-ui;padding:24px'>" + body,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } },
  )
}

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null)
  const ticket = String(form?.get('ticket') || '')
  const key = process.env.REBEL_BADGES_KEY || ''
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!key || !serviceKey) return page(503, 'The Sticker Hub is not connected to the console yet.')
  if (!/^rat_[A-Za-z0-9_-]{20,96}$/.test(ticket)) return page(400, 'That link did not work. Open the Sticker Hub from the Rebel Console again.')

  let admin: { email: string | null; role: string } | null = null
  try {
    const r = await fetch(REBEL_ECONOMY_URL + '/api/internal/admin-ticket', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticket, scope: 'hub.admin' }),
      signal: AbortSignal.timeout(5000),
      cache: 'no-store',
    })
    const j = await r.json().catch(() => null)
    if (r.ok && j?.ok === true && (j.role === 'owner' || j.role === 'admin')) admin = { email: typeof j.email === 'string' ? j.email.toLowerCase() : null, role: j.role }
  } catch { admin = null }
  if (!admin) return page(401, 'That link did not work (it works once, for 2 minutes). Open the Sticker Hub from the Rebel Console again.')

  const service = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: rows } = await service.from('hub_admins').select('user_id')
  const emails: string[] = []
  for (const row of rows || []) {
    const { data } = await service.auth.admin.getUserById(row.user_id)
    if (data?.user?.email) emails.push(data.user.email.toLowerCase())
  }
  const email = admin.email && emails.includes(admin.email) ? admin.email : emails.length === 1 && admin.role === 'owner' ? emails[0] : null
  if (!email) return page(403, 'Your console account is not one of the Sticker Hub admins.')

  const { data: link, error: linkErr } = await service.auth.admin.generateLink({ type: 'magiclink', email })
  const tokenHash = link?.properties?.hashed_token
  if (linkErr || !tokenHash) return page(500, 'The Sticker Hub could not sign you in. Try again from the console.')
  const supabase = await createServerClient()
  const { error } = await supabase.auth.verifyOtp({ type: 'magiclink', token_hash: tokenHash })
  if (error) return page(500, 'The Sticker Hub could not sign you in. Try again from the console.')
  return NextResponse.redirect(new URL('/admin', req.url), 303)
}
