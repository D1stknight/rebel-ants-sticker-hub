'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { slugify } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Category, CategoryType } from '@/types'

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', type: 'both' as CategoryType })

  const load = async () => {
    const { data } = await createClient().from('categories').select('*').order('name')
    setCategories((data as Category[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('categories').insert({
      name: form.name.trim(),
      slug: slugify(form.name),
      type: form.type,
    })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Category added!')
      setForm({ name: '', type: 'both' })
      load()
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category? Packs using it will be uncategorised.')) return
    setDeleting(id)
    const { error } = await createClient().from('categories').delete().eq('id', id)
    if (error) toast.error(error.message)
    else { toast.success('Deleted'); load() }
    setDeleting(null)
  }

  const typeLabel: Record<CategoryType, string> = {
    sticker: '🖼️ Stickers',
    gif: '✨ GIFs',
    both: '🐜 Both',
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 4px' }}>🏷️ Categories</h1>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 14 }}>
          Organise packs and assets into categories
        </p>
      </div>

      {/* Add form */}
      <div className="card-glow" style={{ padding: 20, marginBottom: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 16px' }}>Add Category</h2>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input
            className="input"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Category name…"
            style={{ flex: 2, minWidth: 180 }}
            required
          />
          <select
            className="input"
            value={form.type}
            onChange={e => setForm(f => ({ ...f, type: e.target.value as CategoryType }))}
            style={{ flex: 1, minWidth: 120 }}
          >
            <option value="both">🐜 Both</option>
            <option value="sticker">🖼️ Stickers</option>
            <option value="gif">✨ GIFs</option>
          </select>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary"
            style={{ whiteSpace: 'nowrap' }}
          >
            {saving ? <span className="spinner" style={{ width: 16, height: 16 }} /> : '+ Add'}
          </button>
        </form>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div className="spinner" style={{ margin: '0 auto' }} />
        </div>
      ) : categories.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏷️</div>
          <p>No categories yet. Add your first one above.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {categories.map(cat => (
            <div
              key={cat.id}
              className="card-glow"
              style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{cat.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'monospace' }}>
                  /{cat.slug}
                </div>
              </div>

              <span className={`badge ${cat.type === 'gif' ? 'badge-pink' : cat.type === 'sticker' ? 'badge-purple' : 'badge-blue'}`}>
                {typeLabel[cat.type]}
              </span>

              <button
                onClick={() => handleDelete(cat.id)}
                disabled={deleting === cat.id}
                className="btn-ghost"
                style={{ padding: '8px 12px', color: '#ef4444', fontSize: 13 }}
              >
                {deleting === cat.id ? <span className="spinner" style={{ width: 14, height: 14 }} /> : '🗑 Delete'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
