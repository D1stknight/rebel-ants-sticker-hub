import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import AssetToggle from './AssetToggle'

export default async function AdminAssetsPage() {
  const supabase = await createClient()
  const { data: assets } = await supabase
    .from('assets')
    .select('*, category:categories(*), tags:asset_tags(*)')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 4px' }}>🗂️ All Assets</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 14 }}>{assets?.length ?? 0} total</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/admin/stickers/new" className="btn-secondary" style={{ fontSize: 13 }}>+ Sticker</Link>
          <Link href="/admin/gifs/new" className="btn-primary" style={{ fontSize: 13 }}>+ GIF</Link>
        </div>
      </div>

      {!assets?.length ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🗂️</div>
          <p>No assets yet. Upload your first sticker or GIF!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr 80px 80px auto auto auto', gap: 12, padding: '8px 14px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <span></span>
            <span>Title</span>
            <span>Type</span>
            <span>Category</span>
            <span>Tags</span>
            <span>Status</span>
            <span></span>
          </div>

          {assets.map(asset => (
            <div key={asset.id} className="card-glow" style={{ display: 'grid', gridTemplateColumns: '48px 1fr 80px 80px auto auto auto', gap: 12, padding: '10px 14px', alignItems: 'center' }}>
              {/* Thumbnail */}
              <div style={{ width: 48, height: 48, borderRadius: 8, overflow: 'hidden', background: 'var(--bg-surface)', flexShrink: 0 }}>
                {asset.thumbnail_url || asset.file_url ? (
                  <img src={asset.thumbnail_url || asset.file_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{asset.type === 'gif' ? '✨' : '🖼️'}</div>}
              </div>

              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{asset.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'monospace' }}>{asset.slug}</div>
              </div>

              <span className={`badge ${asset.type === 'gif' ? 'badge-pink' : 'badge-purple'}`} style={{ fontSize: 10 }}>
                {asset.type}
              </span>

              <span style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {asset.category?.name ?? '—'}
              </span>

              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 160 }}>
                {asset.tags?.slice(0, 3).map((t: { id: string; tag: string }) => (
                  <span key={t.id} style={{ fontSize: 10, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 6px', color: 'var(--text-muted)' }}>
                    {t.tag}
                  </span>
                ))}
              </div>

              <AssetToggle assetId={asset.id} isPublished={asset.is_published} />

              <Link href={`/admin/assets/${asset.id}/edit`} className="btn-ghost" style={{ padding: '6px 10px', fontSize: 12 }}>
                Edit
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
