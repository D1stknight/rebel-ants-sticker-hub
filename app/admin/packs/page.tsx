import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import PackToggle from './PackToggle'

export default async function AdminPacksPage() {
  const supabase = await createClient()
  const { data: packs } = await supabase
    .from('packs')
    .select('*, category:categories(*), item_count:pack_items(count)')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 4px' }}>📦 Packs</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 14 }}>{packs?.length ?? 0} total</p>
        </div>
        <Link href="/admin/packs/new" className="btn-primary" style={{ fontSize: 13 }}>
          + New Pack
        </Link>
      </div>

      {!packs?.length ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
          <p>No packs yet. Create your first one!</p>
          <Link href="/admin/packs/new" className="btn-primary" style={{ display: 'inline-flex', marginTop: 12 }}>Create Pack</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {packs.map(pack => (
            <div key={pack.id} className="card-glow" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: 22 }}>{pack.type === 'gif' ? '✨' : '🖼️'}</span>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {pack.title}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  {pack.category?.name ?? 'No category'} · {Array.isArray(pack.item_count) ? pack.item_count[0]?.count ?? 0 : 0} items
                </div>
              </div>

              {pack.featured && <span className="badge badge-blue" style={{ fontSize: 10 }}>⭐ Featured</span>}

              <PackToggle packId={pack.id} isPublished={pack.is_published} />

              <Link href={`/admin/packs/${pack.id}/edit`} className="btn-ghost" style={{ padding: '8px 12px', fontSize: 12 }}>
                Edit
              </Link>

              <Link href={`/packs/${pack.slug}`} className="btn-ghost" style={{ padding: '8px 12px', fontSize: 12 }}>
                View ↗
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
