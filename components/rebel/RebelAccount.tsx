'use client'

// Rebel Ants sign-in for the Hub (same accounts as every Rebel app).
// Browsing and downloading stay open to everyone; signing in only lets downloads earn badges.
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import toast from 'react-hot-toast'

const DEFAULT_ECONOMY = 'https://economy.rebelants.io'
const NOT_ON = "Sign-in isn't switched on here yet"

type Me = { signedIn: boolean; name: string | null; userId: string | null; economyUrl: string }

let mePromise: Promise<Me> | null = null
function loadMe(): Promise<Me> {
  if (!mePromise) {
    mePromise = fetch('/api/rebel/me', { cache: 'no-store' })
      .then(r => r.json())
      .then(j => ({ signedIn: !!j?.signedIn, name: j?.name ?? null, userId: j?.userId ?? null, economyUrl: j?.economyUrl || DEFAULT_ECONOMY }))
      .catch(() => ({ signedIn: false, name: null, userId: null, economyUrl: DEFAULT_ECONOMY }))
  }
  return mePromise
}

function useRebelMe() {
  const [me, setMe] = useState<Me | null>(null)
  useEffect(() => { let on = true; loadMe().then(m => { if (on) setMe(m) }); return () => { on = false } }, [])
  return me
}

const AUTH_MESSAGES: Record<string, string> = {
  cancelled: 'Discord sign-in was cancelled',
  misconfigured: NOT_ON,
}

/** Navbar control: "Sign in" when signed out, the colony name + Sign out when signed in. */
export function RebelAccount() {
  const me = useRebelMe()
  const [open, setOpen] = useState(false)
  const [menu, setMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Coming back from Discord: ?auth=ok | cancelled | ... → short message, then tidy the address bar.
  useEffect(() => {
    try {
      const url = new URL(window.location.href)
      const auth = url.searchParams.get('auth')
      if (!auth) return
      if (auth === 'ok') toast.success('Signed in — your downloads now earn badges')
      else toast.error(AUTH_MESSAGES[auth] || 'Sign-in didn’t work — please try again')
      url.searchParams.delete('auth')
      window.history.replaceState(null, '', url.pathname + url.search + url.hash)
    } catch {}
  }, [])

  useEffect(() => {
    if (!menu) return
    const close = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [menu])

  if (!me) return <span className="rebel-badge-acct-placeholder" aria-hidden />

  if (!me.signedIn) {
    return (
      <>
        <button className="btn-secondary rebel-badge-acct-btn" onClick={() => setOpen(true)}>Sign in</button>
        <SignInModal open={open} onClose={() => setOpen(false)} economyUrl={me.economyUrl} />
      </>
    )
  }

  const signOut = async () => {
    try {
      const r = await fetch(`${me.economyUrl}/api/auth/local`, {
        method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      })
      if (!r.ok) throw new Error(String(r.status))
      window.location.reload()
    } catch {
      toast.error(NOT_ON)
    }
  }

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button className="btn-secondary rebel-badge-acct-btn" onClick={() => setMenu(m => !m)} aria-expanded={menu}>
        <span>🐜</span>
        <span className="rebel-badge-acct-name">{me.name}</span>
      </button>
      {menu && (
        <div className="rebel-badge-menu">
          <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--text-muted)' }}>Signed in as<br />
            <strong style={{ color: 'var(--text-primary)', fontSize: 14 }}>{me.name}</strong>
          </div>
          <Link href="/badges" className="btn-ghost" style={{ width: '100%' }} onClick={() => setMenu(false)}>🏅 My badges</Link>
          <button className="btn-ghost" style={{ width: '100%' }} onClick={signOut}>Sign out</button>
        </div>
      )}
    </div>
  )
}

/** A "Sign in to collect badges" button (badges page). */
export function RebelSignInButton({ label = 'Sign in to collect badges' }: { label?: string }) {
  const me = useRebelMe()
  const [open, setOpen] = useState(false)
  return (
    <>
      <button className="btn-primary" onClick={() => setOpen(true)}>{label}</button>
      <SignInModal open={open} onClose={() => setOpen(false)} economyUrl={me?.economyUrl || DEFAULT_ECONOMY} />
    </>
  )
}

function SignInModal({ open, onClose, economyUrl }: { open: boolean; onClose: () => void; economyUrl: string }) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || typeof document === 'undefined') return null

  const discord = () => {
    const back = new URL(window.location.href)
    back.searchParams.delete('auth')
    window.location.href = `${economyUrl}/api/auth/discord/login?next=${encodeURIComponent(back.toString())}`
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg('')
    const n = name.trim()
    if (!n) return setMsg('Enter your colony name')
    if (!/^\d{4,8}$/.test(pin)) return setMsg('PIN is 4–8 digits')
    setBusy(true)
    try {
      const r = await fetch(`${economyUrl}/api/auth/local`, {
        method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: mode, name: n, pin }),
      })
      const j = await r.json().catch(() => null)
      if (!j?.ok) { setMsg(j?.message || (r.ok ? 'That didn’t work — check your name and PIN' : NOT_ON)); return }
      toast.success(`Welcome, ${j.name || n}!`)
      window.location.reload()
    } catch {
      setMsg(NOT_ON)
    } finally {
      setBusy(false)
    }
  }

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Sign in">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{mode === 'login' ? 'Sign in' : 'Create a colony name'}</h2>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>Your downloads earn Rebel Ants badges</p>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ padding: 8 }} aria-label="Close">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M18 6L6 18" strokeLinecap="round"/>
              <path d="M6 6l12 12" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <button onClick={discord} className="btn-primary" style={{ justifyContent: 'center', width: '100%' }}>
            Sign in with Discord
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-muted)', fontSize: 12 }}>
            <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />or use your colony name<span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input className="input" placeholder="Colony name" value={name} maxLength={24}
              autoComplete="username" onChange={e => setName(e.target.value)} />
            <input className="input" placeholder="PIN (4–8 digits)" value={pin} inputMode="numeric" type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'} maxLength={8}
              onChange={e => setPin(e.target.value.replace(/\D/g, ''))} />
            {msg && <p style={{ margin: 0, fontSize: 13, color: 'var(--accent-pink)' }}>{msg}</p>}
            <button type="submit" disabled={busy} className="btn-secondary" style={{ justifyContent: 'center', width: '100%' }}>
              {busy ? <span className="spinner" style={{ width: 16, height: 16 }} /> : null}
              {mode === 'login' ? 'Sign in' : 'Create my name'}
            </button>
          </form>

          <button className="btn-ghost" style={{ justifyContent: 'center', fontSize: 13 }}
            onClick={() => { setMode(m => (m === 'login' ? 'register' : 'login')); setMsg('') }}>
            {mode === 'login' ? 'New here? Create a name' : 'Already have a name? Sign in'}
          </button>

          <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
            Same sign-in as the Playground and The Underground. Downloading never needs an account.
          </p>
        </div>
      </div>
    </div>,
    document.body,
  )
}
