// Who is signed in with Rebel Ants (shared economy sign-in), for the browser.
// Only the name and id leave the server; the key never does.
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { readRebel, REBEL_ECONOMY_URL } from '@/lib/rebel'

export const dynamic = 'force-dynamic'

export async function GET() {
  const me = await readRebel(await cookies()).catch(() => null)
  return NextResponse.json(
    { signedIn: Boolean(me), name: me?.displayName ?? null, userId: me?.userId ?? null, economyUrl: REBEL_ECONOMY_URL },
    { headers: { 'cache-control': 'no-store' } },
  )
}
