'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: '📊', exact: true },
  { href: '/admin/packs', label: 'Packs', icon: '📦' },
  { href: '/admin/assets', label: 'All Assets', icon: '🗂️' },
  { href: '/admin/stickers/new', label: 'Upload Sticker', icon: '🖼️' },
  { href: '/admin/gifs/new', label: 'Upload GIF', icon: '✨' },
  { href: '/admin/packs/new', label: 'New Pack', icon: '➕' },
  { href: '/admin/categories', label: 'Categories', icon: '🏷️' },
]

export default function AdminNav() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Signed out')
    router.push('/admin/login')
  }

  return (
    <nav style={{
      width: 220,
      flexShrink: 0,
      background: 'var(--bg-card)',
      borderRight: '1px solid var(--border)',
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px 12px',
      position: 'sticky',
      top: 0,
    }}>
      {/* Logo */}
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', padding: '4px 8px 20px', marginBottom: 8, borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontSize: 22 }}>🐜</span>
        <div>
          <div style={{ fontWeight: 800, fontSize: 13 }} className="gradient-text">Rebel Ants</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: -2 }}>Admin Panel</div>
        </div>
      </Link>

      <div style={{ flex: 1, paddingTop: 12 }}>
        {navItems.map(item => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 10, marginBottom: 4,
                textDecoration: 'none', fontSize: 14,
                background: active ? 'rgba(139,92,246,0.12)' : 'transparent',
                color: active ? 'var(--accent-purple)' : 'var(--text-secondary)',
                fontWeight: active ? 600 : 400,
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </div>

      <button onClick={handleLogout} className="btn-ghost" style={{ justifyContent: 'flex-start', marginTop: 8 }}>
        <span>🚪</span> Sign Out
      </button>
    </nav>
  )
}
