import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isHubAdmin } from './admin-check'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setAll(cookiesToSet: any[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname
  const adminArea = path.startsWith('/admin') && !path.startsWith('/admin/login')
  // signed in is not enough: the account must be on the hub_admins list
  const admin = user && (adminArea || path === '/admin/login') ? await isHubAdmin(supabase) : false
  if (adminArea && !admin) {
    const url = request.nextUrl.clone(); url.pathname = '/admin/login'; if (user) url.search = '?denied=1'; return NextResponse.redirect(url)
  }
  if (path === '/admin/login' && admin) {
    const url = request.nextUrl.clone(); url.pathname = '/admin'; url.search = ''; return NextResponse.redirect(url)
  }
  return supabaseResponse
}
