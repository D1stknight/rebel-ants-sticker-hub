'use client'

import type { Category, AssetType } from '@/types'

interface FilterBarProps {
  typeFilter: AssetType | 'all'
  onTypeChange: (t: AssetType | 'all') => void
  categories: Category[]
  categoryFilter: string
  onCategoryChange: (slug: string) => void
}

export default function FilterBar({ typeFilter, onTypeChange, categories, categoryFilter, onCategoryChange }: FilterBarProps) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {/* Type filters */}
      {(['all', 'sticker', 'gif'] as const).map(t => (
        <button
          key={t}
          onClick={() => onTypeChange(t)}
          style={{
            padding: '8px 16px',
            borderRadius: 999,
            border: `1px solid ${typeFilter === t ? 'var(--accent-purple)' : 'var(--border)'}`,
            background: typeFilter === t ? 'rgba(139,92,246,0.15)' : 'var(--bg-card)',
            color: typeFilter === t ? 'var(--accent-purple)' : 'var(--text-secondary)',
            fontWeight: typeFilter === t ? 600 : 400,
            fontSize: 13,
            cursor: 'pointer',
            transition: 'all 0.15s',
            whiteSpace: 'nowrap',
            minHeight: 36,
          }}
        >
          {t === 'all' ? '🐜 All' : t === 'gif' ? '✨ GIFs' : '🖼️ Stickers'}
        </button>
      ))}

      {/* Divider */}
      {categories.length > 0 && (
        <div style={{ width: 1, background: 'var(--border)', margin: '0 4px', alignSelf: 'stretch' }} />
      )}

      {/* Category filters */}
      {categories.map(cat => (
        <button
          key={cat.id}
          onClick={() => onCategoryChange(categoryFilter === cat.slug ? '' : cat.slug)}
          style={{
            padding: '8px 16px',
            borderRadius: 999,
            border: `1px solid ${categoryFilter === cat.slug ? 'var(--accent-blue)' : 'var(--border)'}`,
            background: categoryFilter === cat.slug ? 'rgba(59,130,246,0.15)' : 'var(--bg-card)',
            color: categoryFilter === cat.slug ? 'var(--accent-blue)' : 'var(--text-secondary)',
            fontWeight: categoryFilter === cat.slug ? 600 : 400,
            fontSize: 13,
            cursor: 'pointer',
            transition: 'all 0.15s',
            whiteSpace: 'nowrap',
            minHeight: 36,
          }}
        >
          {cat.name}
        </button>
      ))}
    </div>
  )
}
