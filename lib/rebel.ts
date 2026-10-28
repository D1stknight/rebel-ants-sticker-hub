// Rebel Ants sign-in + badges, server side only.
// The economy (economy.rebelants.io) is the sign-in hub: its `poker_session` cookie is set on
// .rebelants.io, so this app's server receives it. Everything here is best-effort: if the economy
// is down or the env vars are missing, these helpers return null and the Hub works as before.
// Never import this file from a client component (it reads REBEL_BADGES_KEY).

export const REBEL_ECONOMY_URL = (process.env.REBEL_ECONOMY_URL || 'https://economy.rebelants.io').replace(/\/+$/, '')
const KEY = process.env.REBEL_BADGES_KEY || ''
const TIMEOUT_MS = 3000
export const SESSION_COOKIE = 'poker_session'

export type RebelUser = { userId: string; displayName: string }

export type CounterOp =
  | { key: string; op: 'add'; by?: number }
  | { key: string; op: 'max'; by: number }
  | { key: string; op: 'streak'; hit: boolean }
  | { key: string; op: 'day' }
  | { key: string; op: 'distinct'; item: string }
  | { key: string; op: 'dayAdd'; by?: number }
  | { key: string; op: 'dayDistinct'; item: string }
  | { key: string; op: 'dayCount' }

export type AwardedBadge = { id: string; name: string; tier: string; tierLabel: string; app: string }

export type CatalogBadge = {
  id: string; app: string; family: string; familyName: string; name: string
  tier: string; rule: string; hidden: boolean; art: string
}
export type EarnedBadge = { id: string; app: string; name: string; tier: string; rule: string; familyName: string; art: string; earnedAt?: string }
export type BadgeRead = { badges: EarnedBadge[]; toGo: Record<string, [number, number]>; catalog: CatalogBadge[] }

const logged = new Set<string>()
function logOnce(tag: string, err: unknown) {
  if (logged.has(tag)) return
  logged.add(tag)
  console.warn(`[rebel] ${tag}:`, err instanceof Error ? err.message : err)
}

export const rebelEnabled = () => Boolean(KEY)

async function call(path: string, init: RequestInit): Promise<Response | null> {
  if (!KEY) return null
  try {
    return await fetch(REBEL_ECONOMY_URL + path, {
      ...init,
      headers: { 'content-type': 'application/json', authorization: `Bearer ${KEY}`, ...(init.headers || {}) },
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (e) {
    logOnce(path, e)
    return null
  }
}

type CookieReader = { get(name: string): { value: string } | undefined }

/** Who is signed in (from the shared economy cookie), or null. Call once per request. */
export async function readRebel(cookies: CookieReader): Promise<RebelUser | null> {
  const token = cookies.get(SESSION_COOKIE)?.value
  if (!token || !KEY) return null
  const res = await call('/api/internal/resolve', { method: 'POST', body: JSON.stringify({ sessionToken: token }) })
  if (!res || !res.ok) {
    if (res && res.status !== 401) logOnce('resolve ' + res.status, res.statusText)
    return null
  }
  try {
    const j = await res.json()
    if (!j?.userId) return null
    return { userId: String(j.userId), displayName: String(j.displayName || 'Rebel') }
  } catch (e) {
    logOnce('resolve json', e)
    return null
  }
}

/** Send counters / awards for a player. Returns what the economy said, or null on any trouble. */
export async function badgeEvent(body: {
  userId: string
  award?: string[]
  counters?: CounterOp[]
  context?: Record<string, unknown>
}): Promise<{ awarded: AwardedBadge[]; counters: Record<string, number> } | null> {
  const res = await call('/api/internal/badges', { method: 'POST', body: JSON.stringify(body) })
  if (!res || !res.ok) {
    if (res) logOnce('badges ' + res.status, res.statusText)
    return null
  }
  try {
    const j = await res.json()
    const awarded: AwardedBadge[] = Array.isArray(j?.awarded)
      ? j.awarded.map((b: AwardedBadge) => ({ id: b.id, name: b.name, tier: b.tier, tierLabel: b.tierLabel, app: b.app }))
      : []
    return { awarded, counters: (j?.counters && typeof j.counters === 'object') ? j.counters : {} }
  } catch (e) {
    logOnce('badges json', e)
    return null
  }
}

/** The Hub's badge list for a player (userId "_" = signed out: catalog only). */
export async function readBadges(userId: string): Promise<BadgeRead | null> {
  const res = await call(`/api/internal/badges?userId=${encodeURIComponent(userId || '_')}&app=hub`, { method: 'GET' })
  if (!res || !res.ok) {
    if (res) logOnce('badges read ' + res.status, res.statusText)
    return null
  }
  try {
    const j = await res.json()
    return {
      badges: Array.isArray(j?.badges) ? j.badges : [],
      toGo: (j?.toGo && typeof j.toGo === 'object') ? j.toGo : {},
      catalog: Array.isArray(j?.catalog) ? j.catalog : [],
    }
  } catch (e) {
    logOnce('badges read json', e)
    return null
  }
}

/** Eastern-time parts for "now" (or a given date): yyyy-mm-dd and the hour 0–23. */
export function easternParts(d: Date = new Date()): { day: string; hour: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23',
  }).formatToParts(d)
  const get = (t: string) => parts.find(p => p.type === t)?.value || ''
  return { day: `${get('year')}-${get('month')}-${get('day')}`, hour: Number(get('hour')) % 24 }
}
