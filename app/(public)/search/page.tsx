'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useDebouncedCallback } from 'use-debounce'
import AssetCard from '@/components/ui/AssetCard'
import PackCard from '@/components/ui/PackCard'
import FilterBar from '@/components/ui/FilterBar'
import SkeletonGrid from '@/components/ui/SkeletonGrid'
import type { Asset, Pack, Category, AssetType } from '@/types'

type Tab = 'packs' | 'items'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<Tab>('packs')
  const [typeFilter, setTypeFilter] = useState<AssetType | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [assets, setAssets] = useState<Asset[]>([])
  const [packs, setPacks] = useState<Pack[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    createClient().from('categories').select('*').order('name')
      .then(({ data }) => setCategories((data as Category[]) ?? []))
  }, [])

  const runSearch = useDebouncedCallback(async (q: string, type: AssetType | 'all', cat: string) => {
    setLoading(true)
    setSearched(true)
    const supabase = createClient()

    const [assetsRes, packsRes] = await Promise.all([
      supabase
        .from('assets')
        .select('*, tags:asset_tags(*), category:categories(*)')
        .eq('is_published', true)
        .ilike('title', `%${q}%`)
        .order('created_at', { ascending: false })
        .limit(80),
      supabase
        .from('packs')
        .select('*, category:categories(*), item_count:pack_items(count)')
        .eq('is_published', true)
        .ilike('title', `%${q}%`)
        .order('created_at', { ascending: false })
        .limit(40),
    ])

    let a = (assetsRes.data as Asset[]) ?? []
    let p = (packsRes.data as Pack[]) ?? []

    if (type !== 'all') {
      a = a.filter(x => x.type === type)
      p = p.filter(x => x.type === type)
    }
    if (cat) {
      a = a.filter(x => x.category?.slug === cat)
      p = p.filter(x => x.category?.slug === cat)
    }

    setAssets(a)
    setPacks(p)
    setLoading(false)
  }, 350)

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    if (val.length >= 1) runSearch(val, typeFilter, categoryFilter)
  }, [runSearch, typeFilter, categoryFilter])

  const handleTypeChange = (t: AssetType | 'all') => {
    setTypeFilter(t)
    if (query) runSearch(query, t, categoryFilter)
  }

  const handleCatChange = (c: string) => {
    setCategoryFilter(c)
    if (query) runSearch(query, typeFilter, c)
  }

  return (
    <div style={{ paddingTop: 32, paddingBottom: 64 }}>
      <h1 style={{ fontSize: 28, fontWeight: 900, margin: '0 0 24px', letterSpacing: '-0.02em' }}>
        🔍 Search
      </h1>

      {/* Search input */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2}
          style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}>
          <circle cx="8" cy="8" r="5" />
          <path d="M16 16l-3.5-3.5" strokeLinecap="round" />
        </svg>
        <input
          autoFocus
          type="search"
          className="input"
          style={{ paddingLeft: 46, fontSize: 16, height: 52 }}
          placeholder="Search packs, stickers, GIFs…"
          value={query}
          onChange={handleInput}
        />
      </div>

      {/* Filters */}
      <div style={{ overflowX: 'auto', paddingBottom: 4, marginBottom: 24 }}>
        <FilterBar
          typeFilter={typeFilter}
          onTypeChange={handleTypeChange}
          categories={categories}
          categoryFilter={categoryFilter}
          onCategoryChange={handleCatChange}
        />
      </div>

      {/* Tabs */}
      {searched && !loading && (
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
          {([['packs', `Packs (${packs.length})`], ['items', `Items (${assets.length})`]] as const).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer',
              color: tab === t ? 'var(--accent-purple)' : 'var(--text-secondary)',
              fontWeight: tab === t ? 700 : 400, fontSize: 14,
              borderBottom: `2px solid ${tab === t ? 'var(--accent-purple)' : 'transparent'}`,
              marginBottom: -1, transition: 'color 0.15s',
            }}>
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      {loading && <SkeletonGrid count={8} type={tab === 'packs' ? 'pack' : 'asset'} />}

      {!loading && !searched && (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🐜</div>
          <p style={{ color: 'var(--text-secondary)' }}>Start typing to search the colony…</p>
        </div>
      )}

      {!loading && searched && tab === 'packs' && (
        packs.length === 0 ? <NoResults term={query} /> : (
          <div className="pack-grid">
            {packs.map(p => <PackCard key={p.id} pack={p} />)}
          </div>
        )
      )}

      {!loading && searched && tab === 'items' && (
        assets.length === 0 ? <NoResults term={query} /> : (
          <div className="asset-grid">
            {assets.map(a => <AssetCard key={a.id} asset={a} />)}
          </div>
        )
      )}
    </div>
  )
}

function NoResults({ term }: { term: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 0' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>😔</div>
      <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>No results for "{term}"</p>
      <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Try different keywords or browse the categories.</p>
    </div>
  )
}
