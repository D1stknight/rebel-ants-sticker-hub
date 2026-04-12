'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import PackCard from '@/components/ui/PackCard'
import SearchBar from '@/components/ui/SearchBar'
import FilterBar from '@/components/ui/FilterBar'
import SkeletonGrid from '@/components/ui/SkeletonGrid'
import type { Pack, Category } from '@/types'

export default function StickersPage() {
  const [packs, setPacks] = useState<Pack[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase
        .from('packs')
        .select('*, category:categories(*), item_count:pack_items(count)')
        .eq('is_published', true)
        .eq('type', 'sticker')
        .order('created_at', { ascending: false }),
      supabase.from('categories').select('*').in('type', ['sticker', 'both']).order('name'),
    ]).then(([packsRes, catsRes]) => {
      setPacks((packsRes.data as Pack[]) ?? [])
      setCategories((catsRes.data as Category[]) ?? [])
      setLoading(false)
    })
  }, [])

  const filtered = packs.filter(p => {
    const matchQ = !query || p.title.toLowerCase().includes(query.toLowerCase())
    const matchC = !categoryFilter || p.category?.slug === categoryFilter
    return matchQ && matchC
  })

  return (
    <div style={{ paddingTop: 32, paddingBottom: 64 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, margin: '0 0 6px', letterSpacing: '-0.02em' }}>
          🖼️ Sticker Packs
        </h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
          Official Rebel Ants stickers for iMessage, Telegram, Discord & more.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
        <SearchBar value={query} onChange={setQuery} placeholder="Search sticker packs…" />
        {categories.length > 0 && (
          <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
            <FilterBar
              typeFilter="sticker"
              onTypeChange={() => {}}
              categories={categories}
              categoryFilter={categoryFilter}
              onCategoryChange={setCategoryFilter}
            />
          </div>
        )}
      </div>

      {loading ? (
        <SkeletonGrid count={8} type="pack" />
      ) : filtered.length === 0 ? (
        <EmptyState query={query} />
      ) : (
        <>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
            {filtered.length} pack{filtered.length !== 1 ? 's' : ''}
          </p>
          <div className="pack-grid">
            {filtered.map(pack => <PackCard key={pack.id} pack={pack} />)}
          </div>
        </>
      )}
    </div>
  )
}

function EmptyState({ query }: { query: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '80px 0' }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div>
      <h3 style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
        {query ? `No results for "${query}"` : 'No sticker packs yet'}
      </h3>
      <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
        {query ? 'Try a different search term.' : 'Check back soon — the colony is busy.'}
      </p>
    </div>
  )
}
