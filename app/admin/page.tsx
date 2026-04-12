import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [packsRes, assetsRes, downloadsRes, categoriesRes] = await Promise.all([
    supabase.from('packs').select('id, is_published, type', { count: 'exact' }),
    supabase.from('assets').select('id, is_published, type', { count: 'exact' }),
    supabase.from('downloads').select('id', { count: 'exact' }),
    supabase.from('categories').select('id', { count: 'exact' }),
  ])

  const packs = packsRes.data ?? []
  const assets = assetsRes.data ?? []

  const stats = [
    { label: 'Total Packs', value: packsRes.count ?? 0, sub: `${packs.filter(p => p.is_published).length} published`, icon: '📦', href: '/admin/packs', color: 'var(--accent-purple)' },
    { label: 'Total Assets', value: assetsRes.count ?? 0, sub: `${assets.filter(a => a.is_published).length} published`, icon: '🗂️', href: '/admin/assets', color: 'var(--accent-blue)' },
    { label: 'Downloads', value: downloadsRes.count ?? 0, sub: 'all time', icon: '⬇️', href: '/admin/assets', color: 'var(--accent-pink)' },
    { label: 'Categories', value: categoriesRes.count ?? 0, sub: 'active', icon: '🏷️', href: '/admin/categories', color: '#22c55e' },
  ]

  const quickActions = [
    { href: '/admin/stickers/new', label: 'Upload Sticker', icon: '🖼️', desc: 'Add a new PNG sticker' },
    { href: '/admin/gifs/new', label: 'Upload GIF', icon: '✨', desc: 'Add a new animated GIF' },
    { href: '/admin/packs/new', label: 'Create Pack', icon: '📦', desc: 'Bundle assets into a pack' },
    { href: '/admin/categories', label: 'Manage Categories', icon: '🏷️', desc: 'Organise your content' },
  ]

  // Recent packs
  const { data: recentPacks } = await supabase
    .from('packs')
    .select('id, title, type, is_published, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, margin: '0 0 4px', letterSpacing: '-0.02em' }}>Dashboard</h1>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 14 }}>Rebel Ants Hub — Admin Panel</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
        {stats.map(stat => (
          <Link key={stat.label} href={stat.href} style={{ textDecoration: 'none' }}>
            <div className="card-glow" style={{ padding: 20 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{stat.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginTop: 4 }}>{stat.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{stat.sub}</div>
            </div>
          </Link>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Quick actions */}
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px' }}>Quick Actions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {quickActions.map(action => (
              <Link key={action.href} href={action.href} style={{ textDecoration: 'none' }}>
                <div className="card-glow" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ fontSize: 24 }}>{action.icon}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{action.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{action.desc}</div>
                  </div>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>
                    <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent packs */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Recent Packs</h2>
            <Link href="/admin/packs" className="btn-ghost" style={{ fontSize: 12, padding: '6px 10px' }}>View all</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentPacks?.map(pack => (
              <div key={pack.id} className="card-glow" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span>{pack.type === 'gif' ? '✨' : '🖼️'}</span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pack.title}</span>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: pack.is_published ? 'rgba(34,197,94,0.1)' : 'rgba(100,116,139,0.1)', color: pack.is_published ? '#22c55e' : 'var(--text-muted)' }}>
                  {pack.is_published ? 'Live' : 'Draft'}
                </span>
              </div>
            ))}
            {!recentPacks?.length && (
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No packs yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
