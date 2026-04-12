'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import type { Category, Asset, AssetTag } from '@/types'

export default function EditAssetPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [existingTags, setExistingTags] = useState<AssetTag[]>([])
  const [form, setForm] = useState({
    title: '', slug: '', description: '', category_id: '',
    tags: '', featured: false, is_published: false,
  })
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('assets').select('*, tags:asset_tags(*)').eq('id', id).single(),
      supabase.from('categories').select('*').order('name'),
    ]).then(([assetRes, catsRes]) => {
      const asset = assetRes.data as Asset & { tags: AssetTag[] }
      if (asset) {
        setExistingTags(asset.tags ?? [])
        setPreview(asset.thumbnail_url ?? asset.file_url)
        setForm({
          title: asset.title,
          slug: asset.slug,
          description: asset.description ?? '',
          category_id: asset.category_id ?? '',
          tags: asset.tags?.map(t => t.tag).join(', ') ?? '',
          featured: asset.featured,
          is_published: asset.is_published,
        })
      }
      setCategories((catsRes.data as Category[]) ?? [])
      setLoading(false)
    })
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()

    const { error } = await supabase.from('assets').update({
      title: form.title,
      slug: form.slug,
      description: form.description || null,
      category_id: form.category_id || null,
      featured: form.featured,
      is_published: form.is_published,
      updated_at: new Date().toISOString(),
    }).eq('id', id)

    if (error) {
      toast.error(error.message)
      setSaving(false)
      return
    }

    // Sync tags: delete old, insert new
    const newTags = form.tags.split(',').map(t => t.trim()).filter(Boolean)
    await supabase.from('asset_tags').delete().eq('asset_id', id)
    if (newTags.length > 0) {
      await supabase.from('asset_tags').insert(newTags.map(tag => ({ asset_id: id, tag })))
    }

    toast.success('Asset updated!')
    router.push('/admin/assets')
    setSaving(false)
  }

  const label = (text: string) => (
    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
      {text}
    </label>
  )

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80 }}>
      <div className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  )

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 4px' }}>✏️ Edit Asset</h1>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 14 }}>{form.title}</p>
      </div>

      {preview && (
        <div className="card-glow" style={{ padding: 16, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 140, background: 'var(--bg-surface)' }}>
          <img src={preview} alt="" style={{ maxWidth: 120, maxHeight: 120, objectFit: 'contain' }} />
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="card-glow" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            {label('Title *')}
            <input className="input" value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
          </div>

          <div>
            {label('Slug')}
            <input className="input" value={form.slug}
              onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} />
          </div>

          <div>
            {label('Description')}
            <textarea className="input" value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3} style={{ resize: 'vertical' }} />
          </div>

          <div>
            {label('Tags (comma separated)')}
            <input className="input" value={form.tags}
              onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
              placeholder="tag1, tag2, tag3" />
          </div>

          <div>
            {label('Category')}
            <select className="input" value={form.category_id}
              onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}>
              <option value="">No category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 24 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
              <input type="checkbox" checked={form.featured}
                onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} /> Featured
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
              <input type="checkbox" checked={form.is_published}
                onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))} /> Published
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button type="submit" disabled={saving} className="btn-primary" style={{ flex: 1, justifyContent: 'center', height: 48 }}>
            {saving ? <><span className="spinner" style={{ width: 18, height: 18 }} /> Saving…</> : '💾 Save Changes'}
          </button>
          <button type="button" onClick={() => router.back()} className="btn-secondary" style={{ height: 48 }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
