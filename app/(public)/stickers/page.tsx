'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import PackCard from '@/components/ui/PackCard'
import AssetCard from '@/components/ui/AssetCard'
import SearchBar from '@/components/ui/SearchBar'
import SkeletonGrid from '@/components/ui/SkeletonGrid'
import type { Pack, Asset, Category } from '@/types'

export default function StickersPage() {
  const [packs, setPacks] = useState<Pack[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('packs').select('*, category:categories(*), item_count:pack_items(count)').eq('is_published', true).eq('type', 'sticker').order('created_at', { ascending: false }),
      supabase.from('assets').select('*, tags:asset_tags(*), category:categories(*)').eq('is_published', true).eq('type', 'sticker').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').in('type', ['sticker', 'both']).order('name'),
    ]).then(([packsRes, assetsRes, catsRes]) => {
      setPacks((packsRes.data as Pack[]) ?? [])
      setAssets((assetsRes.data as Asset[]) ?? [])
      setCategories((catsRes.data as Category[]) ?? [])
      setLoading(false)
    })
  }, [])

  const filteredPacks = packs.filter(p => {
    const matchQ = !query || p.title.toLowerCase().includes(query.toLowerCase())
    const matchC = !categoryFilter || p.category?.slug === categoryFilter
    return matchQ && matchC
  })

  const filteredAssets = assets.filter(a => {
    const matchQ = !query || a.title.toLowerCase().includes(query.toLowerCase()) || a.tags?.some(t => t.tag.toLowerCase().includes(query.toLowerCase()))
    const matchC = !categoryFilter || a.category?.slug === categoryFilter
    return matchQ && matchC
  })

  const hasResults = filteredPacks.length > 0 || filteredAssets.length > 0

  return (
    <div style={{ paddingTop: 32, paddingBottom: 64 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, margin: '0 0 6px', letterSpacing: '-0.02em' }}>🖼️ Stickers</h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Official Rebel Ants stickers for iMessage, Telegram, Discord & more.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
        <SearchBar value={query} onChange={setQuery} placeholder="Search stickers..." />
        {categories.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <button onClick={() => setCategoryFilter('')} style={{ padding: '6px 14px', borderRadius: 999, border: `1px solid ${!categoryFilter ? 'var(--accent-purple)' : 'var(--border)'}`, background: !categoryFilter ? 'rgba(139,92,246,0.15)' : 'var(--bg-card)', color: !categoryFilter ? 'var(--accent-purple)' : 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', minHeight: 36 }}>All</button>
            {categories.map(cat => (
              <button key={cat.id} onClick={() => setCategoryFilter(categoryFilter === cat.slug ? '' : cat.slug)} style={{ padding: '6px 14px', borderRadius: 999, border: `1px solid ${categoryFilter === cat.slug ? 'var(--accent-blue)' : 'var(--border)'}`, background: categoryFilter === cat.slug ? 'rgba(59,130,246,0.15)' : 'var(--bg-card)', color: categoryFilter === cat.slug ? 'var(--accent-blue)' : 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', minHeight: 36 }}>{cat.name}</button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <SkeletonGrid count={8} type="asset" />
      ) : !hasResults ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🖼️</div>
          <h3 style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{query ? `No results for "${query}"` : 'No sticker packs yet'}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{query ? 'Try a different search term.' : 'Check back soon — the colony is busy.'}</p>
        </div>
      ) : (
        <>
          {filteredPacks.length > 0 && (
            <section style={{ marginBottom: 48 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 16px' }}>📦 Packs</h2>
              <div className="pack-grid">
                {filteredPacks.map(pack => <PackCard key={pack.id} pack={pack} />)}
              </div>
            </section>
          )}
          {filteredAssets.length > 0 && (
            <section>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 16px' }}>🖼️ All Stickers <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-muted)' }}>{filteredAssets.length}</span></h2>
              <div className="asset-grid">
                {filteredAssets.map(asset => <AssetCard key={asset.id} asset={asset} />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
