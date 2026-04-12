'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useDebouncedCallback } from 'use-debounce'
import AssetCard from '@/components/ui/AssetCard'
import PackCard from '@/components/ui/PackCard'
import SkeletonGrid from '@/components/ui/SkeletonGrid'
import type { Asset, Pack, Category, AssetType } from '@/types'

type Tab = 'all' | 'packs'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<Tab>('all')
  const [typeFilter, setTypeFilter] = useState<AssetType | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [allAssets, setAllAssets] = useState<Asset[]>([])
  const [allPacks, setAllPacks] = useState<Pack[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  // Load everything once on mount
  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('assets').select('*, tags:asset_tags(*), category:categories(*)').eq('is_published', true).order('created_at', { ascending: false }),
      supabase.from('packs').select('*, category:categories(*), item_count:pack_items(count)').eq('is_published', true).order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('name'),
    ]).then(([assetsRes, packsRes, catsRes]) => {
      setAllAssets((assetsRes.data as Asset[]) ?? [])
      setAllPacks((packsRes.data as Pack[]) ?? [])
      setCategories((catsRes.data as Category[]) ?? [])
      setLoading(false)
    })
  }, [])

  // Filter client-side — searches title AND tags
  const q = query.toLowerCase().trim()

  const filteredAssets = allAssets.filter(a => {
    const matchType = typeFilter === 'all' || a.type === typeFilter
    const matchCat = !categoryFilter || a.category?.slug === categoryFilter
    const matchQ = !q ||
      a.title.toLowerCase().includes(q) ||
      a.tags?.some(t => t.tag.toLowerCase().includes(q)) ||
      a.description?.toLowerCase().includes(q) ||
      a.category?.name?.toLowerCase().includes(q)
    return matchType && matchCat && matchQ
  })

  const filteredPacks = allPacks.filter(p => {
    const matchType = typeFilter === 'all' || p.type === typeFilter
    const matchCat = !categoryFilter || p.category?.slug === categoryFilter
    const matchQ = !q ||
      p.title.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.category?.name?.toLowerCase().includes(q)
    return matchType && matchCat && matchQ
  })

  const totalResults = filteredAssets.length + filteredPacks.length

  return (
    <div style={{ paddingTop: 32, paddingBottom: 64 }}>
      <h1 style={{ fontSize: 28, fontWeight: 900, margin: '0 0 24px', letterSpacing: '-0.02em' }}>🔍 Search</h1>

      {/* Search input */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2}
          style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}>
          <circle cx="8" cy="8" r="5" /><path d="M16 16l-3.5-3.5" strokeLinecap="round" />
        </svg>
        <input
          autoFocus
          type="search"
          className="input"
          style={{ paddingLeft: 46, fontSize: 16, height: 52 }}
          placeholder="Search by name, tag, category…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
        {(['all', 'sticker', 'gif'] as const).map(t => (
          <button key={t} onClick={() => setTypeFilter(t)} style={{
            padding: '6px 14px', borderRadius: 999, fontSize: 13, cursor: 'pointer', minHeight: 36,
            border: `1px solid ${typeFilter === t ? 'var(--accent-purple)' : 'var(--border)'}`,
            background: typeFilter === t ? 'rgba(139,92,246,0.15)' : 'var(--bg-card)',
            color: typeFilter === t ? 'var(--accent-purple)' : 'var(--text-secondary)',
            fontWeight: typeFilter === t ? 600 : 400,
          }}>
            {t === 'all' ? '🐜 All' : t === 'gif' ? '✨ GIFs' : '🖼️ Stickers'}
          </button>
        ))}
        {categories.length > 0 && <>
          <div style={{ width: 1, background: 'var(--border)', alignSelf: 'stretch' }} />
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setCategoryFilter(categoryFilter === cat.slug ? '' : cat.slug)} style={{
              padding: '6px 14px', borderRadius: 999, fontSize: 13, cursor: 'pointer', minHeight: 36,
              border: `1px solid ${categoryFilter === cat.slug ? 'var(--accent-blue)' : 'var(--border)'}`,
              background: categoryFilter === cat.slug ? 'rgba(59,130,246,0.15)' : 'var(--bg-card)',
              color: categoryFilter === cat.slug ? 'var(--accent-blue)' : 'var(--text-secondary)',
            }}>{cat.name}</button>
          ))}
        </>}
      </div>

      {loading ? (
        <SkeletonGrid count={8} type="asset" />
      ) : (
        <>
          {/* Results count */}
          {q && (
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
              {totalResults === 0 ? `No results for "${query}"` : `${totalResults} result${totalResults !== 1 ? 's' : ''} for "${query}"`}
            </p>
          )}

          {/* Empty state */}
          {totalResults === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>{q ? '😔' : '🐜'}</div>
              <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                {q ? `Nothing found for "${query}"` : 'Start typing to search…'}
              </p>
              {q && <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Try a different keyword or browse the tabs above.</p>}
            </div>
          )}

          {/* Tabs */}
          {totalResults > 0 && (
            <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)' }}>
              {([['all', `All (${totalResults})`], ['packs', `Packs (${filteredPacks.length})`]] as const).map(([t, label]) => (
                <button key={t} onClick={() => setTab(t)} style={{
                  padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer',
                  color: tab === t ? 'var(--accent-purple)' : 'var(--text-secondary)',
                  fontWeight: tab === t ? 700 : 400, fontSize: 14,
                  borderBottom: `2px solid ${tab === t ? 'var(--accent-purple)' : 'transparent'}`,
                  marginBottom: -1, transition: 'color 0.15s',
                }}>{label}</button>
              ))}
            </div>
          )}

          {/* Results */}
          {tab === 'packs' && filteredPacks.length > 0 && (
            <div className="pack-grid">
              {filteredPacks.map(p => <PackCard key={p.id} pack={p} />)}
            </div>
          )}

          {tab === 'all' && totalResults > 0 && (
            <>
              {filteredPacks.length > 0 && (
                <section style={{ marginBottom: 40 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 14px' }}>📦 Packs</h2>
                  <div className="pack-grid">
                    {filteredPacks.map(p => <PackCard key={p.id} pack={p} />)}
                  </div>
                </section>
              )}
              {filteredAssets.length > 0 && (
                <section>
                  <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 14px' }}>
                    🐜 Items <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 13 }}>{filteredAssets.length}</span>
                  </h2>
                  <div className="asset-grid">
                    {filteredAssets.map(a => <AssetCard key={a.id} asset={a} />)}
                  </div>
                </section>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
