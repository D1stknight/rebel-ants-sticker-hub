'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import AssetToggle from './AssetToggle'
import DeleteAssetButton from './DeleteAssetButton'
import type { Asset } from '@/types'

type Tab = 'all' | 'sticker' | 'gif'

const PAGE_SIZE = 10

export default function AdminAssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('all')
  const [search, setSearch] = useState('')
  const [visible, setVisible] = useState(PAGE_SIZE)

  const load = async () => {
    setLoading(true)
    const { data } = await createClient()
      .from('assets')
      .select('*, category:categories(*), tags:asset_tags(*)')
      .order('title', { ascending: true })
    setAssets((data as Asset[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // Reset visible count when tab or search changes
  useEffect(() => { setVisible(PAGE_SIZE) }, [tab, search])

  const filtered = assets.filter(a => {
    const matchTab = tab === 'all' || a.type === tab
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase())
    return matchTab && matchSearch
  })

  const shown = filtered.slice(0, visible)
  const hasMore = visible < filtered.length

  const counts = {
    all: assets.length,
    sticker: assets.filter(a => a.type === 'sticker').length,
    gif: assets.filter(a => a.type === 'gif').length,
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 4px' }}>🗂️ All Assets</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 14 }}>{assets.length} total</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/admin/stickers/new" className="btn-secondary" style={{ fontSize: 13 }}>+ Sticker</Link>
          <Link href="/admin/gifs/new" className="btn-primary" style={{ fontSize: 13 }}>+ GIF</Link>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['all', 'sticker', 'gif'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
              fontWeight: tab === t ? 700 : 500, fontSize: 13,
              background: tab === t
                ? t === 'gif' ? 'rgba(236,72,153,0.15)' : t === 'sticker' ? 'rgba(139,92,246,0.15)' : 'rgba(139,92,246,0.15)'
                : 'var(--bg-card)',
              color: tab === t
                ? t === 'gif' ? 'var(--accent-pink)' : 'var(--accent-purple)'
                : 'var(--text-secondary)',
              border: `1px solid ${tab === t ? (t === 'gif' ? 'rgba(236,72,153,0.3)' : 'rgba(139,92,246,0.3)') : 'var(--border)'}`,
              transition: 'all 0.15s',
            }}
          >
            {t === 'all' ? `🐜 All (${counts.all})` : t === 'gif' ? `✨ GIFs (${counts.gif})` : `🖼️ Stickers (${counts.sticker})`}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2}
          style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}>
          <circle cx="6" cy="6" r="4"/><path d="M12 12l-2.5-2.5" strokeLinecap="round"/>
        </svg>
        <input
          className="input"
          style={{ paddingLeft: 34, fontSize: 13, height: 38 }}
          placeholder="Filter by name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Results count */}
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
        Showing {shown.length} of {filtered.length} · sorted A–Z
      </p>

      {/* Asset list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div className="spinner" style={{ margin: '0 auto' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🗂️</div>
          <p>{search ? `No results for "${search}"` : 'No assets yet.'}</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {shown.map(asset => (
              <div key={asset.id} className="card-glow" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px' }}>
                {/* Thumbnail */}
                <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', background: 'var(--bg-surface)', flexShrink: 0 }}>
                  {asset.thumbnail_url || asset.file_url ? (
                    <img src={asset.thumbnail_url || asset.file_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                      {asset.type === 'gif' ? '✨' : '🖼️'}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {asset.title}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span className={`badge ${asset.type === 'gif' ? 'badge-pink' : 'badge-purple'}`} style={{ fontSize: 10 }}>{asset.type}</span>
                    {(asset as any).category?.name && <span>{(asset as any).category.name}</span>}
                    {(asset as any).tags?.length > 0 && (
                      <span style={{ color: 'var(--text-muted)' }}>
                        {(asset as any).tags.slice(0, 4).map((t: {tag: string}) => `#${t.tag}`).join(' ')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <AssetToggle assetId={asset.id} isPublished={asset.is_published} />
                  <Link href={`/admin/assets/${asset.id}/edit`} className="btn-ghost" style={{ padding: '6px 10px', fontSize: 12 }}>Edit</Link>
                  <DeleteAssetButton assetId={asset.id} fileUrl={asset.file_url} thumbnailUrl={asset.thumbnail_url} assetType={asset.type} onDeleted={load} />
                </div>
              </div>
            ))}
          </div>

          {/* Load more */}
          {hasMore && (
            <button
              onClick={() => setVisible(v => v + PAGE_SIZE)}
              className="btn-secondary"
              style={{ width: '100%', justifyContent: 'center', marginTop: 16, fontSize: 13 }}
            >
              Load more ({filtered.length - visible} remaining)
            </button>
          )}
        </>
      )}
    </div>
  )
}
